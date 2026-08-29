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
      const maxH = wide ? Math.max(240, ih - 420) : ih * 0.62;
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
      },
    }, 0);

    /* the mark circles the word stack in a swirly orbit, staying upright */
    const orbit = loader.querySelector("[data-orbit]");
    const wordsEl = loader.querySelector(".loader-words");
    if (orbit && ast && wordsEl) {
      const wb = wordsEl.getBoundingClientRect();
      const R = Math.max(wb.width, wb.height) / 2 + 95;
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

    /* stamps: slam in from above with a screen shake on each hit */
    const words = loader.querySelectorAll(".lw");
    words.forEach((w, i) => {
      const at = 0.55 + i * 0.3;
      tl.fromTo(w,
        { scale: 2.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.in" }, at);
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

    /* aperture + shockwave ring over the name */
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
        .to(chip, { x: 118, y: 92, scale: 0.35, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, at + 0.4)
        .to(box, { scale: 1.14, duration: 0.12, ease: "power2.out" }, at + 0.92)
        .to(box, { scale: 1, duration: 0.34, ease: "back.out(3)" }, at + 1.04)
        .to(spinner, { rotation: "+=120", duration: 0.5, ease: "power2.out" }, at + 0.92)
        .fromTo(outs[i], { x: -118, y: -100, scale: 0.35, autoAlpha: 0 },
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
    if (!reel) return;
    const frames = gsap.utils.toArray("[data-frame]");
    const flicker = document.querySelector("[data-flicker]");
    const counter = document.querySelector("[data-reel-no]");
    const cells = gsap.utils.toArray(".reel-cell");
    if (!frames.length) return;

    gsap.set(frames, { autoAlpha: 0 });
    gsap.set(frames[0], { autoAlpha: 1 });
    gsap.set(frames[0].querySelector("img"), { scale: 1.06 });

    let current = 0;
    let switching = false;
    const show = (idx) => {
      if (idx === current || switching) return;
      switching = true;
      const from = frames[current];
      const to = frames[idx];
      current = idx;
      if (counter) counter.textContent = String(idx + 1).padStart(2, "0");
      cells.forEach((c, i) => c.classList.toggle("is-on", i === idx));
      const tl = gsap.timeline({ onComplete() { switching = false; } });
      /* iris wipe: the next frame blooms open as a circle over the last,
         while the old image drifts a touch deeper */
      tl.set(to, { autoAlpha: 1, clipPath: "circle(0% at 50% 54%)" }, 0)
        .to(to, { clipPath: "circle(75% at 50% 54%)", duration: 0.85, ease: "power2.inOut" }, 0)
        .to(from.querySelector("img"), { scale: "+=0.03", duration: 0.85, ease: "power1.out" }, 0)
        .set(from, { autoAlpha: 0 }, 0.85)
        .set(to, { clipPath: "none" }, 0.85)
        .fromTo(to.querySelector("img"), { scale: 1.12 },
          { scale: 1.05, duration: 1.5, ease: "power2.out" }, 0)
        .fromTo(to.querySelector(".frame-card"),
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }, 0.3);
      const t = to.querySelector("h3");
      if (t && scramble) {
        tl.to(t, {
          duration: 0.8,
          scrambleText: { text: t.dataset.title || t.textContent, chars: "upperCase", speed: 0.6 },
        }, 0.35);
      }
    };

    ScrollTrigger.create({
      trigger: ".doctrine",
      start: "top top",
      end: () => `+=${frames.length * window.innerHeight * 0.75}`,
      pin: reel,
      invalidateOnRefresh: true,
      onUpdate(self) {
        show(Math.min(frames.length - 1, Math.floor(self.progress * frames.length)));
      },
    });

    gsap.from(".reel-head, .tv", {
      opacity: 0, y: 20, duration: 0.8, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: ".doctrine", start: "top 75%" },
    });
  })();

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

  /* ---------------------------------------------- the arc: editor timeline */
  gsap.from(".gauntlet-head > *", {
    opacity: 0, y: 36, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".gauntlet", start: "top 70%" },
  });
  gsap.from(".editor .clip", {
    scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power3.out", stagger: 0.06,
    scrollTrigger: { trigger: ".editor", start: "top 78%" },
  });
  gsap.to(".gauntlet-line-fill", {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: ".gauntlet-rail", start: "top 75%", end: "bottom 45%", scrub: true },
  });

  /* the seven scenes as an animated list (AnimatedList, ported): rows scale
     in and out with visibility; hover selects; and the playhead, scrubbed
     against the rail itself, keeps the selected row in sync with the red line */
  const stops = gsap.utils.toArray(".stop");
  const selectStop = (idx) => {
    stops.forEach((o, i) => o.classList.toggle("selected", i === idx));
  };
  if (stops.length) {
    if ("IntersectionObserver" in window) {
      /* the dock owns the top of the viewport: rows fade out before they
         slide under it, so only the scenes below the card stay visible */
      const dock = document.querySelector(".editor-dock");
      const dockH = dock ? dock.offsetHeight : 0;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => en.target.classList.toggle("is-in", en.isIntersecting));
      }, { threshold: 0.5, rootMargin: `-${dockH}px 0px 0px 0px` });
      stops.forEach((s) => io.observe(s));
    } else {
      stops.forEach((s) => s.classList.add("is-in"));
    }
    stops.forEach((s, i) => {
      s.addEventListener("pointerenter", () => selectStop(i));
    });
    gsap.fromTo(".editor-playhead", { left: "0%", x: 0 }, {
      left: "100%", x: -3,
      ease: "none",
      scrollTrigger: {
        trigger: ".gauntlet-rail", start: "top 72%", end: "bottom 62%", scrub: true,
        onUpdate(self) {
          selectStop(Math.min(stops.length - 1, Math.floor(self.progress * stops.length)));
        },
      },
    });
  }

  /* the ghost film reel behind the TV turns slowly */
  gsap.to(".tv-bg-reel", { rotation: 360, duration: 46, ease: "none", repeat: -1 });

  /* build days: the gears grind while the frame is small */
  gsap.to("[data-gear-a] > g:first-child", { rotation: 360, duration: 16, ease: "none", repeat: -1, svgOrigin: "95 95" });
  gsap.to("[data-gear-b] > g", { rotation: -360, duration: 11, ease: "none", repeat: -1, svgOrigin: "198 142" });

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
  /* books stay put: their hover transition fights tweens, so no entrance animation */

  /* ---------------------------------------------- contact */
  gsap.from(".access-inner > *", {
    opacity: 0, y: 34, duration: 0.9, ease: "power3.out", stagger: 0.1,
    scrollTrigger: { trigger: ".access", start: "top 65%" },
  });
  gsap.fromTo("[data-mailrow]", { xPercent: 1 }, {
    xPercent: -26,
    ease: "none",
    scrollTrigger: { trigger: ".access", start: "top bottom", end: "bottom top", scrub: true },
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
