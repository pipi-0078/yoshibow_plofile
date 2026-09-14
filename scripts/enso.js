export function initEnso(root, motion) {
  // A 3D toroidal point field projected onto Canvas. No GPU library or network dependency.
  const canvas = document.querySelector("#enso-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  let frame = 0,
    visible = true,
    last = 0,
    phase = 0,
    width = 0,
    height = 0;
  let pointerX = 0,
    pointerY = 0,
    easedX = 0,
    easedY = 0;
  function requestFrame() {
    if (!frame && ctx && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  if (!ctx) return;
  motion.onChange(requestFrame);
  const points = [];
  const rings = matchMedia("(max-width: 700px)").matches ? 72 : 110;
  for (let u = 0; u < rings; u++) {
    for (let v = 0; v < 22; v++) {
      const a = (u / rings) * Math.PI * 2;
      const b = (v / 22) * Math.PI * 2;
      points.push({ a, b });
    }
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestFrame();
  }
  new ResizeObserver(resize).observe(canvas);
  const hero = document.querySelector(".hero-wrapper");
  hero.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch" || motion.paused) return;
      const r = hero.getBoundingClientRect();
      pointerX = (e.clientX - r.left) / r.width - 0.5;
      pointerY = (e.clientY - r.top) / r.height - 0.5;
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    pointerX = pointerY = 0;
  });
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestFrame();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestFrame();
  });
  function draw(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (!motion.paused && time - last < 32) {
      requestFrame();
      return;
    }
    const delta = Math.min((time - last) / 1000, 0.05);
    last = time;
    if (!motion.paused) {
      phase += delta * 0.12;
      easedX += (pointerX - easedX) * 0.06;
      easedY += (pointerY - easedY) * 0.06;
    }
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width * 0.36, height * 0.37);
    const cx = width * 0.54,
      cy = height * 0.48;
    const glow = ctx.createRadialGradient(
      cx,
      cy,
      scale * 0.15,
      cx,
      cy,
      scale * 1.45,
    );
    glow.addColorStop(0, "rgba(90,140,25,0.03)");
    glow.addColorStop(0.6, "rgba(118,185,0,0.08)");
    glow.addColorStop(1, "rgba(118,185,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    const rotation = -0.52 + easedX * 0.5;
    const tilt = 0.75 + easedY * 0.4;
    const projected = [];
    for (const p of points) {
      const a = p.a + phase,
        b = p.b + phase * 0.4;
      const radius = 1 + 0.21 * Math.cos(b);
      let x = radius * Math.cos(a),
        y = radius * Math.sin(a),
        z = 0.21 * Math.sin(b);
      const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
      z = y * Math.sin(tilt) + z * Math.cos(tilt);
      y = yy;
      const xx = x * Math.cos(rotation) + z * Math.sin(rotation);
      z = -x * Math.sin(rotation) + z * Math.cos(rotation);
      x = xx;
      const view = 3.7 / (3.7 - z);
      projected.push({
        x: cx + x * scale * view,
        y: cy + y * scale * view,
        z,
        size: (0.55 + (z + 1.3) * 0.55) * view,
      });
    }
    projected.sort((a, b) => a.z - b.z);
    for (const p of projected) {
      const alpha = 0.15 + ((p.z + 1.3) / 2.6) * 0.7;
      ctx.fillStyle = `rgba(174,236,84,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    root.classList.add("canvas-ready");
    if (!motion.paused) requestFrame();
  }
}
