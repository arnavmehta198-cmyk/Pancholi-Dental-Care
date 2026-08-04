import { useLanguage } from './i18n.jsx';
import './LanguageGate.css';

function LanguageGate({ onChoose }) {
  const { t, setLang } = useLanguage();

  const choose = lang => {
    setLang(lang);
    onChoose();
  };

  return (
    <div className="language-gate" role="dialog" aria-modal="true" aria-label="Choose your language">
      <div className="language-gate-card">
        <h1>{t('welcome.title')}</h1>
        <p>{t('welcome.subtitle')}</p>
        <div className="language-gate-options">
          <button type="button" className="language-gate-btn" onClick={() => choose('en')}>
            {t('welcome.english')}
          </button>
          <button type="button" className="language-gate-btn" onClick={() => choose('hi')}>
            {t('welcome.hindi')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LanguageGate;
