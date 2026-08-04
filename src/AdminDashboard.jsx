import { useEffect, useMemo, useState } from 'react';
import { Calendar } from './Calendar.jsx';
import AdminCharts from './AdminCharts.jsx';
import {
  changeAdminPassword,
  DEFAULT_AVAILABILITY,
  enrollMfa,
  getAppointments,
  getAvailability,
  getContacts,
  getMfaFactors,
  logoutAdmin,
  setAvailability,
  unenrollMfa,
  updateAppointmentStatus,
  verifyMfaEnrollment
} from './adminStore.js';
import './Admin.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

const TABS = [
  { id: 'appointments', label: 'Appointments' },
  { id: 'contacts', label: 'Messages' },
  { id: 'availability', label: 'Availability' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'security', label: 'Security' }
];

function formatHour(hour) {
  const period = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

function formatDate(isoOrDate) {
  const date = new Date(isoOrDate);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function AppointmentsPanel({ appointments, onChange }) {
  const respond = async (appt, status) => {
    await updateAppointmentStatus(appt.id, status);
    onChange();

    const subject = status === 'accepted' ? 'Your appointment is confirmed' : 'About your appointment request';
    const body =
      status === 'accepted'
        ? `Hi ${appt.firstName},\n\nYour appointment on ${formatDate(appt.date)} at ${appt.time} is confirmed. See you then!\n\n— Pancholi Dental Care`
        : `Hi ${appt.firstName},\n\nUnfortunately we can't accommodate your appointment request on ${formatDate(appt.date)} at ${appt.time}. Please pick another time on our scheduling page.\n\n— Pancholi Dental Care`;

    if (appt.email) {
      window.open(`mailto:${appt.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    } else if (appt.phone) {
      window.open(`sms:${appt.countryCode || ''}${appt.phone}?body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  if (appointments.length === 0) {
    return <p className="admin-empty">No appointment requests yet.</p>;
  }

  return (
    <ul className="admin-list">
      {appointments.map(appt => (
        <li key={appt.id} className={`admin-card admin-card--${appt.status}`}>
          <div className="admin-card-main">
            <strong>
              {appt.firstName} {appt.lastName}
            </strong>
            <span className="admin-card-meta">
              {formatDate(appt.date)} at {appt.time}
            </span>
            <span className="admin-card-meta">
              {appt.email} {appt.phone && `· ${appt.countryCode || ''}${appt.phone}`}
            </span>
          </div>
          <div className="admin-card-actions">
            <span className={`admin-status admin-status--${appt.status}`}>{appt.status}</span>
            {appt.status === 'pending' && (
              <>
                <button type="button" className="admin-btn admin-btn--accept" onClick={() => respond(appt, 'accepted')}>
                  Accept
                </button>
                <button type="button" className="admin-btn admin-btn--reject" onClick={() => respond(appt, 'rejected')}>
                  Reject
                </button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContactsPanel({ contacts }) {
  if (contacts.length === 0) {
    return <p className="admin-empty">No messages yet.</p>;
  }

  return (
    <ul className="admin-list">
      {contacts.map(contact => (
        <li key={contact.id} className="admin-card">
          <div className="admin-card-main">
            <strong>
              {contact.firstName} {contact.lastName}
            </strong>
            <span className="admin-card-meta">{contact.email}</span>
            <p className="admin-card-message">{contact.message}</p>
            <span className="admin-card-meta">{formatDate(contact.submittedAt)}</span>
          </div>
          <div className="admin-card-actions">
            <a className="admin-btn" href={`mailto:${contact.email}`}>
              Reply
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SessionEditor({ label, sessions, onChange }) {
  const updateSession = (index, field, value) => {
    const next = sessions.map((session, i) => (i === index ? { ...session, [field]: Number(value) } : session));
    onChange(next);
  };

  const removeSession = index => {
    onChange(sessions.filter((_, i) => i !== index));
  };

  const addSession = () => {
    onChange([...sessions, { start: 10, end: 14 }]);
  };

  return (
    <div className="admin-field">
      <label>{label}</label>
      {sessions.length === 0 && <p className="admin-empty">Closed.</p>}
      {sessions.map((session, index) => (
        <div className="admin-field-row admin-session-row" key={index}>
          <div className="admin-field">
            <label htmlFor={`${label}-start-${index}`}>Start</label>
            <select
              id={`${label}-start-${index}`}
              value={session.start}
              onChange={e => updateSession(index, 'start', e.target.value)}
            >
              {HOUR_OPTIONS.map(hour => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor={`${label}-end-${index}`}>End</label>
            <select
              id={`${label}-end-${index}`}
              value={session.end}
              onChange={e => updateSession(index, 'end', e.target.value)}
            >
              {HOUR_OPTIONS.map(hour => (
                <option key={hour} value={hour}>
                  {formatHour(hour)}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="admin-btn admin-btn--reject" onClick={() => removeSession(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn" onClick={addSession}>
        + Add session
      </button>
    </div>
  );
}

function AvailabilityPanel({ availability, onSave }) {
  const [weekdaySessions, setWeekdaySessions] = useState(availability.weekdaySessions);
  const [sundaySessions, setSundaySessions] = useState(availability.sundaySessions);
  const [closedDays, setClosedDays] = useState(availability.closedDays || []);
  const [saved, setSaved] = useState(false);

  const toggleClosedDay = dayIndex => {
    setSaved(false);
    setClosedDays(prev => (prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort()));
  };

  const handleSave = e => {
    e.preventDefault();
    const next = { weekdaySessions, sundaySessions, closedDays };
    setAvailability(next);
    onSave(next);
    setSaved(true);
  };

  return (
    <form className="admin-availability" onSubmit={handleSave}>
      <SessionEditor
        label="Monday – Saturday hours"
        sessions={weekdaySessions}
        onChange={value => {
          setSaved(false);
          setWeekdaySessions(value);
        }}
      />
      <SessionEditor
        label="Sunday hours"
        sessions={sundaySessions}
        onChange={value => {
          setSaved(false);
          setSundaySessions(value);
        }}
      />

      <div className="admin-field">
        <label>Mark a day fully closed</label>
        <div className="admin-day-toggles">
          {DAY_LABELS.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`admin-day-toggle ${closedDays.includes(index) ? 'admin-day-toggle--active' : ''}`}
              onClick={() => toggleClosedDay(index)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="admin-btn admin-btn--primary">
        Save availability
      </button>
      {saved && <span className="admin-saved-hint">Saved — the scheduling page now reflects this.</span>}
    </form>
  );
}

function CalendarPanel({ appointments }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const accepted = appointments.filter(a => a.status === 'accepted');
  const markedDates = useMemo(() => accepted.map(a => a.date), [accepted]);

  const dayKey = date => new Date(date).toDateString();
  const appointmentsForDay = accepted.filter(a => dayKey(a.date) === dayKey(selectedDate));

  return (
    <div className="admin-calendar-panel">
      <Calendar value={selectedDate} onChange={setSelectedDate} markedDates={markedDates} ariaLabel="Confirmed appointments calendar" />
      <div className="admin-calendar-agenda">
        <h3>{formatDate(selectedDate)}</h3>
        {appointmentsForDay.length === 0 ? (
          <p className="admin-empty">No confirmed appointments this day.</p>
        ) : (
          <ul className="admin-agenda-list">
            {appointmentsForDay
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(appt => (
                <li key={appt.id} className="admin-agenda-item">
                  <span className="admin-agenda-time">{appt.time}</span>
                  <span>
                    {appt.firstName} {appt.lastName}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const MIN_PASSWORD_LENGTH = 10;

function PasswordPanel() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setDone(false);

    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (next === current) {
      setError('New password must be different from the current one.');
      return;
    }

    setBusy(true);
    const { error: changeError } = await changeAdminPassword(current, next);
    setBusy(false);
    if (changeError) {
      setError(changeError);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  };

  return (
    <form className="admin-availability admin-password-form" onSubmit={submit}>
      <h3>Change Password</h3>
      <p className="admin-card-meta">
        Signing out everywhere else happens automatically, so any other device stays locked out.
      </p>

      <div className="admin-field">
        <label htmlFor="pwCurrent">Current password</label>
        <input
          type="password"
          id="pwCurrent"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor="pwNew">New password</label>
        <input
          type="password"
          id="pwNew"
          value={next}
          onChange={e => setNext(e.target.value)}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor="pwConfirm">Confirm new password</label>
        <input
          type="password"
          id="pwConfirm"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {error && <p className="admin-login-error">{error}</p>}
      {done && <span className="admin-saved-hint">Password changed. Other devices have been signed out.</span>}

      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? 'Changing…' : 'Change password'}
      </button>
    </form>
  );
}

function SecurityPanel() {
  const [factors, setFactors] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshFactors = () => getMfaFactors().then(setFactors);

  useEffect(() => {
    refreshFactors();
  }, []);

  const startEnroll = async () => {
    setError('');
    setBusy(true);
    const result = await enrollMfa();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEnrolling(result);
    setCode('');
  };

  const confirmEnroll = async e => {
    e.preventDefault();
    setBusy(true);
    const { error: verifyError } = await verifyMfaEnrollment(enrolling.factorId, code);
    setBusy(false);
    if (verifyError) {
      setError('Incorrect code. Try again.');
      return;
    }
    setEnrolling(null);
    setError('');
    refreshFactors();
  };

  const removeFactor = async factorId => {
    setBusy(true);
    await unenrollMfa(factorId);
    setBusy(false);
    refreshFactors();
  };

  const verifiedFactor = factors.find(f => f.status === 'verified');

  return (
    <div className="admin-security">
      <h3>Two-Factor Authentication</h3>
      {verifiedFactor ? (
        <>
          <p className="admin-empty">Two-factor authentication is enabled on this account.</p>
          <button type="button" className="admin-btn admin-btn--reject" disabled={busy} onClick={() => removeFactor(verifiedFactor.id)}>
            Remove two-factor authentication
          </button>
        </>
      ) : enrolling ? (
        <form className="admin-availability" onSubmit={confirmEnroll}>
          <p>Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password), then enter the 6-digit code.</p>
          {/* Supabase returns totp.qr_code as a data: URI, so this is an image
              source — not markup. It was previously injected with
              dangerouslySetInnerHTML, which both rendered the URI as literal
              text (no QR ever appeared) and left an HTML sink here for no
              reason. An <img> removes the sink and actually displays. */}
          <img className="admin-mfa-qr" src={enrolling.qrCode} alt="QR code for setting up two-factor authentication" width="200" height="200" />
          <p className="admin-card-meta">Can't scan? Enter this key manually: {enrolling.secret}</p>
          <div className="admin-field">
            <label htmlFor="mfaEnrollCode">Authentication code</label>
            <input
              type="text"
              id="mfaEnrollCode"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          {error && <p className="admin-login-error">{error}</p>}
          <div className="admin-field-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || code.length !== 6}>
              Verify & enable
            </button>
            <button type="button" className="admin-btn" onClick={() => setEnrolling(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="admin-empty">Two-factor authentication is not enabled. Add it for stronger account protection.</p>
          {error && <p className="admin-login-error">{error}</p>}
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={startEnroll}>
            Set up two-factor authentication
          </button>
        </>
      )}
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [availability, setAvailabilityState] = useState(DEFAULT_AVAILABILITY);

  const refreshAppointments = () => getAppointments().then(setAppointments);

  useEffect(() => {
    refreshAppointments();
    getContacts().then(setContacts);
    getAvailability().then(setAvailabilityState);
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    onLogout();
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <h1>Pancholi Dental Care — Admin</h1>
          <p>Signed in as Harsh Pancholi</p>
        </div>
        <div className="admin-dashboard-header-actions">
          <a href="#home" className="admin-btn">
            View site
          </a>
          <button type="button" className="admin-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="admin-panel">
        {tab === 'appointments' && <AppointmentsPanel appointments={appointments} onChange={refreshAppointments} />}
        {tab === 'contacts' && <ContactsPanel contacts={contacts} />}
        {tab === 'availability' && <AvailabilityPanel availability={availability} onSave={setAvailabilityState} />}
        {tab === 'calendar' && <CalendarPanel appointments={appointments} />}
        {tab === 'analytics' && <AdminCharts />}
        {tab === 'security' && (
          <>
            <PasswordPanel />
            <SecurityPanel />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
