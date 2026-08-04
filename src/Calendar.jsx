import { useState } from 'react';
import './Calendar.css';

export function Calendar({ value, onChange, ariaLabel = 'Calendar', disabledDaysOfWeek = [], markedDates = [] }) {
  const [viewDate, setViewDate] = useState(value || new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value) : null;
  if (selectedDate) {
    selectedDate.setHours(0, 0, 0, 0);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const markedTimestamps = markedDates.map(d => {
    const marked = new Date(d);
    marked.setHours(0, 0, 0, 0);
    return marked.getTime();
  });

  const handleSelectDay = day => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return;
    if (disabledDaysOfWeek.includes(date.getDay())) return;
    onChange?.(date);
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="calendar" role="region" aria-label={ariaLabel}>
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-month">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          className="calendar-nav"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />;
          }

          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);
          const isClosedDay = disabledDaysOfWeek.includes(date.getDay());
          const isPast = date < today;
          const isDisabled = isPast || isClosedDay;
          const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
          const isToday = date.getTime() === today.getTime();
          const isMarked = markedTimestamps.includes(date.getTime());

          return (
            <button
              key={day}
              type="button"
              className={`calendar-day ${isSelected ? 'calendar-day--selected' : ''} ${
                isDisabled ? 'calendar-day--disabled' : ''
              } ${isToday ? 'calendar-day--today' : ''} ${isMarked ? 'calendar-day--marked' : ''}`}
              onClick={() => handleSelectDay(day)}
              disabled={isDisabled}
              aria-label={`${monthNames[month]} ${day}, ${year}`}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
