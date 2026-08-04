import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import DeferredAnimation from './DeferredAnimation.jsx';
import ShinyTextType from './ShinyTextType.jsx';
import IntroAnimation from './IntroAnimation.jsx';
import { logPageview } from './analytics.js';
import CursorTrail from './CursorTrail.jsx';
import MaskRevealText from './MaskRevealText.jsx';
import { addContact, isAdminLoggedIn } from './adminStore.js';
import { preloadValidation, validateContact } from './validation.js';
import { LanguageProvider, useLanguage } from './i18n.jsx';
import LanguageGate from './LanguageGate.jsx';
import Tutorial from './Tutorial.jsx';
import BackgroundMusic from './BackgroundMusic.jsx';
import { startMusic } from './musicEngine.js';
import './Admin.css';
import domePhotoOne from './assets/dome-optimized/PHOTO-2026-07-31-04-42-18.webp';
import domePhotoTwo from './assets/dome-optimized/PHOTO-2026-07-31-04-42-18 2.webp';
import domePhotoThree from './assets/dome-optimized/PHOTO-2026-08-01-00-25-37.webp';
import domePhotoFour from './assets/dome-optimized/PHOTO-2026-08-01-00-25-38.webp';
import domePhotoFive from './assets/dome-optimized/PHOTO-2026-08-01-00-25-38 2.webp';
import domePhotoSix from './assets/dome-optimized/PHOTO-2026-08-01-00-25-38 3.webp';
import './App.css';

const heroGalleryImages = [
  { src: domePhotoOne, alt: 'Dr. Pancholi at the clinic' },
  { src: domePhotoTwo, alt: 'Dr. Pancholi providing dental care' },
  { src: domePhotoThree, alt: 'Pancholi Dental Care clinic' },
  { src: domePhotoFour, alt: 'Pancholi Dental Care clinic' },
  { src: domePhotoFive, alt: 'Pancholi Dental Care clinic' },
  { src: domePhotoSix, alt: 'Pancholi Dental Care clinic' }
];

const Schedule = lazy(() => import('./Schedule.jsx'));
const AdminLogin = lazy(() => import('./AdminLogin.jsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.jsx'));
const loadPixelSnow = () => import('./PixelSnow.jsx');
const loadDomeGallery = () => import('./DomeGallery.jsx');
const loadFloatingLines = () => import('./FloatingLines.jsx');

const menuItems = [
  { labelKey: 'nav.home', link: '#home', icon: 'home' },
  { labelKey: 'nav.about', link: '#about', icon: 'about' },
  { labelKey: 'nav.services', link: '#services', icon: 'services' },
  { labelKey: 'nav.schedule', link: '#schedule', icon: 'schedule' }
];

const ServicesMarquee = lazy(() => import('./ServicesMarquee.jsx'));

function useCountUp(target, durationMs, active) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return undefined;
    }

    let rafId;
    const startTime = performance.now();

    const tick = now => {
      const elapsed = now - startTime;
      // Clamped at 0: rAF can hand back a timestamp fractionally earlier than
      // the performance.now() captured just before it, which made progress
      // negative for one frame and rendered the counter as "-0".
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const eased = progress * progress * progress; // ease-in cubic: slow start, fast finish
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, target, durationMs]);

  return value;
}

function StatsBanner() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const patients = useCountUp(70000, 5000, active);
  const years = useCountUp(19, 5000, active);

  return (
    <section className="stats-banner" ref={sectionRef} aria-label="Clinic highlights">
      <div className="stats-banner-grid">
        <div className="stat-item">
          <span className="stat-number">{patients.toLocaleString()}+</span>
          <span className="stat-label">{t('stats.patients')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{years}+</span>
          <span className="stat-label">{t('stats.years')}</span>
        </div>
        <div className="stat-item stat-item--deal">
          <span className="stat-number">&#8377;200</span>
          <span className="stat-label">{t('stats.consult')}</span>
        </div>
      </div>
    </section>
  );
}

