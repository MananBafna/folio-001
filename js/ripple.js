/* RippleDistortion, ported from React Bits (JS + CSS variant) to a vanilla
   ES module. Dependency: ogl, loaded from the jsDelivr ESM CDN.
   Pointer movement lays ripples over an image; a displacement buffer
   refracts it with swirl, tint, and glint. */

import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';

const MAX_WAVES = 100;
const QUALITY_SCALE = { low: 0.4, medium: 0.7, high: 1 };
const START_SCALE = 1.5;
const LIFE_CONSTANT = Math.log(500);

const waveVertex = /* glsl */ `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;
varying vec2 vUv;
varying float vOpacity;
void main() {
  vUv = uv;
  vOpacity = iOpacity;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}`;

const waveFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying float vOpacity;
uniform float uRings;
const float PI = 3.141592653589793;
const float EDGE = 0.006737947;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;
  float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
  brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}`;

const screenVertex = /* glsl */ `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const compositeFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uTexel;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uStrength;
uniform float uSwirl;
uniform float uDispersion;
uniform float uGlint;
uniform float uTintAmount;
uniform float uGrayscale;
const float TAU = 6.283185307179586;
vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0));
  vec2 s = uResolution / safe;
  vec2 scaledSize = safe * max(s.x, s.y);
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}
void main() {
  float amount = texture2D(uDisplacement, vUv).r;
  vec2 base = coverUV(vUv);
  float theta = amount * uSwirl * TAU;
  vec2 dir = vec2(sin(theta), cos(theta));
  vec2 push = dir * amount * uStrength;
  vec3 color;
  if (uDispersion > 0.001) {
    float split = uDispersion * 0.25;
    color.r = texture2D(uTexture, base + push * (1.0 + split)).r;
    color.g = texture2D(uTexture, base + push).g;
    color.b = texture2D(uTexture, base + push * (1.0 - split)).b;
  } else {
    color = texture2D(uTexture, base + push).rgb;
  }
  if (uGrayscale > 0.001) {
    color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGrayscale);
  }
  if (uTintAmount > 0.001) {
    color = mix(color, color * uTint * 1.9, clamp(amount * 1.6, 0.0, 1.0) * uTintAmount);
  }
  if (uGlint > 0.001) {
    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
    vec3 normal = normalize(vec3(-ex * 26.0, -ey * 26.0, 1.0));
    vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
    float raw = pow(max(dot(normal, light), 0.0), 22.0);
    float flatSpec = pow(max(light.z, 0.0), 22.0);
    color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0) * uGlint;
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const hexToRGB = (hex) => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const CONFIG = {
  brushSize: 150,
  strength: 0.12,
  swirl: 1.5,
  rings: 2,
  spread: 6,
  fade: 2.4,
  spacing: 14,
  dispersion: 0.55,
  glint: 0.75,
  tint: '#ffffff',
  tintAmount: 0.06,
  grayscale: 0,
  highlightColor: '#fff8e0',
  clickStrength: 1.8,
  quality: 'medium',
};

/* Brand-colored painted field: forest gradient + soft color washes + grain.
   Generated locally so the palette is exact and the texture is baked in. */
function makeFieldTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#ffe14a');
  g.addColorStop(1, '#ffd42e');
  x.fillStyle = g;
  x.fillRect(0, 0, 2048, 1024);
  const blobs = [
    [540, 260, 560, '#ffe873', 0.2],
    [1610, 340, 500, '#fff3b8', 0.18],
    [1130, 820, 640, '#ffb547', 0.12],
    [200, 850, 460, '#d8552f', 0.07],
    [1860, 870, 400, '#ffe873', 0.14],
  ];
  blobs.forEach(([bx, by, r, col, a]) => {
    const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = a;
    x.fillStyle = rg;
    x.fillRect(0, 0, 2048, 1024);
  });
  x.globalAlpha = 1;
  /* soft dappled mottling: organic tonal variation that looks calm at rest
     but bends visibly when displaced; the glint supplies the wet sheen */
  for (let i = 0; i < 170; i++) {
    const bx = Math.random() * 2048;
    const by = Math.random() * 1024;
    const r = 40 + Math.random() * 130;
    const light = Math.random() > 0.4;
    const col = light ? (Math.random() > 0.8 ? '#fff8d6' : '#ffefa8') : '#eec22e';
    const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = 0.025 + Math.random() * 0.04;
    x.fillStyle = rg;
    x.fillRect(bx - r, by - r, r * 2, r * 2);
  }
  x.globalAlpha = 1;
  const img = x.getImageData(0, 0, 2048, 1024);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  return c;
}

