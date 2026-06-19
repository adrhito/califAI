import { useState } from 'react';
import './Calendar.css';

interface CalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  onClose?: () => void;
}

export default function Calendar({ value, onChange, onClose }: CalendarProps) {
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function getDaysInMonth(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function handlePrevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function handleDateClick(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    onClose?.();
  }

  function isSelected(date: Date): boolean {
    if (!value) return false;
    const selected = new Date(value + 'T00:00:00');
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={handlePrevMonth} className="calendar-nav">
          ←
        </button>
        <div className="calendar-month">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button type="button" onClick={handleNextMonth} className="calendar-nav">
          →
        </button>
      </div>

      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}
        {days.map((date, index) => (
          <div key={index} className="calendar-day-cell">
            {date && (
              <button
                type="button"
                className={`calendar-day ${isSelected(date) ? 'calendar-day-selected' : ''} ${isToday(date) ? 'calendar-day-today' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
