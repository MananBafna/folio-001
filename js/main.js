/* Manan Bafna · folio 001 · motion system
   Lenis smooth scroll + GSAP ScrollTrigger choreography.
   Everything here ENHANCES a page that is fully readable without JS. */

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loader = document.querySelector(".loader");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ------------------------------------------------ hero mark
     Sizes the SVG clip text to the layout, then paints a flowing
     brand-color field that shows through the letterforms.
     Runs regardless of reduced-motion (static paint in that case). */
  (function initHeroMark() {
    const mark = document.querySelector(".hero-mark");
    const mk1 = document.getElementById("mk1");
    const mk2 = document.getElementById("mk2");
    const flow = document.querySelector(".hero-flow");
    if (!mark || !mk1 || !mk2 || !flow) return;
    const ctx = flow.getContext("2d");
    if (!ctx) return;
    /* per-word bands (canvas px) so both words get the same gold sheen */
    let bands = [];

    const layout = () => {
      const w = mark.clientWidth;
      if (!w) return;
      const ih = window.innerHeight;
      /* staggered two-line lockup: Manan top-left, Bafna bottom-right,
         height-capped so the hero always fits the viewport */
      const wide = w / ih > 1.1;
      mk1.textContent = "Manan";
      mk2.textContent = "Bafna";
      mk1.setAttribute("x", 0);
      mk1.style.fontSize = "100px";
      mk2.style.fontSize = "100px";
      const len1 = mk1.getComputedTextLength() || 300;
      const len2 = mk2.getComputedTextLength() || 280;
      const share = wide ? 0.8 : 1.0;
      const inset = wide ? w * 0.07 : 0;
      let fs1 = (100 * w * share) / len1;
      /* cap the lockup so tall screens keep air between the nav and the name */
      const maxH = wide ? Math.max(240, Math.min(ih - 480, ih * 0.5)) : ih * 0.62;
      if (fs1 * 1.72 > maxH) fs1 = maxH / 1.72;
      const fs2 = Math.min(fs1, (100 * w * share) / len2);
      mk1.style.fontSize = fs1 + "px";
      mk2.style.fontSize = fs2 + "px";
      const len2px = (len2 * fs2) / 100;
      const y1 = fs1 * 0.76;
      const y2 = y1 + fs2 * 0.86;
      mk1.setAttribute("x", inset);
      mk1.setAttribute("y", y1);
      mk2.setAttribute("y", y2);
      mk2.setAttribute("x", Math.max(0, w - len2px - inset));
      const h = y2 + fs2 * 0.16;
      mark.style.height = h + "px";
      flow.width = 880;
      flow.height = Math.max(160, Math.round((880 * h) / w));
      /* map mark-space y to canvas px through the canvas's 112%/120%
         oversize and -6%/-10%(of height) offsets */
      const toPx = (y) => ((y + 0.10 * h) / (1.20 * h)) * flow.height;
      bands = [
        { t: toPx(y1 - fs1 * 0.78), b: toPx(y1 + fs1 * 0.05) },
        { t: toPx(y2 - fs2 * 0.78), b: toPx(y2 + fs2 * 0.05) },
      ];
      /* park the chips in the pocket left of "Bafna", measured from the type */
      const chips = document.querySelector(".hero-chips");
      if (chips && window.innerWidth >= 900) {
        chips.style.top = Math.round(y1 + fs2 * 0.14) + "px";
      }
    };

    const BASE = "#f0ce41";
    const BLOBS = [
      { c: "#ffe071", r: 0.55, sx: 0.90, sy: 0.60, px: 0.0, py: 2.0 },
      { c: "#f2b64a", r: 0.42, sx: 0.50, sy: 1.10, px: 2.2, py: 4.1 },
      { c: "#f2a83c", r: 0.30, sx: 1.20, sy: 0.80, px: 4.0, py: 1.0 },
      { c: "#ffd84f", r: 0.48, sx: 0.70, sy: 0.50, px: 1.2, py: 5.2 },
    ];
    const paint = (t) => {
      const W = flow.width, H = flow.height;
      ctx.fillStyle = BASE;
      ctx.fillRect(0, 0, W, H);
      BLOBS.forEach((b) => {
        const x = (0.5 + 0.44 * Math.sin(t * 0.00022 * b.sx + b.px)) * W;
        const y = (0.5 + 0.42 * Math.cos(t * 0.00019 * b.sy + b.py)) * H;
        const r = b.r * W * 0.55;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, b.c);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
      ctx.globalAlpha = 1;
      bands.forEach((band) => {
        const g2 = ctx.createLinearGradient(0, band.t, 0, band.b);
        g2.addColorStop(0, "rgba(255,233,140,0.95)");
        g2.addColorStop(0.5, "rgba(247,208,74,0.12)");
        g2.addColorStop(0.85, "rgba(236,182,72,0.32)");
        g2.addColorStop(1, "rgba(220,162,58,0.5)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, band.t, W, band.b - band.t);
      });
    };

    const ready = document.fonts && document.fonts.load
      ? document.fonts.load('800 100px "Bricolage Grotesque"').then(() => document.fonts.ready).catch(() => {})
      : Promise.resolve();
    Promise.resolve(ready).then(() => {
      layout();
      paint(0);
      if (!reduced) {
        const loop = (t) => { paint(t); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
      new ResizeObserver(layout).observe(mark);
    });
  })();

  if (reduced) {
    document.querySelectorAll("video[autoplay]").forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }
  if (!window.gsap || reduced) {
    if (loader) loader.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  if (window.ScrambleTextPlugin) gsap.registerPlugin(ScrambleTextPlugin);
  const scramble = !!window.ScrambleTextPlugin;

  /* ---------------------------------------------- lenis */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      });
    });
  }

  /* ---------------------------------------------- preloader → hero intro */
  const heroIntro = gsap.timeline({ paused: true });
  heroIntro
    .fromTo(".hero-mark", { scale: 1.05, yPercent: 3 }, { scale: 1, yPercent: 0, duration: 1.1, ease: "power3.out" })
    .from(".hero-photo", { scale: 0, rotate: 28, duration: 0.8, ease: "back.out(1.5)" }, 0.15)
    .from(".hero-chips .chip", { scale: 0, x: -30, duration: 0.6, ease: "back.out(1.8)", stagger: 0.09 }, 0.25)
    .from(".hero-badge", { scale: 0, rotate: -40, duration: 0.9, ease: "back.out(1.6)" }, 0.35)
    .from(".sticker, .shape", { scale: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.09 }, 0.4)
    .from(".hero-foot > *", { opacity: 0, y: 26, duration: 0.8, ease: "power3.out", stagger: 0.1 }, 0.4)
    .from(".nav", { opacity: 0, y: -18, duration: 0.7, ease: "power3.out" }, 0.5)
    .from(".canon", { opacity: 0, duration: 0.8 }, 0.6);

  if (loader) {
    /* stamp overture: an orbiting ring turns while BUILDS / SHIPS / REPEATS
       slam down one by one like rubber stamps (with screen shake); the words
       get sucked into the orbit and the aperture tears open over the name
       with a shockwave ring. Click anywhere to skip. */
    const veil = loader.querySelector("[data-veil]");
    const scene = loader.querySelector("[data-scene]");
    const ast = loader.querySelector("[data-ast]");
    const ring = loader.querySelector("[data-ring]");
    const bar = loader.querySelector("[data-bar]");
    const count = loader.querySelector("[data-count]");
    const mark = document.querySelector(".hero-mark");
    const state = { n: 0, r: 0 };
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    const setMask = () => {
      if (!veil) return;
      const m = `radial-gradient(circle ${state.r}px at ${cx}px ${cy}px, transparent 99%, #000 100%)`;
      veil.style.webkitMaskImage = m;
      veil.style.maskImage = m;
    };
    setMask();
    const maxR = Math.hypot(window.innerWidth, window.innerHeight);
    /* lock scroll while the overture plays, so the scene centers on the
       true viewport (no scrollbar bias) and the page holds still */
    document.documentElement.classList.add("is-loading");
    const tl = gsap.timeline({
      onComplete() {
        document.documentElement.classList.remove("is-loading");
        loader.remove();
        heroIntro.play();
      },
    });

    /* counter + progress bar run underneath everything */
    tl.to(state, {
      n: 100,
      duration: 2.1,
      ease: "power1.inOut",
      onUpdate() {
        if (count) count.textContent = String(Math.round(state.n)).padStart(2, "0");
        if (bar) bar.style.transform = `scaleX(${state.n / 100})`;
        sigBars.forEach((b, i) => b.classList.toggle("is-on", state.n >= (i + 1) * 18));
      },
    }, 0);

    /* the mark circles the word stack in a swirly orbit, staying upright */
    const orbit = loader.querySelector("[data-orbit]");
    const wordsEl = loader.querySelector(".loader-words");
    if (orbit && ast && wordsEl) {
      const wb = wordsEl.getBoundingClientRect();
      const R = Math.min(
        Math.max(wb.width, wb.height) / 2 + 95,
        window.innerWidth / 2 - 54
      );
      gsap.set(ast, { x: R });
      tl.to(orbit, { rotation: 400, duration: 2.25, ease: "power1.inOut" }, 0.1);
      tl.to(ast, { rotation: -400, duration: 2.25, ease: "power1.inOut" }, 0.1);
      /* radius breathes so the path swirls instead of tracing a clean circle */
      tl.to(ast, { x: R * 0.85, duration: 0.56, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.1);
    }

    /* ident morph: each stamp hit re-stamps the mark into its next shape,
       circle -> sparkle -> asterisk */
    const shapes = ast ? ast.querySelectorAll(".la-shape") : [];
    if (shapes.length === 3) {
      gsap.set([shapes[1], shapes[2]], { scale: 0, autoAlpha: 0 });
      tl.from(shapes[0], { scale: 0, rotation: -180, duration: 0.5, ease: "back.out(1.7)" }, 0.1);
      const swap = (a, b, at) => {
        tl.to(a, { scale: 0, rotation: "+=90", autoAlpha: 0, duration: 0.18, ease: "back.in(2)" }, at);
        tl.fromTo(b, { scale: 0, rotation: -120, autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.3, ease: "back.out(1.8)" }, at + 0.08);
      };
      swap(shapes[0], shapes[1], 0.74);
      swap(shapes[1], shapes[2], 1.04);
      tl.to(shapes[2], { rotation: "+=180", scale: 1.18, duration: 0.3, ease: "power2.inOut" }, 1.4)
        .to(shapes[2], { scale: 1, duration: 0.18, ease: "power2.out" }, 1.72);
    }

    /* a transmission being tuned in: static thins out as the signal locks,
       the picture tears sideways a few times, the strength bars fill, and
       the ghosted words snap into focus on SIGNAL FOUND */
    const noiseLayer = loader.querySelector("[data-noise-layer]");
    const flash = loader.querySelector("[data-flash]");
    const status = loader.querySelector("[data-loader-status]");
    const sigBars = loader.querySelectorAll("[data-loader-bars] i");
    const setStatus = (text) => {
      if (!status) return;
      if (scramble) gsap.to(status, { duration: 0.5, scrambleText: { text, chars: "upperCase", speed: 0.7 } });
      else status.textContent = text;
    };
    if (noiseLayer) {
      tl.fromTo(noiseLayer, { opacity: 0.55 }, { opacity: 0.2, duration: 1.2, ease: "power2.out" }, 0)
        .to(noiseLayer, { opacity: 0.45, duration: 0.08, yoyo: true, repeat: 3, ease: "none" }, 1.0)
        .to(noiseLayer, { opacity: 0, duration: 0.35, ease: "power2.in" }, 1.9);
    }
    [0.12, 0.5, 0.95, 1.45].forEach((at, i) => {
      tl.to(scene, { skewX: i % 2 ? -9 : 9, x: i % 2 ? 12 : -12, duration: 0.05, repeat: 3, yoyo: true, ease: "none" }, at)
        .set(scene, { skewX: 0, x: 0 }, at + 0.2);
    });
    tl.add(() => setStatus("LOCKING SIGNAL"), 1.05);
    tl.add(() => { setStatus("SIGNAL FOUND"); loader.classList.remove("is-tuning"); }, 1.9);

    /* stamps: slam in from above, tilted, with a flash and a screen shake on each hit */
    const words = loader.querySelectorAll(".lw");
    const rest = [-2.5, 1.8, -1.6], tilt = [-14, 12, -11];
    words.forEach((w, i) => {
      const at = 0.55 + i * 0.3;
      tl.fromTo(w,
        { scale: 2.4, autoAlpha: 0, rotation: tilt[i] },
        { scale: 1, autoAlpha: 1, rotation: rest[i], duration: 0.2, ease: "power4.in" }, at);
      if (flash) tl.fromTo(flash, { opacity: 0.2 }, { opacity: 0, duration: 0.28, ease: "power2.out" }, at + 0.19);
      tl.to(scene, { x: i % 2 ? 6 : -6, duration: 0.04, yoyo: true, repeat: 3, ease: "none" }, at + 0.19);
    });

    /* the words collapse to center; the orbiter dives in and pops */
    tl.to(".lw", {
      scale: 0, y: (i) => [60, 0, -60][i] || 0,
      duration: 0.4, ease: "back.in(1.6)", stagger: 0.06,
    }, 1.9)
      .to(ast, { x: 0, scale: 1.35, duration: 0.38, ease: "power2.in", overwrite: "auto" }, "<")
      .to(ast, { scale: 0, duration: 0.18, ease: "back.in(2.2)" })
      .to(".loader-meta", { autoAlpha: 0, duration: 0.25, ease: "power2.out" }, "<")
      .to(bar, { autoAlpha: 0, duration: 0.25 }, "<");

    /* the tube flickers once, then the aperture tears open with a shockwave ring over the name */
    tl.to(loader, { opacity: 0.72, duration: 0.05, repeat: 3, yoyo: true, ease: "none" });
    tl.add(() => {
      if (mark) {
        const r = mark.getBoundingClientRect();
        cx = window.innerWidth / 2;
        cy = Math.max(120, Math.min(window.innerHeight * 0.6, r.top + r.height / 2));
      }
      if (ring) gsap.set(ring, { left: cx, top: cy, xPercent: -50, yPercent: -50 });
    })
      .to(state, { r: maxR * 0.07, duration: 0.45, ease: "power2.out", onUpdate: setMask })
      .fromTo(ring,
        { scale: 0.2, autoAlpha: 1 },
        { scale: (maxR * 0.9) / 60, autoAlpha: 0, duration: 1.0, ease: "expo.out",
          immediateRender: false }, "+=0.15")
      .to(state, { r: maxR, duration: 1.0, ease: "expo.inOut", onUpdate: setMask }, "<");

    /* click to skip */
    loader.addEventListener("pointerdown", () => {
      if (tl.progress() < 1) tl.progress(1);
    }, { once: true });
  } else {
    heroIntro.play();
  }

  /* ---------------------------------------------- nav: collapse to the mark past the hero */
  const navEl = document.querySelector(".nav");
  if (navEl) {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "bottom top+=90",
      onEnter: () => navEl.classList.add("nav-mini"),
      onLeaveBack: () => navEl.classList.remove("nav-mini"),
    });
  }

  /* ---------------------------------------------- badges: CircularText spin, speedUp on hover */
  document.querySelectorAll(".hero-badge, .access-badge, .premise-badge").forEach((badge) => {
    const svg = badge.querySelector("svg");
    if (!svg) return;
    const spin = gsap.to(svg, { rotation: 360, duration: 16, ease: "none", repeat: -1 });
    badge.addEventListener("pointerenter", () => gsap.to(spin, { timeScale: 4, duration: 0.5 }));
    badge.addEventListener("pointerleave", () => gsap.to(spin, { timeScale: 1, duration: 0.5 }));
  });

  /* ---------------------------------------------- hero parallax */
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const depth = parseFloat(el.dataset.parallax || "10");
    gsap.to(el, {
      yPercent: depth,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  });
  /* ---------------------------------------------- DriftWall backdrop
     Adapted from React Bits DriftWall: a dim, forest-tinted 3D wall of
     tiles drifting behind the mark, with pointer-follow tilt. */
  (function driftWall() {
    const wall = document.querySelector("[data-driftwall]");
    if (!wall || window.innerWidth < 900) return;
    /* the wall is built ONLY from your own photos: drop JPGs named
       wall-1.jpg, wall-2.jpg, ... into assets/wall/ (up to 16); the wall
       stays off until at least one exists */
    const probes = [];
    for (let i = 1; i <= 16; i++) {
      probes.push(new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve(`assets/wall/wall-${i}.jpg`);
        im.onerror = () => resolve(null);
        im.src = `assets/wall/wall-${i}.jpg`;
      }));
    }
    const plane = document.createElement("div");
    plane.className = "dw-plane";
    wall.appendChild(plane);
    const UNIT = 132 + 16;
    const COL_W = 216;
    const cols = Math.max(4, Math.ceil((window.innerWidth * 1.5) / COL_W));
    const tracks = [];
    const offsets = [];
    const vels = [];
    const colFactor = (i) => 1 + 0.45 * ((((i * 0.618 + 0.35) % 1) * 2) - 1);
    Promise.all(probes).then((found) => {
      const IMAGES = found.filter(Boolean);
      if (!IMAGES.length) return;
      /* shuffled deck dealt in disjoint slices: with 6 tiles per column and
         16 images, adjacent columns never share an image */
      const deck = IMAGES.slice().sort(() => Math.random() - 0.5);
      for (let c = 0; c < cols; c++) {
      const col = document.createElement("div");
      col.className = "dw-col";
      const track = document.createElement("div");
      track.className = "dw-track";
      const per = 6;
      /* disjoint slice from the deck, then shuffled within the column so a
         repeated image never rides at the same height as its twin nearby */
      const items = Array.from({ length: per }, (_, i) => deck[(c * per + i) % deck.length])
        .sort(() => Math.random() - 0.5);
      const copyH = per * UNIT;
      const nCopies = Math.max(2, Math.ceil((window.innerHeight * 1.8) / copyH) + 1);
      for (let k = 0; k < nCopies; k++) {
        items.forEach((src) => {
          const t = document.createElement("div");
          t.className = "dw-tile";
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.loading = "lazy";
          t.appendChild(img);
          track.appendChild(t);
        });
      }
      col.appendChild(track);
      plane.appendChild(col);
      tracks.push({ el: track, copyH });
      offsets.push(copyH * Math.random());
      vels.push((24 + Math.random() * 14) * colFactor(c) * (c % 2 ? -1 : 1));
      }
    });
    let px = 0, py = 0, dxv = 0, dyv = 0;
    window.addEventListener("pointermove", (e) => {
      px = (e.clientX / window.innerWidth - 0.5) * 5;
      py = -(e.clientY / window.innerHeight - 0.5) * 5;
    }, { passive: true });
    let last = 0;
    gsap.ticker.add((time) => {
      const dt = last ? Math.min(0.05, time - last) : 0;
      last = time;
      dxv += (px - dxv) * Math.min(1, dt * 8);
      dyv += (py - dyv) * Math.min(1, dt * 8);
      plane.style.transform =
        `translate(-50%, -50%) scale(1.25) rotateX(${14 + dyv}deg) rotateY(${-12 + dxv}deg) translateZ(-120px)`;
      for (let c = 0; c < tracks.length; c++) {
        offsets[c] = (((offsets[c] + vels[c] * dt) % tracks[c].copyH) + tracks[c].copyH) % tracks[c].copyH;
        tracks[c].el.style.transform = `translate3d(0, ${-offsets[c]}px, 0)`;
      }
    });
  })();

  /* pointer parallax: the photo counters the pointer; the mark fill stays
     put so the gold sheen never slides off the letters. The badge eye's
     pupil tracks the cursor. */
  if (finePointer) {
    const photoEl = document.querySelector(".hero-photo");
    const pupil = document.querySelector(".hero-badge-core [data-pupil]");
    const badgeEl = document.querySelector(".hero-badge");
    const phx = photoEl ? gsap.quickTo(photoEl, "x", { duration: 0.8, ease: "power2.out" }) : null;
    const phy = photoEl ? gsap.quickTo(photoEl, "y", { duration: 0.8, ease: "power2.out" }) : null;
    const pux = pupil ? gsap.quickTo(pupil, "x", { duration: 0.18, ease: "power2.out" }) : null;
    const puy = pupil ? gsap.quickTo(pupil, "y", { duration: 0.18, ease: "power2.out" }) : null;
    window.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      if (phx) { phx(nx * -14); phy(ny * -10); }
      if (pux && badgeEl) {
        const r = badgeEl.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const m = Math.min(1, d / 80);
        pux((dx / d) * 7.5 * m);
        puy((dy / d) * 4.5 * m);
      }
    }, { passive: true });
  }

  /* ---------------------------------------------- the thread */
  if (window.SplitText) {
    const split = new SplitText(".premise-big", { type: "lines", linesClass: "line" });
    gsap.from(split.lines, {
      yPercent: 105,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
      stagger: 0.09,
      scrollTrigger: { trigger: ".premise", start: "top 68%" },
    });
  } else {
    gsap.from(".premise-big", {
      opacity: 0, y: 40, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".premise", start: "top 68%" },
    });
  }
  gsap.from(".premise-note", {
    opacity: 0, y: 24, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".premise", start: "top 55%" },
  });
  gsap.from(".premise-loop", {
    opacity: 0, y: 36, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".premise-loop", start: "top 92%" },
  });

  /* the loop ribbon: input -> output pairs flowing along a wavy path
     (TextLoop, ported from React Bits and rebuilt as the proof belt) */
  (function initTextLoop() {
    const root = document.querySelector("[data-textloop]");
    if (!root) return;
    const pathEl = root.querySelector("#tl-path");
    const head = root.querySelector("#tl-head");
    const tail = root.querySelector("#tl-tail");
    const measure = root.querySelector(".tl-measure");
    if (!pathEl || !head || !tail || !measure) return;
    const PAIRS = [
      "OLYMPIADS → MENTORING",
      "BRIEFS → LIVE SITES",
      "DOCS → AGENTS",
      "MARKETS → RESEARCH",
      "COLD BREW → A STUDIO",
      "NOTES → TEACHING",
    ];
    const unit = PAIRS.join("  ✦  ") + "  ✦  ";
    measure.textContent = unit;
    /* on phones, crop the wave instead of shrinking it into illegibility */
    if (window.innerWidth < 700) {
      root.querySelector("svg").setAttribute("preserveAspectRatio", "xMidYMid slice");
    }
    const setup = () => {
      let length = 0, unitW = 0;
      try {
        length = pathEl.getTotalLength();
        unitW = measure.getComputedTextLength();
      } catch (e) { return; }
      if (!length || !unitW) return;
      const reps = Math.max(1, Math.round(length / unitW));
      const loopText = unit.repeat(reps);
      head.textContent = loopText;
      tail.textContent = loopText;
      head.setAttribute("textLength", length);
      tail.setAttribute("textLength", length);
      const apply = (off) => {
        head.setAttribute("startOffset", off);
        tail.setAttribute("startOffset", off >= 0 ? off - length : off + length);
      };
      apply(0);
      const state = { o: 0 };
      const tween = gsap.to(state, {
        o: length, duration: length / 85, ease: "none", repeat: -1,
        onUpdate: () => apply(state.o),
      });
      /* pause only when the pointer is on the band itself, not the empty
         space around the wave */
      pathEl.addEventListener("pointerenter", () => tween.pause());
      pathEl.addEventListener("pointerleave", () => tween.resume());
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setup).catch(() => setup());
    } else {
      setup();
    }
  })();

  /* the intake rig: inputs drop into the box, builds pop out */
  (function initRig() {
    const rig = document.querySelector(".premise-rig");
    if (!rig) return;
    const box = rig.querySelector(".rig-box");
    const spinner = box && box.querySelector("svg");
    const ins = rig.querySelectorAll(".rig-in");
    const outs = rig.querySelectorAll(".rig-out");
    if (!box || !ins.length || ins.length !== outs.length) return;
    const cyc = gsap.timeline({ repeat: -1, paused: true });
    ins.forEach((chip, i) => {
      const at = i * 2.1;
      cyc.fromTo(chip, { x: 0, y: 0, autoAlpha: 0, scale: 1 },
        { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, at)
        .to(chip, { x: 168, y: 132, scale: 0.35, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, at + 0.4)
        .to(box, { scale: 1.14, duration: 0.12, ease: "power2.out" }, at + 0.92)
        .to(box, { scale: 1, duration: 0.34, ease: "back.out(3)" }, at + 1.04)
        .to(spinner, { rotation: "+=120", duration: 0.5, ease: "power2.out" }, at + 0.92)
        .fromTo(outs[i], { x: -168, y: -136, scale: 0.35, autoAlpha: 0 },
          { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.6)" }, at + 1.02)
        .to(outs[i], { autoAlpha: 0, y: 14, duration: 0.35, ease: "power2.in" }, at + 1.8);
    });
    ScrollTrigger.create({
      trigger: ".premise", start: "top 85%", end: "bottom top",
      onToggle(self) { if (self.isActive) cyc.play(); else cyc.pause(); },
    });
  })();

  /* ---------------------------------------------- the story: projector room */
  (function initReel() {
    const reel = document.querySelector("[data-reel]");
    const tv = document.querySelector("[data-tv]");
    if (!reel || !tv) return;
    const frames = gsap.utils.toArray("[data-frame]");
    const N = frames.length;
    if (!N) return;
    const q = (sel) => tv.querySelector(sel);
    const flicker = q("[data-flicker]");
    const counter = document.querySelector("[data-reel-no]");
    const osdCh = q("[data-osd-ch]");
    const osdTime = q("[data-osd-time]");
    const osdSignal = q("[data-osd-signal]");
    const osdVolBar = q("[data-osd-vol-bar]");
    const osdCc = q("[data-osd-cc]");
    const boot = q("[data-boot]");
    const offVeil = q("[data-off]");
    const offDot = q("[data-off-dot]");
    const framesWrap = q("[data-frames]");
    const cells = gsap.utils.toArray(".reel-cell");

    /* ---- sound: a CRT hum, static, and a mechanical click. Built lazily on
       the first gesture (browsers require one); the volume dial is the gain. */
    const snd = { ctx: null, master: null, noiseGain: null, volume: 0.35, on: true, near: true };
    const ensureAudio = () => {
      if (snd.ctx) { if (snd.ctx.state === "suspended") snd.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = snd.on && snd.near ? snd.volume : 0;
      master.connect(ctx.destination);
      const hum = ctx.createOscillator(); hum.type = "sine"; hum.frequency.value = 55;
      const humG = ctx.createGain(); humG.gain.value = 0.05;
      const hum2 = ctx.createOscillator(); hum2.type = "triangle"; hum2.frequency.value = 110;
      const hum2G = ctx.createGain(); hum2G.gain.value = 0.018;
      hum.connect(humG).connect(master); hum2.connect(hum2G).connect(master);
      hum.start(); hum2.start();
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.6;
      const noiseGain = ctx.createGain(); noiseGain.gain.value = 0;
      noise.connect(bp).connect(noiseGain).connect(master);
      noise.start();
      snd.ctx = ctx; snd.master = master; snd.noiseGain = noiseGain;
    };
    const applyVolume = () => {
      if (!snd.master) return;
      snd.master.gain.setTargetAtTime(snd.on && snd.near ? snd.volume : 0, snd.ctx.currentTime, 0.06);
    };
    /* the set only hums while it is on screen */
    snd.near = true;
    ScrollTrigger.create({
      trigger: ".doctrine", start: "top bottom", end: "bottom top",
      onEnter: () => { snd.near = true; applyVolume(); }, onEnterBack: () => { snd.near = true; applyVolume(); },
      onLeave: () => { snd.near = false; applyVolume(); }, onLeaveBack: () => { snd.near = false; applyVolume(); },
    });
    const staticBurst = (dur = 0.4, level = 0.35) => {
      if (!snd.noiseGain) return;
      const t = snd.ctx.currentTime;
      snd.noiseGain.gain.cancelScheduledValues(t);
      snd.noiseGain.gain.setTargetAtTime(level, t, 0.02);
      snd.noiseGain.gain.setTargetAtTime(0, t + dur, 0.08);
    };
    const clickSound = () => staticBurst(0.03, 0.5);
    tv.addEventListener("pointerdown", ensureAudio, { passive: true });

    /* ---- state ---- */
    let current = 0, switching = false, power = true, booted = false, cc = false;
    const pad = (n) => String(n + 1).padStart(2, "0");
    const chDialEl = q('[data-dial="channel"]');
    const setOSD = (idx) => {
      if (counter) counter.textContent = pad(idx);
      if (osdCh) osdCh.textContent = pad(idx);
      cells.forEach((c, i) => c.classList.toggle("is-on", i === idx));
      const line = frames[idx].querySelector(".frame-line");
      if (osdCc && line) osdCc.textContent = line.textContent;
      if (chDialEl) chDialEl.setAttribute("aria-valuenow", String(idx + 1));
      if (typeof snapCap === "function") snapCap(idx);
    };

    gsap.set(frames, { autoAlpha: 0 });

    /* a bright scan bar that sweeps the tube during a channel change */
    const scanBar = document.createElement("i");
    scanBar.className = "crt-scanbar";
    framesWrap.parentNode.appendChild(scanBar);
    const noiseEl = q("[data-noise]");

    const show = (idx) => {
      if (idx === current || switching) return;
      switching = true;
      const from = frames[current], to = frames[idx];
      const dir = idx > current ? 1 : -1;
      current = idx;
      setOSD(idx);
      staticBurst(0.28, 0.32);
      const toImg = to.querySelector("img");
      const tl = gsap.timeline({ onComplete() { switching = false; } });
      /* old-set channel change: the picture loses hold, rolls vertically
         through a burst of static with a tear, and the next channel snaps in */
      tl.set(to, { autoAlpha: 1, yPercent: 100 * dir, clipPath: "none" }, 0)
        .to(noiseEl, { opacity: 0.7, duration: 0.06 }, 0)
        .to([from, to], { yPercent: "-=" + (100 * dir), duration: 0.3, ease: "power3.inOut" }, 0.04)
        .fromTo(scanBar, { yPercent: -100, autoAlpha: 1 }, { yPercent: 1400, duration: 0.32, ease: "power2.in" }, 0.04)
        .to(framesWrap, { skewX: 5, x: -8, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, 0.02)
        .set(framesWrap, { skewX: 0, x: 0 }, 0.36)
        .set(from, { autoAlpha: 0, yPercent: 0 }, 0.36)
        .set(scanBar, { autoAlpha: 0 }, 0.36)
        .to(noiseEl, { opacity: 0, duration: 0.22 }, 0.34)
        .fromTo(to.querySelector(".frame-card"), { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }, 0.42);
      if (toImg) tl.fromTo(toImg, { scale: 1.1 }, { scale: 1.05, duration: 1.4, ease: "power2.out" }, 0.3);
      const t = to.querySelector("h3");
      if (t && scramble) {
        tl.to(t, { duration: 0.7, scrambleText: { text: t.dataset.title || t.textContent, chars: "upperCase", speed: 0.6 } }, 0.45);
      }
    };

    /* ---- boot: SIGNAL FOUND, then the tube warms up ---- */
    let st;
    const sync = () => { if (st && booted && power) show(Math.min(N - 1, Math.floor(st.progress * N))); };
    const bootSequence = () => {
      booted = "booting";
      const lines = [q("[data-boot-1]"), q("[data-boot-2]"), q("[data-boot-3]")];
      const tl = gsap.timeline({ onComplete() { booted = true; sync(); } });
      tl.set(boot, { autoAlpha: 1 })
        .fromTo(lines[0], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.3)
        .fromTo(lines[1], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.95)
        .fromTo(lines[2], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 1.3)
        .add(() => staticBurst(0.35, 0.3), 2.0)
        .set(flicker, { opacity: 1 }, 2.0)
        .set(boot, { autoAlpha: 0 }, 2.05)
        .set(frames[0], { autoAlpha: 1 }, 2.05)
        .fromTo(framesWrap, { scaleY: 0.02, filter: "brightness(3)" },
          { scaleY: 1, filter: "brightness(1)", duration: 0.5, ease: "power3.out" }, 2.05)
        .to(flicker, { opacity: 0, duration: 0.3 }, 2.1);
      if (scramble) {
        lines.forEach((l, i) => tl.to(l, {
          duration: 0.6, scrambleText: { text: l.textContent, chars: "upperCase", speed: 0.7 },
        }, [0.3, 0.95, 1.3][i]));
      }
      setOSD(0);
    };

    /* ---- scroll picks the channel; the dial drives the scroll ---- */
    st = ScrollTrigger.create({
      trigger: ".doctrine", start: "top top",
      end: () => `+=${N * window.innerHeight * 0.7}`,
      pin: reel, invalidateOnRefresh: true,
      onEnter() { if (!booted) bootSequence(); },
      onUpdate() { if (booted === true) sync(); },
    });
    if (st.isActive && !booted) bootSequence();
    const gotoChannel = (idx) => {
      idx = Math.max(0, Math.min(N - 1, idx));
      const y = st.start + ((idx + 0.5) / N) * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo(0, y);
    };

    /* ---- dials: drag (or arrow keys) to turn ---- */
    const makeDial = (el, opts) => {
      if (!el) return { set() {}, busy: false };
      const cap = el.querySelector("[data-dial-cap]");
      const api = { busy: false, set(a) { angle = a; render(); } };
      let angle = opts.initial || 0, moved = false, startA = 0, startAngle = 0;
      const render = () => gsap.set(cap, { rotation: angle });
      const pointerAngle = (e) => {
        const r = el.getBoundingClientRect();
        return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      };
      el.addEventListener("pointerdown", (e) => {
        api.busy = true; moved = false; startA = pointerAngle(e); startAngle = angle;
        el.setPointerCapture(e.pointerId); ensureAudio();
      });
      el.addEventListener("pointermove", (e) => {
        if (!api.busy) return;
        let d = pointerAngle(e) - startA;
        if (d > 180) d -= 360; if (d < -180) d += 360;
        if (Math.abs(d) > 2) moved = true;
        angle = Math.max(opts.min, Math.min(opts.max, startAngle + d));
        render(); opts.onTurn(angle);
      });
      const end = () => {
        if (!api.busy) return;
        api.busy = false;
        if (!moved && opts.onTap) opts.onTap();
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      el.addEventListener("keydown", (e) => {
        const step = opts.keyStep || 10;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") angle = Math.min(opts.max, angle + step);
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") angle = Math.max(opts.min, angle - step);
        else return;
        e.preventDefault(); ensureAudio(); render(); opts.onTurn(angle);
      });
      render();
      return api;
    };

    const chStep = 300 / (N - 1);
    const chCap = chDialEl ? chDialEl.querySelector("[data-dial-cap]") : null;
    const snapCap = (idx) => { if (chCap) gsap.to(chCap, { rotation: -150 + idx * chStep, duration: 0.28, ease: "back.out(2.2)" }); };
    const stepChannel = (d) => { ensureAudio(); clickSound(); gotoChannel(Math.max(0, Math.min(N - 1, current + d))); };
    if (chDialEl) {
      chDialEl.addEventListener("click", () => stepChannel(current === N - 1 ? -(N - 1) : 1));
      chDialEl.addEventListener("wheel", (e) => { e.preventDefault(); stepChannel(e.deltaY > 0 ? 1 : -1); }, { passive: false });
      chDialEl.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); stepChannel(1); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); stepChannel(-1); }
      });
      snapCap(0);
    }
    const volDialEl = q('[data-dial="volume"]');
    let volTimer;
    makeDial(volDialEl, {
      min: -135, max: 135, initial: -135 + 270 * 0.35, keyStep: 15,
      onTurn(a) {
        snd.volume = (a + 135) / 270; applyVolume();
        if (osdVolBar) osdVolBar.style.transform = `scaleX(${snd.volume})`;
        tv.classList.add("is-vol");
        clearTimeout(volTimer); volTimer = setTimeout(() => tv.classList.remove("is-vol"), 1200);
        if (volDialEl) volDialEl.setAttribute("aria-valuenow", String(Math.round(snd.volume * 100)));
      },
    });

    /* ---- power ---- */
    const powerBtn = q("[data-power]");
    if (powerBtn) powerBtn.addEventListener("click", () => {
      ensureAudio(); clickSound();
      power = !power;
      powerBtn.setAttribute("aria-pressed", String(power));
      tv.classList.toggle("is-off", !power);
      snd.on = power; applyVolume();
      if (!power) {
        gsap.timeline()
          .to(framesWrap, { scaleY: 0.01, duration: 0.28, ease: "power4.in" })
          .set(offVeil, { autoAlpha: 1 })
          .fromTo(offDot, { scale: 1, autoAlpha: 1 }, { scale: 0.2, autoAlpha: 0, duration: 0.9, ease: "power2.in" });
      } else {
        gsap.timeline()
          .set(offVeil, { autoAlpha: 0 })
          .set(flicker, { opacity: 1 })
          .to(framesWrap, { scaleY: 1, duration: 0.45, ease: "power3.out" })
          .to(flicker, { opacity: 0, duration: 0.3 }, 0.1)
          .add(sync);
      }
    });

    /* ---- antenna: interference ---- */
    const antenna = q("[data-antenna]");
    if (antenna) antenna.addEventListener("click", () => {
      ensureAudio(); staticBurst(0.7, 0.45);
      tv.classList.add("is-noise");
      gsap.fromTo(antenna, { rotation: -6 }, { rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
      gsap.timeline({ onComplete() { tv.classList.remove("is-noise"); } })
        .to(framesWrap, { x: -6, skewX: 3, duration: 0.05, repeat: 9, yoyo: true, ease: "none" })
        .set(framesWrap, { x: 0, skewX: 0 });
      randomizeSignal(true);
    });

    /* ---- subtitles ---- */
    const ccBtn = q("[data-cc]");
    if (ccBtn) ccBtn.addEventListener("click", () => {
      cc = !cc; ccBtn.setAttribute("aria-pressed", String(cc));
      tv.classList.toggle("is-cc", cc); clickSound();
    });

    /* ---- OSD clock + signal bars ---- */
    const t0 = Date.now();
    setInterval(() => {
      if (!osdTime) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      osdTime.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
        .map((n) => String(n).padStart(2, "0")).join(":");
    }, 1000);
    const randomizeSignal = (weak) => {
      if (!osdSignal) return;
      const n = weak ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);
      [...osdSignal.children].forEach((b, i) => b.classList.toggle("is-on", i < n));
    };
    randomizeSignal(false);
    setInterval(() => randomizeSignal(false), 1600);

    gsap.from(".reel-head, .tv", {
      opacity: 0, y: 20, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: ".doctrine", start: "top 75%" },
    });
  })();

  /* ---------------------------------------------- the code */
  if (document.querySelector(".code-text")) {
    gsap.from(".code-mark", { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: "back.out(1.6)",
      scrollTrigger: { trigger: ".code", start: "top 70%" } });
    if (window.SplitText) {
      const cs = new SplitText(".code-text", { type: "lines", linesClass: "line" });
      gsap.from(cs.lines, { yPercent: 105, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.1,
        scrollTrigger: { trigger: ".code", start: "top 65%" } });
    } else {
      gsap.from(".code-text", { opacity: 0, y: 30, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".code", start: "top 65%" } });
    }
  }

  /* ---------------------------------------------- how i work */
  gsap.utils.toArray(".rule").forEach((r, i) => {
    gsap.from(r, {
      opacity: 0, y: 44, duration: 0.85, ease: "power3.out", delay: (i % 4) * 0.06,
      scrollTrigger: { trigger: r, start: "top 85%" },
    });
  });
  gsap.from(".rules .sec-title", {
    opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".rules", start: "top 72%" },
  });

  /* ---------------------------------------------- BUILD DAYS: ScrollExpand port
     Faithful vanilla port of React Bits ScrollExpand (useWindowScroll variant):
     a track sizes the scroll span, a sticky stage holds the frame, and progress
     drives a smoothstepped clip-path expansion with a hold at full bleed. */
  (function scrollExpand() {
    const track = document.querySelector("[data-se-track]");
    const stage = document.querySelector("[data-se-stage]");
    const seFrame = document.querySelector("[data-se-frame]");
    const media = document.querySelector("[data-se-media]");
    const scrim = document.querySelector("[data-se-scrim]");
    const title = document.querySelector("[data-se-title]");
    if (!track || !stage || !seFrame || !media) return;

    const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
    const smoothstep = (e0, e1, x) => {
      const t = clampN((x - e0) / (e1 - e0 || 1e-6), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const cfg = {
      startRadius: 24, endRadius: 0,
      mediaZoom: 1.3,
      scrollDistance: 1.1, holdDistance: 0.5,
      smoothing: 0.08, overlayScrim: 0.55,
    };
    const startW = () => (window.innerWidth < 700 ? 74 : 46);
    const startH = () => (window.innerWidth < 700 ? 52 : 62);

    let stageH = 0;
    let current = -1;
    let target = 0;

    const applyProgress = (p) => {
      const e = smoothstep(0, 1, p);
      const sw = startW();
      const sh = startH();
      const w = sw + (100 - sw) * e;
      const h = sh + (100 - sh) * e;
      const ix = Math.max(0, (100 - w) / 2);
      const iy = Math.max(0, (100 - h) / 2);
      const r = cfg.startRadius + (cfg.endRadius - cfg.startRadius) * e;
      seFrame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
      media.style.transform = `scale(${cfg.mediaZoom + (1 - cfg.mediaZoom) * e})`;
      if (scrim) scrim.style.opacity = String(cfg.overlayScrim * e);
      if (title) {
        const out = smoothstep(0.45, 0.9, p);
        title.style.opacity = String(1 - out);
        title.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
      }
    };

    const measure = () => {
      stageH = window.innerHeight;
      stage.style.height = `${stageH}px`;
      track.style.height = `${Math.round(stageH * (1 + cfg.scrollDistance + cfg.holdDistance))}px`;
    };
    measure();
    applyProgress(0);

    const expandShare = cfg.scrollDistance / (cfg.scrollDistance + cfg.holdDistance);
    ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate(self) {
        target = clampN(self.progress / expandShare, 0, 1);
      },
    });
    gsap.ticker.add(() => {
      const k = cfg.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * cfg.smoothing));
      const next = current < 0 ? target : current + (target - current) * k;
      if (Math.abs(next - current) < 0.0004 && current >= 0) return;
      current = Math.abs(target - next) < 0.0004 ? target : next;
      applyProgress(current);
    });
  })();

  /* the ghost film reel behind the TV turns slowly */
  gsap.to(".tv-bg-reel", { rotation: 360, duration: 46, ease: "none", repeat: -1 });

  /* build days: the gears grind while the frame is small */
  gsap.to("[data-gear-a]", { rotation: 360, duration: 16, ease: "none", repeat: -1, svgOrigin: "120 120" });
  gsap.to("[data-gear-b]", { rotation: -360, duration: 11, ease: "none", repeat: -1, svgOrigin: "252 176" });
  gsap.to("[data-gear-c]", { rotation: -360, duration: 8, ease: "none", repeat: -1, svgOrigin: "196 44" });

  /* the record medal swings gently from its ribbon */
  gsap.fromTo("[data-medal]", { rotation: 7, transformOrigin: "50% 0%" },
    { rotation: -5, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });

  /* ---------------------------------------------- for the record */
  gsap.from(".record .sec-title", {
    opacity: 0, y: 40, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".record", start: "top 72%" },
  });
  gsap.utils.toArray(".rec").forEach((r, i) => {
    gsap.from(r, {
      opacity: 0, y: 36, duration: 0.8, ease: "power3.out", delay: (i % 2) * 0.08,
      scrollTrigger: { trigger: r, start: "top 88%" },
    });
  });

  /* ---------------------------------------------- parable: kinetic wall */
  gsap.utils.toArray(".k-row").forEach((row) => {
    const kx = parseFloat(row.dataset.kx || "6");
    gsap.fromTo(row, { xPercent: kx }, {
      xPercent: -kx,
      ease: "none",
      scrollTrigger: { trigger: ".parable", start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  gsap.from(".parable-chip", {
    opacity: 0, y: 50, rotate: -7, duration: 0.9, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".parable", start: "top 55%" },
  });

  /* ---------------------------------------------- selected work: the shipping log */
  gsap.from(".work .sec-title, .work-sub", {
    opacity: 0, y: 40, duration: 0.9, ease: "power3.out", stagger: 0.08,
    scrollTrigger: { trigger: ".work", start: "top 72%" },
  });
  gsap.utils.toArray(".crate").forEach((crate, i) => {
    gsap.from(crate, {
      opacity: 0, y: 40, scale: 0.96, duration: 0.7, ease: "power3.out", delay: (i % 4) * 0.08,
      scrollTrigger: { trigger: crate, start: "top 90%" },
    });
  });

  /* each crate's art is alive; hovering a crate spins its art up */
  (function initCargoArt() {
    const speedable = [];

    const orbitA = document.querySelector("[data-orbit-a]");
    if (orbitA) {
      const crate = orbitA.closest(".crate");
      speedable.push([crate,
        gsap.to(orbitA, { rotation: 360, duration: 16, ease: "none", repeat: -1, svgOrigin: "110 110" })]);
      /* counter-rotate the nodes so their glyphs stay upright while revolving */
      orbitA.querySelectorAll("[data-upright]").forEach((n) => {
        speedable.push([crate,
          gsap.to(n, { rotation: -360, duration: 16, ease: "none", repeat: -1, transformOrigin: "center center" })]);
      });
    }
    const botEyes = document.querySelectorAll("[data-bot-eye]");
    if (botEyes.length) {
      gsap.timeline({ repeat: -1, repeatDelay: 2.7 })
        .to(botEyes, { scaleY: 0.12, transformOrigin: "center center", duration: 0.09, yoyo: true, repeat: 1 });
    }
    const orbitB = document.querySelector("[data-orbit-b]");
    if (orbitB) {
      speedable.push([orbitB.closest(".crate"),
        gsap.to(orbitB, { rotation: -360, duration: 10, ease: "none", repeat: -1, svgOrigin: "110 110" })]);
    }

    const pipeCard = document.querySelector("[data-pipe-card]");
    if (pipeCard) {
      const tlPipe = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
      tlPipe.to(pipeCard, { x: 54, y: -34, duration: 0.7, ease: "back.inOut(1.4)" })
        .to(pipeCard, { x: 108, y: -52, duration: 0.7, ease: "back.inOut(1.4)" }, "+=0.9")
        .to(pipeCard, { x: 0, y: 0, duration: 0.5, ease: "power2.inOut" }, "+=1.1");
      speedable.push([pipeCard.closest(".crate"), tlPipe]);
    }

    const chart = document.querySelector("[data-chart]");
    if (chart) {
      const len = chart.getTotalLength();
      gsap.set(chart, { strokeDasharray: len, strokeDashoffset: len });
      gsap.timeline({
        scrollTrigger: { trigger: chart.closest(".crate"), start: "top 82%" },
      })
        .to(chart, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" })
        .from("[data-chart-area]", { opacity: 0, duration: 0.6 }, "-=0.7")
        .from("[data-chart-dot], [data-chart-tag]", {
          scale: 0, transformOrigin: "center center", duration: 0.4, ease: "back.out(2.2)",
        }, "-=0.15");
    }

    const tickerTrack = document.querySelector("[data-ticker-track]");
    if (tickerTrack) {
      speedable.push([tickerTrack.closest(".crate"),
        gsap.to(tickerTrack, { xPercent: -50, duration: 9, ease: "none", repeat: -1 })]);
    }

    const steam = document.querySelectorAll("[data-steam] path");
    if (steam.length) {
      gsap.to(steam, {
        y: -5, opacity: 0.35, duration: 1.1, ease: "sine.inOut",
        repeat: -1, yoyo: true, stagger: 0.25,
      });
    }
    /* map furniture: the compass needle wavers, the serpent swims in place */
    const needle = document.querySelector("[data-needle]");
    if (needle) {
      gsap.fromTo(needle, { rotation: -9, svgOrigin: "50 50" },
        { rotation: 11, svgOrigin: "50 50", duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    }
    const serpent = document.querySelector("[data-serpent]");
    if (serpent) {
      gsap.to(serpent, { y: 9, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true });
    }

    const boat = document.querySelector("[data-boat]");
    if (boat) {
      gsap.to(boat, { y: -4, rotation: 2.5, svgOrigin: "100 50", duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });
      const wave = document.querySelector("[data-wave]");
      if (wave) gsap.to(wave, { x: -24, duration: 1.6, ease: "none", repeat: -1 });
      const wave2 = document.querySelector("[data-wave2]");
      if (wave2) gsap.fromTo(wave2, { x: -24 }, { x: 0, duration: 2.1, ease: "none", repeat: -1 });
    }

    const beam = document.querySelector("[data-beam]");
    if (beam) gsap.to(beam, { opacity: 0.15, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true });

    const route = document.querySelector("[data-route]");
    const voyager = document.querySelector("[data-voyager]");
    if (route && voyager) {
      const rl = route.getTotalLength();
      const sail = { p: 0 };
      const pt0 = route.getPointAtLength(0);
      gsap.set(voyager, { x: pt0.x, y: pt0.y });
      speedable.push([route.closest(".crate"),
        gsap.to(sail, {
          p: 1, duration: 7, ease: "power1.inOut", repeat: -1, repeatDelay: 0.9,
          onUpdate() {
            const d = sail.p * rl;
            const pt = route.getPointAtLength(d);
            const ahead = route.getPointAtLength(Math.min(rl, d + 2));
            const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * (180 / Math.PI);
            gsap.set(voyager, { x: pt.x, y: pt.y, rotation: angle * 0.55 });
          },
        })]);
    }

    const clicks = document.querySelectorAll("[data-click]");
    if (clicks.length) {
      const tlClicks = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
      tlClicks.to(clicks, { opacity: 1, duration: 0.16, stagger: 0.32, ease: "power2.out" })
        .to(clicks, { opacity: 0, duration: 0.3 }, "+=0.9");
      speedable.push([clicks[0].closest(".crate"), tlClicks]);
    }

    const pulse = document.querySelector("[data-pulse]");
    if (pulse) {
      const len = pulse.getTotalLength();
      gsap.set(pulse, { strokeDasharray: `${len * 0.28} ${len}` });
      speedable.push([pulse.closest(".crate"),
        gsap.to(pulse, { strokeDashoffset: -len * 1.28, duration: 2.6, ease: "none", repeat: -1 })]);
    }

    speedable.forEach(([crate, anim]) => {
      if (!crate) return;
      crate.addEventListener("pointerenter", () => gsap.to(anim, { timeScale: 3, duration: 0.4 }));
      crate.addEventListener("pointerleave", () => gsap.to(anim, { timeScale: 1, duration: 0.4 }));
    });

    const big = document.querySelector(".crate-big");
    if (big && scramble) {
      gsap.to(big, {
        duration: 1.1,
        scrambleText: { text: big.textContent, chars: "0123456789", speed: 0.4 },
        scrollTrigger: { trigger: ".crate-b", start: "top 88%" },
      });
    }
  })();

  /* ---------------------------------------------- toolbox shelf */
  gsap.from(".toolbox .sec-title, .toolbox-sub", {
    opacity: 0, y: 36, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".toolbox", start: "top 70%" },
  });
  /* the shelves settle in one by one; books themselves stay put (their hover transition fights tweens) */
  gsap.from(".cubby", {
    y: 26, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".bookcase", start: "top 78%" },
  });

  /* ---------------------------------------------- contact */
  gsap.from(".access-kicker, .outro-tv", {
    opacity: 0, y: 34, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".access", start: "top 65%" },
  });
  gsap.to(".access-stick-a", {
    yPercent: 60, rotate: 20, ease: "none",
    scrollTrigger: { trigger: ".access", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.to(".access-stick-b", {
    yPercent: -50, rotate: -16, ease: "none",
    scrollTrigger: { trigger: ".access", start: "top bottom", end: "bottom top", scrub: true },
  });
  const kicker = document.querySelector(".access-kicker");
  if (kicker && scramble) {
    const original = kicker.textContent;
    gsap.to(kicker, {
      duration: 1.2,
      scrambleText: { text: original, chars: "upperCase", speed: 0.5 },
      scrollTrigger: { trigger: ".access", start: "top 60%" },
    });
  }

  /* ---------------------------------------------- colophon: particle mast */
  const colophon = document.querySelector(".colophon");
  const particleHost = document.querySelector("[data-particles]");
  if (colophon && particleHost && window.initParticleMast && finePointer) {
    colophon.classList.add("has-particles");
    const mast = window.initParticleMast(particleHost, { text: particleHost.dataset.particles });
    if (mast) {
      ScrollTrigger.create({
        trigger: colophon,
        start: "top 80%",
        onEnter: () => mast.gather(),
      });
    }
  } else {
    gsap.from(".colophon-mast", {
      xPercent: -6, opacity: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".colophon", start: "top 85%" },
    });
  }


  /* ---------------------------------------------- end of transmission */
  (function initOutro() {
    const stage = document.querySelector("[data-outro]");
    if (!stage) return;
    const screen = stage.querySelector("[data-outro-screen]");
    const stat = stage.querySelector("[data-outro-static]");
    const led = stage.querySelector("[data-outro-led]");
    const lines = [1, 2, 3].map((n) => stage.querySelector(`[data-outro-${n}]`));
    const cta = stage.querySelector("[data-outro-cta]");
    const fine = stage.querySelector("[data-outro-fine]");
    const tag = stage.querySelector("[data-outro-tag]");
    let played = false;
    const tick = () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "square"; o.frequency.value = 900;
        g.gain.setValueAtTime(0.06, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
      } catch (e) {}
    };
    const bars = stage.querySelector("[data-outro-bars]");
    const standby = stage.querySelector("[data-outro-standby]");
    const osdL = stage.querySelector("[data-outro-osd]");
    const play = () => {
      if (played) return; played = true;
      gsap.timeline()
        .to(stat, { opacity: 0.45, duration: 0.3 }, 1.4)
        .to([bars, standby], { opacity: 0, duration: 0.08 }, 1.6)
        .to(screen, { scaleY: 0.01, duration: 0.35, ease: "power4.in" }, 1.6)
        .set(stat, { opacity: 0 })
        .to(screen, { scaleX: 0.2, duration: 0.15, ease: "power2.in" })
        .to(led, { opacity: 1, boxShadow: "0 0 12px 4px oklch(0.58 0.17 30 / .7)", duration: 0.4 })
        .add(tick, "+=1.2")
        .to(screen, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "power3.out" })
        .to(stat, { opacity: 0.12, duration: 0.3 }, "<")
        .to([osdL, tag], { opacity: 1, duration: 0.4 }, "<")
        .fromTo(lines[0], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "+=0.3")
        .fromTo(lines[1], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "+=1.1")
        .fromTo(lines[2], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, "+=0.9")
        .fromTo([cta, fine], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.12 }, "-=0.1");
    };
    ScrollTrigger.create({ trigger: ".access", start: "top 40%", onEnter: play });
  })();

  /* ---------------------------------------------- field signals: the drawer */
  (function initDrawer() {
    const drawer = document.querySelector("[data-drawer]");
    const pull = document.querySelector("[data-drawer-open]");
    const closeBtn = document.querySelector("[data-drawer-close]");
    if (!drawer || !pull) return;
    /* the pull shows itself once the hero is behind you */
    ScrollTrigger.create({
      trigger: ".hero", start: "bottom top",
      onEnter: () => pull.classList.add("is-shown"),
      onLeaveBack: () => pull.classList.remove("is-shown"),
    });
    const open = () => {
      drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("is-loading");
      if (lenis) lenis.stop();
      gsap.fromTo(drawer, { x: "100%" }, { x: 0, duration: 0.7, ease: "power4.out", clearProps: "transform" });
      gsap.from("[data-desk] > *", { x: 60, autoAlpha: 0, duration: 0.55, ease: "power3.out", stagger: 0.035, delay: 0.25 });
    };
    const close = () => {
      gsap.to(drawer, { x: "100%", duration: 0.5, ease: "power3.in", onComplete() {
        drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true");
        gsap.set(drawer, { clearProps: "transform" });
        document.documentElement.classList.remove("is-loading");
        if (lenis) lenis.start();
      } });
    };
    pull.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("is-open")) close(); });

    /* every item drags; a click without a drag flips the note */
    let z = 10;
    drawer.querySelectorAll("[data-note]").forEach((el) => {
      let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, on = false;
      el.addEventListener("pointerdown", (e) => {
        on = true; moved = false; sx = e.clientX; sy = e.clientY;
        ox = gsap.getProperty(el, "x"); oy = gsap.getProperty(el, "y");
        el.style.zIndex = ++z; el.setPointerCapture(e.pointerId);
      });
      el.addEventListener("pointermove", (e) => {
        if (!on) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        gsap.set(el, { x: ox + dx, y: oy + dy });
      });
      const up = () => {
        if (!on) return; on = false;
        if (!moved && el.classList.contains("note")) el.classList.toggle("is-open");
      };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      el.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && el.classList.contains("note")) { e.preventDefault(); el.classList.toggle("is-open"); } });
    });
  })();


  /* ---------------------------------------------- live moments on the crates */
  (function initLiveMoments() {
    const runOnce = new Set();
    const bind = (crate, build) => {
      if (!crate) return;
      let tl = null;
      const play = () => {
        if (tl) tl.kill();
        tl = build();
      };
      crate.addEventListener("pointerenter", play);
      ScrollTrigger.create({ trigger: crate, start: "top 70%", once: true, onEnter() {
        crate.classList.add("is-live"); play();
        setTimeout(() => crate.classList.remove("is-live"), 5200);
      } });
    };

    /* multi-agent: the reply streams in */
    const chat = document.querySelector('[data-live="chat"]');
    if (chat) {
      const out = chat.querySelector("[data-chat-stream]");
      const text = "Yes, late checkout at 2pm is confirmed for room 302. There is a ₹500 charge after noon; I have noted it on the folio.";
      bind(chat.closest(".crate"), () => {
        out.textContent = "";
        const st = { n: 0 };
        return gsap.timeline()
          .from(chat.querySelector(".chat-in"), { y: 8, autoAlpha: 0, duration: 0.3 })
          .to(st, { n: text.length, duration: 2.6, ease: "none", onUpdate() { out.textContent = text.slice(0, Math.round(st.n)); } }, 0.5);
      });
    }

    /* crm: a lead arrives, gets tagged, moves, gets an owner, saves */
    const crm = document.querySelector('[data-live="crm"]');
    if (crm) {
      const lead = crm.querySelector("[data-crm-lead]"), tag = crm.querySelector("[data-crm-tag]");
      const avatar = crm.querySelector("[data-crm-avatar]"), toast = crm.querySelector("[data-crm-toast]");
      bind(crm.closest(".crate"), () => gsap.timeline()
        .set(tag, { textContent: "new enquiry", backgroundColor: "#f0cf4a" })
        .set(avatar, { autoAlpha: 0 }).set(toast, { autoAlpha: 0 })
        .from(lead, { x: -30, autoAlpha: 0, duration: 0.4, ease: "power3.out" })
        .to(tag, { textContent: "AI: warm lead", backgroundColor: "#e88b74", duration: 0.01 }, "+=0.5")
        .to(lead, { x: 26, duration: 0.5, ease: "power2.inOut" }, "+=0.3")
        .to(avatar, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, "+=0.2")
        .to(toast, { autoAlpha: 1, y: -4, duration: 0.3 }, "+=0.3"));
    }

    /* wealth: a price ticks, the book revalues, risk relaxes */
    const wealth = document.querySelector('[data-live="wealth"]');
    if (wealth) {
      const price = wealth.querySelector("[data-wealth-price]"), delta = wealth.querySelector("[data-wealth-delta]");
      const value = wealth.querySelector("[data-wealth-value]"), risk = wealth.querySelector("[data-wealth-risk]");
      const fmt = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
      bind(wealth.closest(".crate"), () => {
        const st = { p: 34210, v: 1240300 };
        risk.closest("p").classList.remove("is-low"); risk.textContent = "MODERATE";
        return gsap.timeline()
          .to(st, { p: 34980, v: 1269100, duration: 1.4, ease: "power2.out", onUpdate() {
            price.textContent = Math.round(st.p).toLocaleString("en-IN");
            delta.textContent = "+" + (((st.p - 34210) / 34210) * 100).toFixed(1) + "%";
            value.textContent = fmt(st.v);
          } }, 0.3)
          .add(() => { risk.textContent = "LOW"; risk.closest("p").classList.add("is-low"); }, 1.9);
      });
    }

    /* foodcourt: scan, pick a stall, the review lands on the wall */
    const food = document.querySelector('[data-live="food"]');
    if (food) {
      const qr = food.querySelector("[data-food-qr] i"), stalls = food.querySelectorAll("[data-food-stall]"), review = food.querySelector("[data-food-review]");
      bind(food.closest(".crate"), () => gsap.timeline()
        .set(stalls, { className: "" }).set(review, { autoAlpha: 0 })
        .fromTo(qr, { y: 0 }, { y: 56, duration: 0.5, ease: "none", repeat: 1, yoyo: true })
        .add(() => stalls[0].classList.add("is-pick"), 1.3)
        .fromTo(review, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, 1.9));
    }
  })();

  /* ---------------------------------------------- the maintenance hatch: four screws, then the engine room */
  (function initEngine() {
    const screws = gsap.utils.toArray("[data-screw]");
    const engine = document.querySelector("[data-engine]");
    if (!screws.length || !engine) return;
    const loose = new Set();
    let raf = 0, frames = 0, last = performance.now(), fps = 60, cursor = { x: 0, y: 0 };
    window.addEventListener("pointermove", (e) => { cursor.x = e.clientX; cursor.y = e.clientY; }, { passive: true });
    const q = (n) => engine.querySelector(`[data-eng-${n}]`);
    const bar = (n) => engine.querySelector(`[data-eng-bar="${n}"]`);
    const t0 = performance.now();
    const hist = { fps: [], vel: [], cur: [] };
    const traces = {};
    ["fps", "vel", "cur"].forEach((k) => { const cv = engine.querySelector(`[data-eng-trace="${k}"]`); if (cv) traces[k] = cv.getContext("2d"); });
    const drawTrace = (k, max) => {
      const ctx = traces[k]; if (!ctx) return;
      const cv = ctx.canvas, W = cv.width, Hh = cv.height, data = hist[k];
      ctx.clearRect(0, 0, W, Hh);
      ctx.strokeStyle = "rgba(240,207,74,.12)"; ctx.lineWidth = 1;
      for (let y = Hh / 4; y < Hh; y += Hh / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      if (data.length < 2) return;
      ctx.beginPath();
      data.forEach((v, i) => { const x = (i / (data.length - 1)) * W; const y = Hh - 6 - Math.min(1, v / max) * (Hh - 12); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = "#f0cf4a"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
      ctx.lineTo(W, Hh); ctx.lineTo(0, Hh); ctx.closePath();
      ctx.fillStyle = "rgba(240,207,74,.12)"; ctx.fill();
    };
    const push = (k, v, cap = 160) => { hist[k].push(v); if (hist[k].length > cap) hist[k].shift(); };
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      frames++;
      const velNow = ScrollTrigger.getAll()[0] ? Math.abs(ScrollTrigger.getAll()[0].getVelocity()) : 0;
      push("vel", velNow); push("cur", cursor.x / Math.max(1, window.innerWidth));
      drawTrace("vel", 3000); drawTrace("cur", 1);
      const vNow = engine.querySelector("[data-eng-trace-vel-now]"); if (vNow) vNow.textContent = Math.round(velNow) + " px/s";
      const cNow = engine.querySelector("[data-eng-trace-cur-now]"); if (cNow) cNow.textContent = Math.round(cursor.x) + " · " + Math.round(cursor.y);
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last)); frames = 0; last = now;
        const dom = document.getElementsByTagName("*").length;
        const res = performance.getEntriesByType("resource").length;
        const tweens = gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive()).length;
        const vel = ScrollTrigger.getAll()[0] ? Math.abs(ScrollTrigger.getAll()[0].getVelocity()) : 0;
        q("fps").textContent = fps;
        q("dom").textContent = dom.toLocaleString();
        q("gl").textContent = document.querySelectorAll("canvas").length + " ctx";
        q("res").textContent = res;
        q("tweens").textContent = tweens;
        q("scroll").textContent = Math.round(window.scrollY) + "px";
        q("cursor").textContent = Math.round(cursor.x) + ", " + Math.round(cursor.y);
        push("fps", fps, 80); drawTrace("fps", 120);
        const fNow = engine.querySelector("[data-eng-trace-fps-now]"); if (fNow) fNow.textContent = fps + " fps";
        const up = Math.floor((now - t0) / 1000);
        q("up").textContent = Math.floor(up / 60) + "m " + (up % 60) + "s";
        gsap.set(bar("scroll"), { scaleX: Math.min(1, vel / 3000) });
        gsap.set(bar("cursor"), { scaleX: (cursor.x / window.innerWidth) || 0 });
        gsap.set(bar("shader"), { scaleX: document.querySelector("[data-ripple] canvas") ? 1 : 0.1 });
        gsap.set(bar("tweens"), { scaleX: Math.min(1, tweens / 40) });
        gsap.set(bar("audio"), { scaleX: document.querySelector(".tv.is-off") ? 0.05 : 0.6 });
        gsap.set(bar("assets"), { scaleX: Math.min(1, res / 60) });
      }
    };
    const open = () => {
      engine.classList.add("is-open"); engine.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("is-loading");
      if (lenis) lenis.stop();
      gsap.from(".eng-card", { y: 20, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 });
      raf = requestAnimationFrame(tick);
    };
    const close = () => {
      engine.classList.remove("is-open"); engine.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-loading");
      if (lenis) lenis.start();
      cancelAnimationFrame(raf);
      screws.forEach((s) => { s.classList.remove("is-loose"); gsap.to(s, { rotation: 0, duration: 0.4 }); });
      loose.clear();
    };
    const hintEl = document.querySelector("[data-screw-hint]");
    let hintTimer = 0;
    const hint = (text, link) => {
      if (!hintEl) return;
      hintEl.textContent = text;
      hintEl.classList.toggle("is-link", !!link);
      gsap.to(hintEl, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" });
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => { gsap.to(hintEl, { opacity: 0, y: 8, duration: 0.4 }); hintEl.classList.remove("is-link"); }, link ? 7000 : 3200);
    };
    if (hintEl) hintEl.addEventListener("click", () => {
      if (!hintEl.classList.contains("is-link")) return;
      const crateScrew = document.querySelector(".crate-screw");
      const target = crateScrew ? crateScrew.closest(".crate") : null;
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -140, duration: 1.4 }); else target.scrollIntoView({ behavior: "smooth", block: "center" });
      gsap.to(hintEl, { opacity: 0, y: 8, duration: 0.3 }); hintEl.classList.remove("is-link");
    });
    screws.forEach((s) => s.addEventListener("click", (e) => {
      e.stopPropagation();
      if (loose.has(s)) return;
      loose.add(s); s.classList.add("is-loose");
      gsap.to(s, { rotation: "+=270", duration: 0.5, ease: "power2.out" });
      const total = screws.length, n = loose.size;
      const crateLoose = [...loose].some((x) => x.classList.contains("crate-screw"));
      if (n === total) { hint("hatch open"); setTimeout(open, 350); }
      else if (n === total - 1 && !crateLoose) hint(`${n} / ${total} · the last screw is hiding on a project card. Take me there →`, true);
      else if (n === 1) hint(`1 / ${total} screws loose · find the rest`);
      else hint(`${n} / ${total} screws loose`);
    }));
    engine.querySelector("[data-engine-close]").addEventListener("click", close);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && engine.classList.contains("is-open")) close(); });
  })();

  /* ---------------------------------------------- cursor */
  const cursor = document.querySelector(".cursor");
  if (cursor && finePointer) {
    const label = cursor.querySelector(".cursor-label");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.18, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.18, ease: "power3.out" });
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    });
    document.querySelectorAll("[data-cursor-label]").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        if (label) label.textContent = el.dataset.cursorLabel;
        cursor.classList.add("is-active", "has-label");
      });
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-active", "has-label"));
    });
  }

  /* ---------------------------------------------- magnetic buttons */
  if (finePointer) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 22;
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * strength);
        yTo(((e.clientY - r.top) / r.height - 0.5) * strength);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* refresh after fonts + images settle so pins measure correctly */
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
