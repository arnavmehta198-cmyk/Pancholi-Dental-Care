import { useEffect, useState } from 'react';
import { startMusic, stopMusic } from './musicEngine.js';
import { useLanguage } from './i18n.jsx';
import './BackgroundMusic.css';

function BackgroundMusic({ autoPlay }) {
  const { t } = useLanguage();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      startMusic();
      setOn(true);
    }
    return () => stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (on) {
      stopMusic();
      setOn(false);
    } else {
      startMusic();
      setOn(true);
    }
  };

  return (
    <button
      type="button"
      className={`music-toggle ${on ? 'music-toggle--on' : ''}`}
      onClick={toggle}
      aria-label={on ? t('music.off') : t('music.on')}
      title={on ? t('music.off') : t('music.on')}
    >
      <span className="music-toggle-icon" aria-hidden="true">
        ♪
      </span>
    </button>
  );
}

export default BackgroundMusic;
