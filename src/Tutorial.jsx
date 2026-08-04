import { useEffect, useState } from 'react';
import { useLanguage } from './i18n.jsx';
import './Tutorial.css';

const STEPS = [
  { selector: '.sidebar-menu-toggle', titleKey: 'tutorial.step.menu.title', bodyKey: 'tutorial.step.menu.body' },
  { selector: '.hero-cta', titleKey: 'tutorial.step.cta.title', bodyKey: 'tutorial.step.cta.body' },
  { selector: '#services .section-title', titleKey: 'tutorial.step.services.title', bodyKey: 'tutorial.step.services.body' },
  { selector: '.contact-form', titleKey: 'tutorial.step.contact.title', bodyKey: 'tutorial.step.contact.body' },
  { selector: '.music-toggle', titleKey: 'tutorial.step.music.title', bodyKey: 'tutorial.step.music.body' }
];

function getRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function Tutorial({ onDone }) {
  const { t } = useLanguage();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    const el = document.querySelector(STEPS[stepIndex].selector);
    if (!el) {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex(i => i + 1);
      } else {
        setRect(null);
      }
      return undefined;
    }
    el.scrollIntoView({ block: 'center', behavior: 'auto' });

    // Keep tracking the target's live position for as long as this step is
    // shown — lazy-loaded sections (e.g. the services marquee) can shift
    // layout well after mount, and a one-shot measurement goes stale.
    let rafId;
    const track = () => {
      setRect(getRect(STEPS[stepIndex].selector));
      rafId = requestAnimationFrame(track);
    };
    rafId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(rafId);
  }, [stepIndex]);

  const advance = () => {
    if (stepIndex >= STEPS.length - 1) {
      onDone();
      return;
    }
    setStepIndex(i => i + 1);
  };

  if (!rect) {
    return (
      <div className="tutorial-scrim" onClick={onDone}>
        <div className="tutorial-tooltip tutorial-tooltip--center" onClick={e => e.stopPropagation()}>
          <button type="button" className="tutorial-btn tutorial-btn--primary" onClick={onDone}>
            {t('tutorial.done')}
          </button>
        </div>
      </div>
    );
  }

  const pad = 8;
  const highlightStyle = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2
  };

  // Prefer placing the tooltip below the target, then above; if neither fits
  // (a tall target like the contact form fills the viewport), pin it to the
  // bottom edge so it never renders partly off-screen.
  const TOOLTIP_H = 170;
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - 316));
  const belowTop = rect.bottom + pad + 12;
  const aboveTop = rect.top - pad - 12 - TOOLTIP_H;
  let top;
  if (belowTop + TOOLTIP_H < window.innerHeight - 16) top = belowTop;
  else if (aboveTop > 16) top = aboveTop;
  else top = window.innerHeight - TOOLTIP_H - 16;
  const tooltipStyle = { top, left };

  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="tutorial-scrim">
      <div className="tutorial-highlight" style={highlightStyle} />
      <div className="tutorial-tooltip" style={tooltipStyle}>
        <h3>{t(STEPS[stepIndex].titleKey)}</h3>
        <p>{t(STEPS[stepIndex].bodyKey)}</p>
        <div className="tutorial-tooltip-actions">
          <button type="button" className="tutorial-btn" onClick={onDone}>
            {t('tutorial.skip')}
          </button>
          <button type="button" className="tutorial-btn tutorial-btn--primary" onClick={advance}>
            {isLast ? t('tutorial.done') : t('tutorial.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