const reviewsData = [
  { name: 'Sparsh', rating: 5, key: 'reviews.sparsh' },
  { name: 'Arnav', rating: 5, key: 'reviews.arnav' },
  { name: 'Hilori', rating: 4, key: 'reviews.hilori' },
  { name: 'Aanya', rating: 5, key: 'reviews.aanya' },
  { name: 'Helik', rating: 4, key: 'reviews.helik' },
  { name: 'Sudhakar', rating: 5, key: 'reviews.sudhakar' },
  { name: 'Mahendera', rating: 3, key: 'reviews.mahendera' }
];

function ReviewsSection() {
  const { t } = useLanguage();
  const loopedReviews = [...reviewsData, ...reviewsData];
  return (
    <section id="reviews" className="section reviews-section">
      <h2 className="section-title">{t('reviews.title')}</h2>
      <div className="reviews-marquee">
        <div className="reviews-track">
          {loopedReviews.map((review, index) => (
            <div className="review-card" key={`${review.name}-${index}`}>
              <div className="review-stars" aria-hidden="true">
                {'★'.repeat(review.rating)}
                <span className="review-stars-empty">{'★'.repeat(5 - review.rating)}</span>
              </div>
              <p className="review-quote">&ldquo;{t(review.key)}&rdquo;</p>
              <p className="review-author">- {review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, percent)));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div
      className="scroll-progress-track"
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="scroll-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}

function AdminEntryDot() {
  return <a href="#admin" className="admin-dot" aria-label="Admin login" title="Admin" />;
}

const contactGalleryImages = [
  { src: domePhotoTwo, alt: 'Dr. Pancholi at his desk' },
  { src: domePhotoOne, alt: 'Dr. Pancholi providing dental care' },
  { src: domePhotoSix, alt: 'Dr. Pancholi at the clinic' }
];

function ContactGallery() {
  return (
    <div className="contact-parallax" aria-hidden="true">
      <div className="contact-parallax-stack">
        {contactGalleryImages.slice(0, 2).map(image => (
          <div className="contact-parallax-col" key={image.src}>
            <img src={image.src} alt={image.alt} loading="lazy" />
          </div>
        ))}
      </div>
      <div className="contact-parallax-col contact-parallax-col--tall">
        <img src={contactGalleryImages[2].src} alt={contactGalleryImages[2].alt} loading="lazy" />
      </div>
    </div>
  );
}

const CLINIC_LAT = 23.6681;
const CLINIC_LON = 74.0244;
const CLINIC_ADDRESS =
  'Pancholi Dental Care Near Mahipal School, Opposite Govt. Hospital, Sagwara, Dungarpur, Rajasthan 314025';
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC_ADDRESS)}`;
const osmBbox = [
  (CLINIC_LON - 0.01).toFixed(4),
  (CLINIC_LAT - 0.008).toFixed(4),
  (CLINIC_LON + 0.01).toFixed(4),
  (CLINIC_LAT + 0.008).toFixed(4)
].join('%2C');
const osmEmbedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${osmBbox}&layer=mapnik&marker=${CLINIC_LAT}%2C${CLINIC_LON}`;

function LocationMap() {
  const { t } = useLanguage();
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);

  // loading="lazy" alone isn't enough here: the OpenStreetMap embed pulls
  // ~300KB of its own JS, and Chrome's lazy threshold is generous enough that
  // it still fetched during initial page load. Only mount the iframe once the
  // map is actually approaching the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="location-map" ref={wrapRef}>
      {inView && (
        <iframe
          title="Pancholi Dental Care & Hair Transplant Center location"
          src={osmEmbedSrc}
          loading="lazy"
        />
      )}
      <div className="location-popup">
        <strong>Pancholi Dental Care & Hair Transplant Center</strong>
        <p>Near Mahipal School, Opposite Govt. Hospital, Sagwara, Dungarpur, Rajasthan 314025</p>
        <a href={googleMapsUrl} target="_blank" rel="noreferrer">
          {t('contact.openMaps')}
        </a>
      </div>
    </div>
  );
}

