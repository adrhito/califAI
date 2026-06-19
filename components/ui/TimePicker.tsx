import { useState } from 'react';
import Button from './Button';
import './TimePicker.css';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  onClose: () => void;
}

export default function TimePicker({ value, onChange, onClose }: TimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number);

  // Convert 24-hour to 12-hour format
  const isPMInitial = hours >= 12;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  const [selectedHour, setSelectedHour] = useState(hour12);
  const [selectedMinute, setSelectedMinute] = useState(minutes);
  const [isPM, setIsPM] = useState(isPMInitial);

  function handleHourClick(e: React.MouseEvent, hour: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedHour(hour);
  }

  function handleMinuteClick(e: React.MouseEvent, minute: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMinute(minute);
  }

  function handlePeriodToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsPM(!isPM);
  }

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    let finalHour = selectedHour;
    if (isPM && selectedHour < 12) {
      finalHour = selectedHour + 12;
    } else if (!isPM && selectedHour === 12) {
      finalHour = 0;
    }
    const timeString = `${String(finalHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    onChange(timeString);
    onClose();
  }

  // Generate hours (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // Generate minutes in 5-minute intervals
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="time-picker">
      <div className="time-picker-header">
        <h3 className="time-picker-title">Select Time</h3>
      </div>

      <div className="time-picker-display">
        <span className="time-picker-display-time">
          {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
        </span>
        <button
          className="time-picker-period-toggle"
          onClick={(e) => handlePeriodToggle(e)}
        >
          {isPM ? 'PM' : 'AM'}
        </button>
      </div>

      <div className="time-picker-body">
        <div className="time-picker-column">
          <div className="time-picker-column-header">Hour</div>
          <div className="time-picker-options">
            {hourOptions.map((hour) => (
              <button
                key={hour}
                className={`time-picker-option ${selectedHour === hour ? 'time-picker-option-selected' : ''}`}
                onClick={(e) => handleHourClick(e, hour)}
              >
                {hour}
              </button>
            ))}
          </div>
        </div>

        <div className="time-picker-column">
          <div className="time-picker-column-header">Minute</div>
          <div className="time-picker-options">
            {minuteOptions.map((minute) => (
              <button
                key={minute}
                className={`time-picker-option ${selectedMinute === minute ? 'time-picker-option-selected' : ''}`}
                onClick={(e) => handleMinuteClick(e, minute)}
              >
                {String(minute).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="time-picker-actions">
        <Button variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} fullWidth>
          Cancel
        </Button>
        <Button onClick={(e) => handleConfirm(e)} fullWidth>
          Confirm
        </Button>
      </div>
    </div>
  );
}
