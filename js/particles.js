/* ParticleText, ported from React Bits to vanilla JS.
   Samples a word into canvas particles that gather into place,
   drift at rest, and repel from the pointer. */

(function () {
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const hexToRgb = (hex) => {
    const clean = hex.replace('#', '').trim();
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  };
  const mixRgb = (a, b, t) => ({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });

  window.initParticleMast = function (container, options) {
    const opts = Object.assign({
      text: 'MANAN BAFNA',
      color: '#f0cf4a',
      highlightColor: '#f2b8c6',
      particleSize: 2,
      density: 4,
      scatter: 170,
      gatherDuration: 1500,
      stagger: 420,
      pointerRepel: 42,
      repelRadius: 120,
      idleDrift: 0.65,
      fontFamily: 'Anton, sans-serif',
    }, options || {});

    const canvas = container.querySelector('canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let particles = [];
    let raf = null;
    let gathering = false;
    let gatherStart = 0;
    let width = 0;
    let height = 0;
    let visible = false;
    let built = false;

    const pointer = { active: false, x: 0, y: 0, sx: 0, sy: 0 };

    const startGather = (fromScatter) => {
      if (!particles.length) return;
      const now = performance.now();
      particles.forEach((p) => {
        if (fromScatter) {
          const angle = p.seed * Math.PI * 2;
          const dist = opts.scatter * (0.35 + p.depth * 0.75);
          p.x = p.tx + Math.cos(angle) * dist;
          p.y = p.ty + Math.sin(angle) * dist;
        }
        p.startX = p.x;
        p.startY = p.y;
        p.delay = p.seed * opts.stagger;
      });
      gatherStart = now;
      gathering = true;
    };

    const render = (now) => {
      raf = visible ? requestAnimationFrame(render) : null;
      if (!visible) return;
      ctx.clearRect(0, 0, width, height);
      pointer.sx += (pointer.x - pointer.sx) * 0.18;
      pointer.sy += (pointer.y - pointer.sy) * 0.18;

      let complete = true;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let bx = p.tx;
        let by = p.ty;
        let progress = 1;

        if (gathering) {
          const local = (now - gatherStart - p.delay) / opts.gatherDuration;
          progress = clamp(local, 0, 1);
          const e = easeOutCubic(progress);
          bx = p.startX + (p.tx - p.startX) * e;
          by = p.startY + (p.ty - p.startY) * e;
          if (progress < 1) complete = false;
        } else if (opts.idleDrift > 0) {
          const t = now * 0.001;
          bx += Math.sin(t * 0.9 + p.seed * 10) * opts.idleDrift * p.depth;
          by += Math.cos(t * 0.75 + p.depth * 10) * opts.idleDrift * p.depth;
        }

        if (pointer.active) {
          const dx = bx - pointer.sx;
          const dy = by - pointer.sy;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < opts.repelRadius) {
            const force = Math.pow(1 - d / opts.repelRadius, 2) * opts.pointerRepel;
            bx += (dx / d) * force;
            by += (dy / d) * force;
          }
        }

        p.x += (bx - p.x) * 0.22;
        p.y += (by - p.y) * 0.22;

        ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (gathering && complete) gathering = false;
    };

    const ensureLoop = () => {
      if (raf === null && visible) raf = requestAnimationFrame(render);
    };

    const sample = async () => {
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let size = Math.min(height * 0.82, width * 0.135);
      let font = `400 ${size}px ${opts.fontFamily}`;
      try { await document.fonts.load(font); await document.fonts.ready; } catch (e) {}

      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      offCtx.font = font;
      let m = offCtx.measureText(opts.text);
      if (m.width > width * 0.94) {
        size *= (width * 0.94) / m.width;
        font = `400 ${size}px ${opts.fontFamily}`;
        offCtx.font = font;
        m = offCtx.measureText(opts.text);
      }
      const ascent = Math.ceil(m.actualBoundingBoxAscent || size * 0.8);
      const descent = Math.ceil(m.actualBoundingBoxDescent || size * 0.2);
      const pad = 14;
      off.width = Math.ceil(m.width) + pad * 2;
      off.height = ascent + descent + pad * 2;
      offCtx.font = font;
      offCtx.fillStyle = '#fff';
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillText(opts.text, pad, pad + ascent);

      const data = offCtx.getImageData(0, 0, off.width, off.height).data;
      const targets = [];
      const step = Math.max(2, opts.density);
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const alpha = data[(y * off.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: width / 2 - off.width / 2 + x,
              y: height / 2 - off.height / 2 + y,
              a: alpha / 255,
            });
          }
        }
      }

      const maxParticles = 4200;
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const base = hexToRgb(opts.color);
      const hi = hexToRgb(opts.highlightColor);

      particles = targets.filter((_, i) => i % stride === 0).map((t, i) => {
        const seed = ((i * 9301 + 49297) % 233280) / 233280;
        const depth = 0.45 + (((i * 233 + 97) % 1000) / 1000) * 0.9;
        const blend = clamp(t.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1);
        const c = mixRgb(base, hi, blend);
        const angle = seed * Math.PI * 2;
        const dist = opts.scatter * (0.35 + depth * 0.75);
        return {
          x: t.x + Math.cos(angle) * dist,
          y: t.y + Math.sin(angle) * dist,
          startX: 0, startY: 0,
          tx: t.x, ty: t.y,
          size: Math.max(0.7, opts.particleSize * (0.75 + t.a * 0.45)),
          color: `rgb(${c.r}, ${c.g}, ${c.b})`,
          seed, depth,
          delay: seed * opts.stagger,
        };
      });

      pointer.x = width / 2; pointer.y = height / 2;
      pointer.sx = pointer.x; pointer.sy = pointer.y;
      built = true;
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x > -40 && pointer.x < width + 40 && pointer.y > -40 && pointer.y < height + 40;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) ensureLoop();
    }, { rootMargin: '80px' });
    io.observe(container);

    const ro = new ResizeObserver(() => { sample().then(() => { startGather(false); ensureLoop(); }); });
    ro.observe(container);

    sample();

    return {
      gather() {
        const go = () => { startGather(true); ensureLoop(); };
        built ? go() : sample().then(go);
      },
    };
  };
})();
