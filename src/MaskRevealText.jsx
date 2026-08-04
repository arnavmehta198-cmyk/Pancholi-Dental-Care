import { useEffect, useMemo, useRef, useState } from 'react';
import './MaskRevealText.css';

function MaskRevealText({ text }) {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const words = useMemo(() => text.split(' '), [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '-100px', threshold: 0 }
    );
    io.observe(container);

    return () => io.disconnect();
  }, []);

  return (
    <div className="mask-reveal" ref={containerRef}>
      <p className="mask-reveal-text">
        {words.map((word, i) => (
          <span
            className={`mask-reveal-word ${visible ? 'mask-reveal-word--visible' : ''}`}
            style={{ transitionDelay: `${i * 35}ms` }}
            key={`${word}-${i}`}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}

export default MaskRevealText;
