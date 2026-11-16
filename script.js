/* ══════════════════════════════════════════════════════════
   ONYE NWEM: motion and atmosphere
   ══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const gate = $('#gate');
  const main = $('#letter');
  const veil = $('#veil');
  const intro = $('#intro');
  const rail = $('.rail');

  /* ───────── Atmosphere: drifting petals and gold dust ───────── */

  const atmosphere = (() => {
    const canvas = $('#atmosphere');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    let petals = [], dust = [];
    let petalTarget = 0;
    let last = 0, running = false;

    const PETAL_TONES = [
      ['#5a1020', '#9a2c42'],
      ['#6e1629', '#b4475b'],
      ['#7f1d32', '#c05f70'],
      ['#4a0c19', '#84233a'],
      ['#b9737c', '#e9c9c4']          // the occasional blush one
    ];
    const rand = (a, b) => a + Math.random() * (b - a);

    function makePetal(anywhere) {
      const depth = Math.random();                       // 0 far … 1 near
      return {
        x: rand(-0.1, 1.1) * W,
        y: anywhere ? rand(-0.1, 1) * H : -40 - Math.random() * H * 0.25,
        size: 6 + depth * 13,
        vy: 14 + depth * 26,
        vx: rand(-8, 10),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.5, 0.5),
        flip: rand(0, Math.PI * 2),
        vflip: rand(0.5, 1.5),
        sway: rand(0.25, 0.7),
        phase: rand(0, Math.PI * 2),
        alpha: 0.28 + depth * 0.5,
        tone: PETAL_TONES[Math.random() < 0.14 ? 4 : Math.floor(Math.random() * 4)],
        leaving: false
      };
    }

    function makeDust() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.4, 1.5),
        vy: rand(-7, -1.5),
        vx: rand(-2.5, 2.5),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.4, 1.3),
        alpha: rand(0.25, 0.75)
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wantedDust = Math.round(Math.min(70, Math.max(26, (W * H) / 21000)));
      while (dust.length < wantedDust) dust.push(makeDust());
      dust.length = wantedDust;
      if (!running) draw(0, 0);
    }

    function setPetals(count) {
      petalTarget = count;
      while (petals.length < count) petals.push(makePetal(true));
      // Extra petals are not removed; they simply aren't replaced once they fall away.
      petals.forEach((p, i) => { p.leaving = i >= count; });
    }

    function drawPetal(p) {
      const s = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(0.32 + 0.68 * Math.abs(Math.cos(p.flip)), 1);
      ctx.globalAlpha = p.alpha;
      const g = ctx.createLinearGradient(0, -s, 0, s);
      g.addColorStop(0, p.tone[0]);
      g.addColorStop(1, p.tone[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(-s * 1.05, s * 0.35, -s * 0.85, -s * 0.95, -s * 0.12, -s * 0.82);
      ctx.quadraticCurveTo(0, -s * 0.7, s * 0.12, -s * 0.82);
      ctx.bezierCurveTo(s * 0.85, -s * 0.95, s * 1.05, s * 0.35, 0, s);
      ctx.fill();
      ctx.restore();
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);

      for (const d of dust) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y < -6) { d.y = H + 6; d.x = Math.random() * W; }
        if (d.x < -6) d.x = W + 6; else if (d.x > W + 6) d.x = -6;
        const twinkle = 0.45 + 0.55 * Math.sin(t * d.speed + d.phase);
        ctx.globalAlpha = d.alpha * twinkle;
        ctx.fillStyle = '#ecd9b0';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 16) * dt;
        p.rot += p.vr * dt;
        p.flip += p.vflip * dt;
        if (p.y > H + 40) {
          if (p.leaving || petals.length > petalTarget) { petals.splice(i, 1); continue; }
          petals[i] = makePetal(false);
          continue;
        }
        drawPetal(p);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      if (!running) return;
      const t = now / 1000;
      const dt = Math.min(0.05, t - last || 0);
      last = t;
      draw(t, dt);
      requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now() / 1000;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    resize();
    return { start, setPetals, petalsFor: () => (W < 700 ? 11 : 18) };
  })();

  atmosphere.setPetals(atmosphere.petalsFor());
  atmosphere.start();

  /* ───────── The song ───────── */

  const music = (() => {
    const audio = $('#song');
    const button = $('#sound');
    const hint = $('#soundHint');
    const LEVEL = 0.75;
    let failed = false;        // no audio file, or the browser could not play it
    let wanted = false;        // she wants it playing
    let fadeTimer = 0;

    function render() {
      button.classList.toggle('off', !wanted);
      button.setAttribute('aria-pressed', String(wanted));
      button.setAttribute('aria-label', wanted ? 'Pause music' : 'Play music');
    }

    // Note: iPhones ignore volume changes, so there the song simply starts and stops.
    function fadeTo(target, ms, done) {
      clearInterval(fadeTimer);
      const from = audio.volume;
      const steps = Math.max(1, Math.round(ms / 50));
      let n = 0;
      fadeTimer = setInterval(() => {
        n += 1;
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * (n / steps)));
        if (n >= steps) { clearInterval(fadeTimer); if (done) done(); }
      }, 50);
    }

    function play(fadeMs = 3500) {
      if (failed) return;
      wanted = true;
      render();
      audio.volume = 0;
      const started = audio.play();
      if (started && started.catch) started.catch(() => { if (audio.error) fail(); else { wanted = false; render(); } });
      fadeTo(LEVEL, fadeMs);
    }

    function pause() {
      wanted = false;
      render();
      fadeTo(0, 600, () => audio.pause());
    }

    function show() {
      if (failed) return;
      button.hidden = false;
      requestAnimationFrame(() => button.classList.add('on'));
    }

    function fail() {
      failed = true;
      wanted = false;
      clearInterval(fadeTimer);
      button.hidden = true;
      hint.hidden = true;
    }
    function ready() {
      if (!failed && !gate.classList.contains('is-opening')) hint.hidden = false;
    }

    // The audio tag sits above this script, so it may already have loaded or failed.
    if (audio.error || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) fail();
    else if (audio.readyState >= 3) ready();
    audio.addEventListener('error', fail);
    audio.addEventListener('canplay', ready, { once: true });

    button.addEventListener('click', () => (wanted ? pause() : play(1200)));

    document.addEventListener('visibilitychange', () => {
      if (!wanted) return;
      if (document.hidden) audio.pause();
      else audio.play().catch(() => {});
    });

    return { play, show };
  })();

  /* ───────── Scene 1 → Scene 2: opening the envelope ───────── */

  let opened = false;

  function enterLetter() {
    gate.classList.add('gone');
    main.hidden = false;
    rail.classList.add('on');
    music.show();
    atmosphere.setPetals(Math.round(atmosphere.petalsFor() * 0.45));
    startObservers();
  }

  async function openEnvelope() {
    if (opened) return;
    opened = true;
    music.play();                               // must start inside her tap, or browsers block it

    if (reduceMotion) {
      veil.classList.add('on');
      await wait(900);
      enterLetter();
      window.scrollTo(0, 0);
      veil.classList.add('out');
      veil.classList.remove('on');
      intro.classList.add('in');
      $('#hello').focus({ preventScroll: true });
      return;
    }

    gate.classList.add('is-opening');           // words fade, the seal breaks
    await wait(650);
    gate.classList.add('flap-open');            // the flap lifts
    await wait(575);
    gate.classList.add('flap-behind');          // …and passes behind the letter at its midpoint
    await wait(500);
    gate.classList.add('letter-out');           // the letter rises
    await wait(1500);
    gate.classList.add('is-leaving');           // we lean in toward the page
    await wait(350);
    veil.classList.add('on');                   // warm light takes the frame
    await wait(1450);

    enterLetter();
    window.scrollTo(0, 0);
    await wait(120);
    veil.classList.add('out');
    veil.classList.remove('on');
    await wait(500);
    intro.classList.add('in');
    $('#hello').focus({ preventScroll: true });
  }

  $('#open').addEventListener('click', openEnvelope);
  $('#envelope').addEventListener('click', openEnvelope);

  /* ───────── Scroll choreography ───────── */

  let observersStarted = false;

  function startObservers() {
    if (observersStarted) return;
    observersStarted = true;

    // Reveals
    const reveals = $$('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('in'));
    }

    // Progress thread
    const fill = $('#railFill');
    let ticking = false;
    const updateRail = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = `scaleY(${p})`;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updateRail); }
    }, { passive: true });
    updateRail();

  }

  /* ───────── “Open when…” notes ───────── */

  $$('.note').forEach((note) => {
    const head = $('.note__head', note);
    head.addEventListener('click', () => {
      const open = note.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    });
  });

  /* ───────── Read it again ───────── */

  $('#again').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ───────── Begin ───────── */

  // `?letter` skips the envelope (handy while editing the words).
  if (new URLSearchParams(location.search).has('letter')) {
    opened = true;
    enterLetter();
    intro.classList.add('in');
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView());
    }
  } else {
    const ready = () => requestAnimationFrame(() => gate.classList.add('ready'));
    if (document.fonts && document.fonts.ready) {
      Promise.race([document.fonts.ready, wait(1800)]).then(ready);
    } else {
      ready();
    }
  }
})();
