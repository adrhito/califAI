import React from 'react';
import './Select.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export default function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  options,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`select-wrapper ${fullWidth ? 'select-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`select ${hasError ? 'select-error' : ''}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <div className={`select-helper ${hasError ? 'select-helper-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
