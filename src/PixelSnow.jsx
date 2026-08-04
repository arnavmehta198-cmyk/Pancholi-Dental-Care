import { useEffect, useRef } from 'react';
import './PixelSnow.css';

// Canvas-2D snow. This replaced a three.js fragment shader that raymarched 128
// steps per pixel every frame — visually near-identical at this scale, but that
// version pulled in the whole three.js runtime (~500 KB) and pinned the GPU on
// low-end phones. A few hundred translucent circles cost effectively nothing.

const MAX_FLAKES = 140;

export default function PixelSnow({
  color = '#ffffff',
  speed = 1.25,
  density = 0.3,
  direction = 125,
  brightness = 1,
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const canvas = document.createElement('canvas');
    canvas.className = 'pixel-snow-canvas';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let flakes = [];
    // Cap DPR at 1.5: snow is soft and out of focus, so the extra pixels of a
    // 3x phone screen buy nothing visible but cost fill rate linearly.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const rad = (direction * Math.PI) / 180;
    const windX = Math.cos(rad);
    const windY = Math.sin(rad);

    const seed = () => {
      const target = Math.round(MAX_FLAKES * Math.min(1, Math.max(0.1, density * 2)));
      const area = Math.max(1, (width * height) / (1280 * 800));
      const count = Math.max(24, Math.round(target * Math.min(1.4, area)));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        // depth drives both size and speed so the field reads as 3D
        depth: 0.35 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2
      }));
    };

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    resize();
    window.addEventListener('resize', onResize);

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(container);

    let raf = 0;
    let last = performance.now();

    const frame = now => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last);
      last = now;
      if (!visible || document.hidden) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      const step = (dt / 16.67) * speed;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.phase += 0.01 * step;
        f.x += (windX * 0.6 + Math.sin(f.phase) * 0.35) * f.depth * step;
        f.y += windY * 0.9 * f.depth * step;

        if (f.y > height + 6) { f.y = -6; f.x = Math.random() * width; }
        else if (f.y < -6) { f.y = height + 6; f.x = Math.random() * width; }
        if (f.x > width + 6) f.x = -6;
        else if (f.x < -6) f.x = width + 6;

        ctx.globalAlpha = Math.min(1, f.depth * brightness);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * f.depth, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      canvas.remove();
    };
  }, [color, speed, density, direction, brightness]);

  return <div ref={containerRef} className={`pixel-snow-container ${className}`} style={style} />;
}
