// Hero background: slow blue ribbons (the letterhead stripes, set loose) with a few leaf marks
// drifting through them. Decorative only. Draws one still frame when the visitor prefers reduced
// motion or presses Pause, and stops while the hero is offscreen or the tab is hidden.
(() => {
  const canvas = document.getElementById('hero-canvas');
  const hero = canvas && canvas.closest('.hero');
  const pauseButton = document.getElementById('hero-pause');
  if (!canvas || !hero || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // The leaf from assets/leaf-mark.svg, in its 126x89 box.
  const LEAF = new Path2D('M60.8 17.2 70.0 18.0 75.8 20.2 77.8 21.5 77.8 22.5 73.5 22.8 73.8 23.8 76.0 24.0 83.0 27.2 87.0 30.0 91.0 34.0 92.8 37.2 87.8 36.8 87.8 37.5 91.8 39.2 96.8 43.0 104.8 52.2 105.0 53.8 102.0 52.8 100.8 52.8 100.8 53.2 104.8 56.8 108.0 61.5 110.0 66.8 110.0 69.2 109.5 69.8 101.8 69.8 93.2 66.8 93.2 68.2 96.2 71.2 96.2 72.0 89.0 72.0 79.0 69.8 73.2 66.5 73.2 67.8 75.2 70.5 74.8 71.5 68.8 70.0 61.2 67.0 56.8 64.0 53.2 60.5 54.0 63.5 55.0 64.5 55.0 65.8 54.2 65.8 46.8 61.8 42.2 57.2 39.0 52.5 36.8 45.2 36.8 39.0 37.5 36.2 37.0 34.2 29.2 34.2 18.0 37.0 16.8 36.2 17.5 34.2 27.8 32.5 36.5 32.2 44.2 33.2 50.8 35.0 58.2 38.0 66.0 42.0 75.5 48.8 75.0 47.5 71.2 43.8 61.0 36.2 50.8 31.0 41.2 28.0 41.2 27.2 44.2 24.0 49.5 20.2 55.2 18.0 60.8 17.2Z');
  const LEAF_W = 126;

  const dark = matchMedia('(prefers-color-scheme: dark)');
  // Ribbon and leaf colors for light and dark pages; data-theme on <html> overrides the system.
  const palette = () => {
    const forced = document.documentElement.dataset.theme;
    const isDark = forced ? forced === 'dark' : dark.matches;
    return isDark
      ? ['rgba(90,170,235,0.14)', 'rgba(90,170,235,0.09)', 'rgba(140,200,255,0.16)', 'rgba(90,170,235,0.06)', 'rgba(220,230,240,0.10)', '#5aaaeb']
      : ['rgba(27,116,192,0.10)', 'rgba(27,116,192,0.07)', 'rgba(15,79,135,0.12)', 'rgba(27,116,192,0.05)', 'rgba(53,58,64,0.10)', '#1b74c0'];
  };
  const RIBBONS = [
    { y: 0.22, amp: 0.06, len: 1.9, speed: 0.10, width: 56 },
    { y: 0.38, amp: 0.09, len: 1.3, speed: 0.07, width: 110 },
    { y: 0.55, amp: 0.07, len: 1.6, speed: 0.12, width: 34 },
    { y: 0.70, amp: 0.10, len: 1.1, speed: 0.05, width: 150 },
    { y: 0.84, amp: 0.05, len: 2.3, speed: 0.15, width: 18 },
  ];
  // Leaves drift up and to the right, each on its own loop.
  const LEAVES = Array.from({ length: 7 }, (_, i) => ({
    x: (i * 0.137 + 0.05) % 1,       // start column, as a fraction of width
    y: (i * 0.61 + 0.2) % 1,         // start row
    size: 44 + (i % 3) * 26,
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

  function ribbon(r, color) {
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
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function leaf(l, color) {
    const drift = (t * l.speed) % 1.3;
    const x = ((l.x + drift * 0.55) % 1.2 - 0.1) * width + Math.sin(t * 0.4 + l.phase) * 18;
    const y = ((l.y - drift + 2) % 1.3 - 0.15) * height;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * l.spin * 0.6 + l.phase) * 0.35 - 0.2);
    ctx.scale(l.size / LEAF_W, l.size / LEAF_W);
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = color;
    ctx.fill(LEAF, 'evenodd');
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const colors = palette();
    RIBBONS.forEach((r, i) => ribbon(r, colors[i]));
    for (const l of LEAVES) leaf(l, colors[5]);
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
  dark.addEventListener('change', draw);
  document.addEventListener('themechange', draw);

  resize();
  update();
})();
