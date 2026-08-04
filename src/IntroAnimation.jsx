import { useEffect, useState } from 'react';
import './IntroAnimation.css';

const STORAGE_KEY = 'pdc_intro_shown';
// These directly gate Largest Contentful Paint: nothing behind the overlay can
// count as painted until it clears, so every ms here is a ms of measured load
// time for a first-time visitor. Kept long enough to read as an intro, short
// enough not to dominate LCP. Raise if the brand moment should linger.
const HOLD_MS = 800;
const EXIT_MS = 400;

function getInitialPhase() {
  if (typeof window === 'undefined') return 'done';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'done';
  if (window.sessionStorage.getItem(STORAGE_KEY)) return 'done';
  return 'enter';
}

function IntroAnimation() {
  const [phase, setPhase] = useState(getInitialPhase);

  useEffect(() => {
    if (phase !== 'enter') return undefined;
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    const holdTimer = setTimeout(() => setPhase('exit'), HOLD_MS);
    return () => clearTimeout(holdTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exit') return undefined;
    const doneTimer = setTimeout(() => setPhase('done'), EXIT_MS);
    return () => clearTimeout(doneTimer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`intro-overlay ${phase === 'exit' ? 'intro-overlay--exit' : ''}`} aria-hidden="true">
      <h1 className="intro-text">Pancholi Dental Care &amp; Hair Transplant Center</h1>
    </div>
  );
}

export default IntroAnimation;
