import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${hasError ? 'input-error' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <div className={`input-helper ${hasError ? 'input-helper-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
