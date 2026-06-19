import { useState, useEffect } from 'react';
import Input from './Input';
import ClockIcon from './ClockIcon';
import { formatTimeForDisplay } from '../../lib/utils/date';
import { getSettings } from '../../lib/storage/settings';
import './TimeInput.css';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fullWidth?: boolean;
  required?: boolean;
  onClick?: () => void;
}

export default function TimeInput({
  label,
  value,
  onChange,
  error,
  fullWidth,
  required,
  onClick
}: TimeInputProps) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  useEffect(() => {
    async function loadFormat() {
      const settings = await getSettings();
      setTimeFormat(settings.timeFormat || '12h');
    }
    loadFormat();
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  }

  // Convert HH:mm to display format
  const displayValue = value ? formatTimeForDisplay(`2000-01-01T${value}:00`, timeFormat) : '';

  return (
    <div className="time-input-wrapper">
      <Input
        label={label}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        error={error}
        fullWidth={fullWidth}
        required={required}
        readOnly
        onClick={handleClick}
      />
      <button
        type="button"
        className="time-input-clock-button"
        onClick={handleClick}
        aria-label="Open time picker"
      >
        <ClockIcon size={18} />
      </button>
    </div>
  );
}
