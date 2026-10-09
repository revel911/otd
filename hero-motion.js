// Hero background: slow blue ribbons (the letterhead stripes, set loose) with a few leaf marks
// drifting through them. Decorative only. Draws one still frame when the visitor prefers reduced
// motion or presses Pause, and stops while the hero is offscreen or the tab is hidden.
(() => {
  const canvas = document.getElementById('hero-canvas');
  const hero = canvas && canvas.closest('.hero');
  const pauseButton = document.getElementById('hero-pause');
  if (!canvas || !hero || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // The leaf from assets/leaf-mark.svg, in its 64x64 box.
  const LEAF = [
    new Path2D('M58 14C47 12 34 17 24 29C36 29 49 25 58 14Z'),
    new Path2D('M58 16C48 24 30 32 12 40C8 41 5 43 3 45C7 45 11 46 14 47C10 49 7 51 5 54C9 53 13 53 16 54C13 56 11 58 10 61C28 61 46 50 55 32C58 26 59 20 58 16Z'),
  ];

  const RIBBONS = [
    { y: 0.22, amp: 0.06, len: 1.9, speed: 0.10, width: 56, color: 'rgba(27,116,192,0.10)' },
    { y: 0.38, amp: 0.09, len: 1.3, speed: 0.07, width: 110, color: 'rgba(27,116,192,0.07)' },
    { y: 0.55, amp: 0.07, len: 1.6, speed: 0.12, width: 34, color: 'rgba(15,79,135,0.12)' },
    { y: 0.70, amp: 0.10, len: 1.1, speed: 0.05, width: 150, color: 'rgba(27,116,192,0.05)' },
    { y: 0.84, amp: 0.05, len: 2.3, speed: 0.15, width: 18, color: 'rgba(53,58,64,0.10)' },
  ];

  // Leaves drift up and to the right, each on its own loop.
  const LEAVES = Array.from({ length: 7 }, (_, i) => ({
    x: (i * 0.137 + 0.05) % 1,       // start column, as a fraction of width
    y: (i * 0.61 + 0.2) % 1,         // start row
    size: 28 + (i % 3) * 18,
    speed: 0.012 + (i % 4) * 0.004,  // fraction of height per second
    spin: (i % 2 ? 1 : -1) * (0.15 + (i % 3) * 0.08),
    alpha: 0.10 + (i % 3) * 0.04,
    phase: i * 1.3,
  }));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, dpr = 1;
  let paused = false, visible = true, frame = 0, last = 0, t = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function ribbon(r) {
    const k = (Math.PI * 2) / (width / r.len);
    ctx.beginPath();
    for (let x = -r.width; x <= width + r.width; x += 12) {
      const y = height * r.y
        + Math.sin(x * k + t * r.speed * 2) * height * r.amp
        + Math.sin(x * k * 0.37 - t * r.speed * 1.3) * height * r.amp * 0.5;
      x === -r.width ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.lineWidth = r.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = r.color;
    ctx.stroke();
  }

  function leaf(l) {
    const drift = (t * l.speed) % 1.3;
    const x = ((l.x + drift * 0.55) % 1.2 - 0.1) * width + Math.sin(t * 0.4 + l.phase) * 18;
    const y = ((l.y - drift + 2) % 1.3 - 0.15) * height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * l.spin * 0.6 + l.phase) * 0.35 - 0.3);
    ctx.scale(l.size / 64, l.size / 64);
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = '#1b74c0';
    ctx.fill(LEAF[0]);
    ctx.fill(LEAF[1]);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const r of RIBBONS) ribbon(r);
    for (const l of LEAVES) leaf(l);
  }

  function running() {
    return !paused && visible && !document.hidden && !reduced.matches;
  }

  function tick(now) {
    frame = 0;
    if (!running()) return;
    if (last) t += Math.min((now - last) / 1000, 0.05);
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function update() {
    if (running()) { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
    else if (frame) { cancelAnimationFrame(frame); frame = 0; }
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      paused = !paused;
      pauseButton.setAttribute('aria-pressed', String(paused));
      pauseButton.textContent = paused ? 'Resume motion' : 'Pause motion';
      update();
    });
    if (reduced.matches) pauseButton.hidden = true;
  }

  new ResizeObserver(resize).observe(hero);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', () => { resize(); update(); });

  resize();
  update();
})();
