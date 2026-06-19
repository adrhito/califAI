import { useState, useEffect } from 'react';
import Input from './Input';
import CalendarIcon from './CalendarIcon';
import { formatDateForDisplay } from '../../lib/utils/date';
import { getSettings } from '../../lib/storage/settings';
import './DateInput.css';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  fullWidth?: boolean;
  required?: boolean;
  onClick?: () => void;
}

export default function DateInput({
  label,
  value,
  onChange,
  error,
  fullWidth,
  required,
  onClick
}: DateInputProps) {
  const [dateFormat, setDateFormat] = useState<'US' | 'ISO'>('US');

  useEffect(() => {
    async function loadFormat() {
      const settings = await getSettings();
      setDateFormat(settings.dateFormat || 'US');
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

  // Convert YYYY-MM-DD to display format
  const displayValue = value ? formatDateForDisplay(`${value}T00:00:00`, dateFormat) : '';

  return (
    <div className="date-input-wrapper">
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
        className="date-input-calendar-button"
        onClick={handleClick}
        aria-label="Open calendar"
      >
        <CalendarIcon size={18} />
      </button>
    </div>
  );
}
