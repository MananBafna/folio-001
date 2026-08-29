# Design system: Manan Bafna · Folio 001

Named reference: bright color-block editorial posters (the GET / MORE / BRAND triptych) + chunky matcha-brand rounded type. NOT dark, NOT SaaS. Motion-graphics language throughout: kinetic type walls, a film-editor timeline with a scroll-scrubbed playhead, spinning badge stickers, risograph duotones, ported React Bits effects (ParticleText wordmark, RippleDistortion WebGL contact bg via ogl, ScrollExpand bridge).

## Dials
DESIGN_VARIANCE 8 · MOTION_INTENSITY 8 · VISUAL_DENSITY 3

## Color (OKLCH, drenched color-block story; each section is a poster panel)
- --forest oklch(0.42 0.07 160) · hero + The Question (bookends)
- --butter oklch(0.87 0.13 95) · masthead type, canon marquee, One Sitting section
- --navy oklch(0.30 0.09 290) · premise + colophon
- --red oklch(0.58 0.17 30) · accents; Rules section uses deeper oklch(0.47 0.16 30) for AA body contrast
- --blush oklch(0.90 0.035 40) · doctrine (horizontal chapters)
- --pink / --orange / --cream · support
- The Crucible: near-black + the molten red photo. Keep it.

## Type (3 families)
- Anton: poster display caps (masthead, section titles, numerals, timestamps). Masthead gets a long offset text-shadow like the reference posters.
- Baloo 2 (700-800): chunky rounded voice (statements, chapter titles, rules, buttons, annotations). Global `em` maps here.
- Archivo: body + small caps labels.

## Imagery
Chapter photos render as risograph duotones (container bg = chapter accent, img mix-blend luminosity + grayscale/brightness); hover reveals the true photo. Crucible photo full color.

## Motion
Lenis + GSAP ScrollTrigger. Preloader counter → curtain. Hero word reveals + scrub parallax. Doctrine = pinned horizontal pan (start "top top", scrub 1), scroll-snap fallback < 900px / reduced motion. One Sitting timeline scrub-fills. Crucible zoom parallax. Custom cursor dot (difference blend) + magnetic pill buttons. All content visible without JS.

## Voice
Proctored-exam severity, playbook framing. No em or en dashes. Shape system: pill buttons, 14px media/rows, sharp sections.
