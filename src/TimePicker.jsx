import { useLanguage } from './i18n.jsx';
import './TimePicker.css';

function formatTime(hours, minutes) {
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

function TimePicker({ value, onChange, intervalMinutes = 30, sessions = [{ start: 9, end: 17 }] }) {
  const { t } = useLanguage();
  if (sessions.length === 0) {
    return (
      <div className="time-picker time-picker--empty" role="group" aria-label="Available appointment times">
        <p>{t('schedule.closed')}</p>
      </div>
    );
  }

  return (
    <div className="time-picker" role="group" aria-label="Available appointment times">
      {sessions.map((session, sessionIndex) => {
        const times = [];
        let currentMinutes = session.start * 60;
        const endMinutes = session.end * 60;
        while (currentMinutes <= endMinutes) {
          times.push(formatTime(Math.floor(currentMinutes / 60), currentMinutes % 60));
          currentMinutes += intervalMinutes;
        }

        return (
          <div className="time-picker-session" key={sessionIndex}>
            <span className="time-picker-session-label">
              {formatTime(session.start, 0)} – {formatTime(session.end, 0)}
            </span>
            <div className="time-picker-slots">
              {times.map(time => (
                <button
                  key={time}
                  type="button"
                  className={`time-slot ${value === time ? 'time-slot--selected' : ''}`}
                  onClick={() => onChange?.(time)}
                  aria-pressed={value === time}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TimePicker;