function init() {
  const mount = document.querySelector('[data-ripple]');
  if (!mount) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let renderer;
  try {
    renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
  } catch (e) {
    return;
  }
  /* clearColor MUST stay black: the displacement buffer is cleared with it,
     and a non-black clear reads as full-field displacement (no visible ripples) */
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 1);
  const canvas = gl.canvas;
  mount.appendChild(canvas);

  const imageTexture = new Texture(gl, {
    generateMipmaps: false,
    minFilter: gl.LINEAR, magFilter: gl.LINEAR,
    wrapS: gl.MIRRORED_REPEAT, wrapT: gl.MIRRORED_REPEAT,
  });
  const field = makeFieldTexture();
  imageTexture.image = field;

  const offsets = new Float32Array(MAX_WAVES * 2);
  const scales = new Float32Array(MAX_WAVES * 2);
  const opacities = new Float32Array(MAX_WAVES);
  const waves = Array.from({ length: MAX_WAVES }, () => ({ x: 0, y: 0, scale: START_SCALE, target: START_SCALE, size: 1, opacity: 0 }));
  let current = 0;

  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
    uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
    iOffset: { instanced: 1, size: 2, data: offsets },
    iScale: { instanced: 1, size: 2, data: scales },
    iOpacity: { instanced: 1, size: 1, data: opacities },
  });

  const waveProgram = new Program(gl, {
    vertex: waveVertex,
    fragment: waveFragment,
    uniforms: { uRings: { value: CONFIG.rings } },
    transparent: true, depthTest: false, depthWrite: false, cullFace: false,
  });
  waveProgram.setBlendFunc(gl.ONE, gl.ONE);
  const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });

  const displacementTarget = new RenderTarget(gl, {
    width: 2, height: 2, depth: false,
    minFilter: gl.LINEAR, magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE,
  });

  const compositeUniforms = {
    uTexture: { value: imageTexture },
    uDisplacement: { value: displacementTarget.texture },
    uResolution: { value: [1, 1] },
    uTextureSize: { value: [2048, 1024] },
    uTexel: { value: [1, 1] },
    uTint: { value: hexToRGB(CONFIG.tint) },
    uHighlight: { value: hexToRGB(CONFIG.highlightColor) },
    uStrength: { value: CONFIG.strength },
    uSwirl: { value: CONFIG.swirl },
    uDispersion: { value: CONFIG.dispersion },
    uGlint: { value: CONFIG.glint },
    uTintAmount: { value: CONFIG.tintAmount },
    uGrayscale: { value: CONFIG.grayscale },
  };
  const compositeMesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: screenVertex, fragment: compositeFragment, uniforms: compositeUniforms, depthTest: false, depthWrite: false }),
  });

  let width = 1, height = 1;
  const resize = () => {
    width = Math.max(1, mount.clientWidth);
    height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    compositeUniforms.uResolution.value = [width, height];
    const scale = QUALITY_SCALE[CONFIG.quality];
    const fw = Math.max(2, Math.round(width * scale));
    const fh = Math.max(2, Math.round(height * scale));
    displacementTarget.setSize(fw, fh);
    compositeUniforms.uTexel.value = [1 / fw, 1 / fh];
  };
  new ResizeObserver(resize).observe(mount);
  resize();

  const setNewWave = (x, y, power) => {
    const wave = waves[current];
    current = (current + 1) % MAX_WAVES;
    wave.x = x; wave.y = y;
    wave.scale = START_SCALE * power;
    wave.target = START_SCALE * CONFIG.spread * power;
    wave.size = CONFIG.brushSize;
    wave.opacity = 1;
  };

  const localPoint = (cx, cy) => {
    const rect = mount.getBoundingClientRect();
    if (rect.width === 0 || cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) return null;
    return [cx - rect.left, rect.height - (cy - rect.top)];
  };

  let px = 0, py = 0;
  window.addEventListener('pointermove', (e) => {
    const point = localPoint(e.clientX, e.clientY);
    if (!point) return;
    if (Math.abs(point[0] - px) > CONFIG.spacing || Math.abs(point[1] - py) > CONFIG.spacing) {
      setNewWave(point[0], point[1], 1);
      px = point[0]; py = point[1];
    }
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    const point = localPoint(e.clientX, e.clientY);
    if (!point) return;
    setNewWave(point[0], point[1], CONFIG.clickStrength);
  }, { passive: true });

  let prevTime = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    const delta = prevTime ? Math.min(0.05, (now - prevTime) / 1000) : 0;
    prevTime = now;
    const growth = 1 - Math.exp(-delta * 1.09);
    const decay = Math.exp((-delta * LIFE_CONSTANT) / CONFIG.fade);
    for (let i = 0; i < MAX_WAVES; i++) {
      const w = waves[i];
      if (w.opacity <= 0) { opacities[i] = 0; continue; }
      w.opacity *= decay;
      w.scale += (w.target - w.scale) * growth;
      if (w.opacity < 0.002) { w.opacity = 0; opacities[i] = 0; continue; }
      const half = (w.scale * w.size) / 2;
      offsets[i * 2] = (w.x / width) * 2 - 1;
      offsets[i * 2 + 1] = (w.y / height) * 2 - 1;
      scales[i * 2] = (half / width) * 2;
      scales[i * 2 + 1] = (half / height) * 2;
      opacities[i] = w.opacity;
    }
    geometry.attributes.iOffset.needsUpdate = true;
    geometry.attributes.iScale.needsUpdate = true;
    geometry.attributes.iOpacity.needsUpdate = true;
    renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });
    renderer.render({ scene: compositeMesh });
  };
  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