function NavIcon({ name }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  };

  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
    about: <><circle cx="12" cy="8" r="3" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    services: <><path d="M4 7.5h16" /><path d="M6 4h12l1 17H5L6 4Z" /><path d="M9 11h6M9 15h4" /></>,
    schedule: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M7 3v4M17 3v4M3.5 10h17" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

function SiteMenu() {
  const { t, lang, toggleLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(() => window.location.hash || '#home');
  const menuToggleRef = useRef(null);
  const sidebarRef = useRef(null);
  const previousOpenRef = useRef(false);
  const previousOverflowRef = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveLink(window.location.hash || '#home');
      setIsOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };

    const handleKeyDown = event => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let focusFrame;

    if (isOpen) {
      if (previousOverflowRef.current === null) {
        previousOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
      focusFrame = requestAnimationFrame(() => {
        sidebarRef.current?.querySelector('a[href]')?.focus();
      });
    } else if (previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
      if (previousOpenRef.current && window.innerWidth < 768) {
        menuToggleRef.current?.focus();
      }
    }

    previousOpenRef.current = isOpen;
    return () => {
      if (focusFrame) cancelAnimationFrame(focusFrame);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (previousOverflowRef.current !== null) {
      document.body.style.overflow = previousOverflowRef.current;
      previousOverflowRef.current = null;
    }
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        ref={menuToggleRef}
        type="button"
        className="sidebar-menu-toggle"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="site-sidebar"
        onClick={() => setIsOpen(open => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <button
        type="button"
        className={`sidebar-overlay${isOpen ? ' is-visible' : ''}`}
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <aside ref={sidebarRef} id="site-sidebar" className={`site-sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="site-sidebar-brand" aria-label="Pancholi Dental Care & Hair Transplant Center">
          <span className="site-sidebar-brand-copy">
            <strong>{t('nav.brand')}</strong>
            <small>{t('nav.brandSub')}</small>
          </span>
          <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Switch language">
            {t('lang.toggle')}
          </button>
        </div>

        <nav className="site-sidebar-nav" aria-label="Main navigation">
          <span className="site-sidebar-eyebrow">{t('nav.explore')}</span>
          <ul>
            {menuItems.map(item => {
              const isActive = activeLink === item.link || (!window.location.hash && item.link === '#home');
              return (
                <li key={item.labelKey}>
                  <a
                    href={item.link}
                    className={isActive ? 'is-active' : ''}
                    aria-label={t(item.labelKey)}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={closeMenu}
                  >
                    <span className="site-sidebar-icon"><NavIcon name={item.icon} /></span>
                    <span>{t(item.labelKey)}</span>
                    {item.labelKey === 'nav.schedule' && <span className="site-sidebar-dot" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="site-sidebar-footer">
          <span className="site-sidebar-eyebrow">{t('nav.needHelp')}</span>
          <a href="tel:+919929823363" className="site-sidebar-call">
            <span className="site-sidebar-call-icon" aria-hidden="true">↗</span>
            <span>
              <strong>{t('nav.callClinic')}</strong>
              <small>+91 99298 23363</small>
            </span>
          </a>
        </div>
      </aside>
    </>
  );
}

function LoadingFallback({ className = '' }) {
  return (
    <div className={`loading-fallback ${className}`} role="status">
      Loading appointment scheduler…
    </div>
  );
}

function ContactForm() {
  const { t } = useLanguage();
  const [fields, setFields] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [submittedName, setSubmittedName] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error: invalid } = await validateContact(fields);
    if (invalid) {
      setSubmitting(false);
      setSubmitError(invalid);
      return;
    }
    setSubmitError(null);
    const { error } = await addContact(data);
    setSubmitting(false);
    if (error) {
      setSubmitError("Something went wrong sending your message. Please try again, or call the clinic directly.");
      return;
    }
    setSubmittedName(fields.firstName);
    setFields({ firstName: '', lastName: '', email: '', message: '' });
  };

  if (submittedName !== null) {
    return (
      <div className="contact-form contact-form-success">
        <h3>{t('contact.thanks', { name: submittedName || 'there' })}</h3>
        <p>{t('contact.thanksBody')}</p>
        <button type="button" className="contact-submit" onClick={() => setSubmittedName(null)}>
          {t('contact.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} onFocusCapture={preloadValidation}>
      <div className="contact-form-row">
        <div className="contact-field">
          <label htmlFor="contactFirstName">{t('contact.firstName')}</label>
          <input
            type="text"
            id="contactFirstName"
            name="firstName"
            placeholder="Jane"
            autoComplete="given-name"
            value={fields.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-field">
          <label htmlFor="contactLastName">{t('contact.lastName')}</label>
          <input
            type="text"
            id="contactLastName"
            name="lastName"
            placeholder="Doe"
            autoComplete="family-name"
            value={fields.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="contact-field">
        <label htmlFor="contactEmail">{t('contact.email')}</label>
        <input
          type="email"
          id="contactEmail"
          name="email"
          placeholder="jane@doe.com"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="contact-field">
        <label htmlFor="contactMessage">{t('contact.message')}</label>
        <textarea
          id="contactMessage"
          name="message"
          rows={6}
          placeholder={t('contact.messagePlaceholder')}
          value={fields.message}
          onChange={handleChange}
          required
        />
      </div>
      {submitError && <p className="contact-form-error">{submitError}</p>}
      <button type="submit" className="contact-submit" disabled={submitting}>
        {submitting ? 'Sending…' : t('contact.submit')} <span className="schedule-continue-arrow">→</span>
      </button>
    </form>
  );
}

function AdminGate() {
  const [loggedIn, setLoggedIn] = useState(null);

  useEffect(() => {
    isAdminLoggedIn().then(setLoggedIn);
  }, []);

  if (loggedIn === null) {
    return <LoadingFallback />;
  }
  if (!loggedIn) {
    return <AdminLogin onSuccess={() => setLoggedIn(true)} />;
  }
  return <AdminDashboard onLogout={() => setLoggedIn(false)} />;
}

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

function getInitialView() {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash;
  if (hash === '#schedule') return 'schedule';
  if (hash === '#admin') return 'admin';
  return 'landing';
}

function AppInner() {
  const { t, lang } = useLanguage();
  const [currentView, setCurrentView] = useState(getInitialView);
  const [entryPhase, setEntryPhase] = useState('language');
  const [musicAutoPlay, setMusicAutoPlay] = useState(false);
  // Time from navigation start to first React mount — how long the site
  // actually took to become usable. If that's over 5s the device/connection
  // is struggling, so we skip autoplaying music (the toggle still works).
  const loadMsRef = useRef(null);

  useEffect(() => {
    loadMsRef.current = performance.now();

    // Deferred to idle: logging a pageview pulls in the Supabase client
    // (~200 KB), and nothing on screen depends on it. Firing it during initial
    // render put that download in direct competition with the content the
    // visitor is waiting for. A second's delay costs nothing analytically —
    // the event still records, and the session id is stable either way.
    let cancel = () => {};
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => logPageview(), { timeout: 3000 });
      cancel = () => window.cancelIdleCallback?.(id);
    } else {
      const id = setTimeout(() => logPageview(), 1200);
      cancel = () => clearTimeout(id);
    }
    return cancel;
  }, []);

  const handleLanguageChosen = () => {
    if (loadMsRef.current !== null && loadMsRef.current <= 5000) {
      startMusic();
      setMusicAutoPlay(true);
    }
    setEntryPhase('tutorial');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#schedule') setCurrentView('schedule');
      else if (hash === '#admin') setCurrentView('admin');
      else setCurrentView('landing');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentView !== 'landing') return;

    const hash = window.location.hash;
    if (!hash || hash === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentView]);

  if (currentView === 'schedule') {
    return (
      <>
        <CursorTrail />
        <Suspense fallback={<LoadingFallback className="schedule-loading" />}>
          <Schedule />
        </Suspense>
      </>
    );
  }

  if (currentView === 'admin') {
    return (
      <>
        <CursorTrail />
        <Suspense fallback={<LoadingFallback />}>
          <AdminGate />
        </Suspense>
      </>
    );
  }

  return (
    <div className="app">
      <CursorTrail />
      <IntroAnimation />
      <ScrollProgressBar />
      <AdminEntryDot />
      <SiteMenu />

      {entryPhase === 'language' && <LanguageGate onChoose={handleLanguageChosen} />}
      {entryPhase !== 'language' && <BackgroundMusic autoPlay={musicAutoPlay} />}
      {entryPhase === 'tutorial' && <Tutorial onDone={() => setEntryPhase('done')} />}

      <main>
        <section id="home" className="hero">
          <div className="hero-background">
            <DeferredAnimation
              load={loadDomeGallery}
              hold={entryPhase === 'language'}
              rootMargin="200px"
              minHeight="100%"
              className="hero-dome-gallery"
              images={heroGalleryImages}
              grayscale={false}
              overlayBlurColor="#cfe6ff"
              imageBorderRadius="16px"
              openedImageBorderRadius="20px"
              fit={0.62}
              padFactor={0.02}
              maxVerticalRotationDeg={35}
              autoRotate
              autoRotateSpeed={0.05}
            />
            <DeferredAnimation
              load={loadPixelSnow}
              hold={entryPhase === 'language'}
              rootMargin="200px"
              minHeight="100%"
              className="hero-pixel-snow"
              color="#ffffff"
              flakeSize={0.01}
              minFlakeSize={1.25}
              pixelResolution={200}
              speed={1.25}
              density={0.3}
              direction={125}
              brightness={1}
            />
          </div>
          <div className="hero-content">
            <div className="hero-typography">
              <ShinyTextType
                key={lang}
                as="h1"
                text={t('hero.title')}
                className="hero-title"
                typingSpeed={32}
                initialDelay={120}
                loop={false}
                showCursor={false}
                speed={4}
                color="#0d4f7c"
                shineColor="#8fd0ff"
                spread={110}
              />
              <h2 className="hero-subheader">{t('hero.subheader')}</h2>
              <a href="#schedule" className="hero-cta">
                {t('hero.cta')}
              </a>
            </div>
          </div>
        </section>

        <StatsBanner />
      </main>

      <ReviewsSection />

      <main>
        <section id="about" className="section profile">
          <DeferredAnimation
            load={loadFloatingLines}
            rootMargin="200px"
            minHeight="100%"
            className="profile-floating-lines"
            linesGradient={['#5aa9f0', '#0d4f7c']}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[8, 10, 8]}
            lineDistance={[9, 7, 9]}
            animationSpeed={0.6}
            interactive
            bendRadius={5}
            bendStrength={-0.5}
            parallax
            parallaxStrength={0.12}
            mixBlendMode="normal"
          />
          <div className="profile-content">
            <MaskRevealText key={lang} text={t('about.paragraph')} />
          </div>
        </section>

        <section id="services" className="section services">
          <h2 className="section-title">{t('services.title')}</h2>
          <Suspense fallback={<div className="services-marquee" />}>
            <ServicesMarquee key={lang} />
          </Suspense>
        </section>
      </main>

      <section id="contact" className="section contact-section">
        <h2 className="section-title">{t('contact.title')}</h2>
        <div className="contact-layout">
          <div className="contact-columns">
            <ContactForm />
            <ContactGallery />
          </div>
          <LocationMap />
        </div>
      </section>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Pancholi Dental Care & Hair Transplant Center. {t('footer.rights')}</p>
      </footer>
    </div>
  );
}

export default App;
