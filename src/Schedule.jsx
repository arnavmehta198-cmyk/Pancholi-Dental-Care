import { useEffect, useState } from 'react';
import { Calendar } from './Calendar';
import TimePicker from './TimePicker';
import { addAppointment, DEFAULT_AVAILABILITY, getAvailability, getSessionsForDay } from './adminStore.js';
import { logBookingCompleted, logBookingPageView } from './analytics.js';
import { useLanguage } from './i18n.jsx';
import { preloadValidation, validateAppointment } from './validation.js';
import './Schedule.css';

function ScheduleProgressBar({ step, totalSteps }) {
  const percent = Math.min(100, ((step - 1) / (totalSteps - 1)) * 100);

  return (
    <div
      className="schedule-progress-track"
      role="progressbar"
      aria-label="Scheduling progress"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="schedule-progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function Schedule() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [availability, setAvailabilityState] = useState(DEFAULT_AVAILABILITY);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAvailability().then(setAvailabilityState);
  }, []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '',
    phone: '',
    date: null,
    time: ''
  });

  const closedDaysOfWeek = availability.closedDays || [];
  const sessionsForSelectedDay = getSessionsForDay(
    availability,
    formData.date ? new Date(formData.date).getDay() : 1
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const handleContinue = async e => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!emailValid || !formData.countryCode.trim() || !formData.phone.trim()) return;
      logBookingPageView();
      setStep(3);
    } else if (step === 3) {
      if (!formData.date || !formData.time) return;
      const rawDate = formData.date instanceof Date ? formData.date.toISOString() : formData.date;
      setSubmitting(true);
      const { data, error: invalid } = await validateAppointment({ ...formData, date: rawDate });
      if (invalid) {
        setSubmitting(false);
        setSubmitError(invalid);
        return;
      }
      setSubmitError(null);
      const { error } = await addAppointment(data);
      setSubmitting(false);
      if (error) {
        setSubmitError('Something went wrong booking your appointment. Please try again, or call the clinic directly.');
        return;
      }
      logBookingCompleted();
      setStep(4);
    }
  };

  const canContinueStep1 = formData.firstName.trim() && formData.lastName.trim();
  const canContinueStep2 = emailValid && formData.countryCode.trim() && formData.phone.trim();
  const canContinueStep3 = formData.date && formData.time;
  const canContinue =
    step === 1 ? canContinueStep1 : step === 2 ? canContinueStep2 : canContinueStep3;

  const headingText =
    step === 1
      ? t('schedule.step1')
      : step === 2
        ? t('schedule.step2', { name: formData.firstName || 'there' })
        : step === 3
          ? t('schedule.step3')
          : t('schedule.step4', { name: formData.firstName || 'there' });

  const goBack = e => {
    e.preventDefault();
    setStep(prev => Math.max(1, prev - 1));
  };

  if (step === 4) {
    return (
      <div className="schedule-page">
        <ScheduleProgressBar step={step} totalSteps={4} />
        <main className="schedule-main schedule-main--success">
          <h1 className="schedule-heading">{headingText}</h1>

          <a href="#home" className="schedule-continue schedule-home-button">
            {t('schedule.homepage')}
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <ScheduleProgressBar step={step} totalSteps={4} />
      <a href="#home" className="schedule-back" aria-label="Go back to home page">
        {t('schedule.back')}
      </a>

      <main className="schedule-main">
        <h1 className="schedule-heading">{headingText}</h1>

        <form className="schedule-form" onSubmit={handleContinue} onFocusCapture={preloadValidation}>
          {step === 1 ? (
            <div className="schedule-fields schedule-fields--two">
              <div className="schedule-field-card">
                <label htmlFor="firstName">{t('schedule.firstName')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Jane"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="schedule-field-card">
                <label htmlFor="lastName">{t('schedule.lastName')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="schedule-fields schedule-fields--three">
              <div className="schedule-field-card schedule-field-card--email">
                <label htmlFor="email">{t('schedule.email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="jane@doe.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="schedule-field-card schedule-field-card--code">
                <label htmlFor="countryCode">{t('schedule.countryCode')}</label>
                <input
                  type="text"
                  id="countryCode"
                  name="countryCode"
                  placeholder="+1"
                  value={formData.countryCode}
                  onChange={handleChange}
                  autoComplete="tel-country-code"
                  required
                />
              </div>
              <div className="schedule-field-card schedule-field-card--phone">
                <label htmlFor="phone">{t('schedule.phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="123 456 789"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
          )}

          {(step === 2 || step === 3) && (
            <button type="button" className="schedule-step-back" onClick={goBack}>
              {t('schedule.back')}
            </button>
          )}

          {step === 3 && (
            <div className="schedule-booking">
              <div className="schedule-booking-col">
                <span className="schedule-booking-label">{t('schedule.date')}</span>
                <Calendar
                  value={formData.date}
                  onChange={date => setFormData(prev => ({ ...prev, date, time: '' }))}
                  disabledDaysOfWeek={closedDaysOfWeek}
                  ariaLabel="Select appointment date"
                />
              </div>
              <div className="schedule-booking-col">
                <span className="schedule-booking-label">{t('schedule.time')}</span>
                <TimePicker
                  value={formData.time}
                  onChange={time => setFormData(prev => ({ ...prev, time }))}
                  sessions={sessionsForSelectedDay}
                />
              </div>
            </div>
          )}

          {submitError && <p className="schedule-form-error">{submitError}</p>}

          <button type="submit" className="schedule-continue" disabled={!canContinue || submitting}>
            {submitting ? 'Booking…' : step === 3 ? t('schedule.finish') : t('schedule.continue')}{' '}
            <span className="schedule-continue-arrow">→</span>
          </button>
        </form>
      </main>
    </div>
  );
}

export default Schedule;
