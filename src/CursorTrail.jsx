import { useEffect } from 'react';

const TOOTH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path fill="#ffffff" stroke="#0d4f7c" stroke-width="1.5" stroke-linejoin="round" d="M16 3c-3.2 0-4.6 1.7-6.4 1.7-2.3 0-4.1 2-4.1 5 0 3.4 1.1 7.9 2.2 11.4.8 2.6 1.5 5.4 3.2 5.4 1.9 0 1.7-4.3 2.6-6.9.4-1.1.9-1.9 2.5-1.9s2.1.8 2.5 1.9c.9 2.6.7 6.9 2.6 6.9 1.7 0 2.4-2.8 3.2-5.4C25.4 17.6 26.5 13.1 26.5 9.7c0-3-1.8-5-4.1-5C20.6 4.7 19.2 3 16 3Z"/>
</svg>`;

const TOOTH_TRAIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32">
  <path fill="#ffffff" stroke="#0d4f7c" stroke-width="2" stroke-linejoin="round" d="M16 3c-3.2 0-4.6 1.7-6.4 1.7-2.3 0-4.1 2-4.1 5 0 3.4 1.1 7.9 2.2 11.4.8 2.6 1.5 5.4 3.2 5.4 1.9 0 1.7-4.3 2.6-6.9.4-1.1.9-1.9 2.5-1.9s2.1.8 2.5 1.9c.9 2.6.7 6.9 2.6 6.9 1.7 0 2.4-2.8 3.2-5.4C25.4 17.6 26.5 13.1 26.5 9.7c0-3-1.8-5-4.1-5C20.6 4.7 19.2 3 16 3Z"/>
</svg>`;

const toDataUri = svg => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const TOOTH_CURSOR = toDataUri(TOOTH_SVG);
const TOOTH_TRAIL_IMAGE = toDataUri(TOOTH_TRAIL_SVG);

const TRAIL_MIN_INTERVAL_MS = 90;
const TRAIL_LIFETIME_MS = 700;
const MAX_TRAIL_NODES = 12;

function CursorTrail() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const style = document.createElement('style');
    style.textContent = `
      body, body * { cursor: url('${TOOTH_CURSOR}') 16 16, auto; }
      body input, body textarea, body select { cursor: text; }
      body button, body a, body [role='button'] { cursor: url('${TOOTH_CURSOR}') 16 16, pointer; }
      .cursor-trail-tooth {
        position: fixed;
        top: 0;
        left: 0;
        width: 18px;
        height: 18px;
        background-image: url('${TOOTH_TRAIL_IMAGE}');
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.85;
        transform: translate(-50%, -50%) scale(1);
        animation: cursor-trail-fade ${TRAIL_LIFETIME_MS}ms ease-out forwards;
      }
      @keyframes cursor-trail-fade {
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.4) translateY(14px);
        }
      }
    `;
    document.head.appendChild(style);

    let lastSpawn = 0;
    let activeNodes = 0;

    const handlePointerMove = event => {
      const now = performance.now();
      if (now - lastSpawn < TRAIL_MIN_INTERVAL_MS || activeNodes >= MAX_TRAIL_NODES) return;
      lastSpawn = now;
      activeNodes += 1;

      const node = document.createElement('div');
      node.className = 'cursor-trail-tooth';
      node.style.left = `${event.clientX}px`;
      node.style.top = `${event.clientY}px`;
      document.body.appendChild(node);

      node.addEventListener('animationend', () => {
        node.remove();
        activeNodes -= 1;
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      style.remove();
      document.querySelectorAll('.cursor-trail-tooth').forEach(node => node.remove());
    };
  }, []);

  return null;
}

export default CursorTrail;
