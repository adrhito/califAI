import React from 'react';
import './TextArea.css';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export default function TextArea({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}: TextAreaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={`textarea-wrapper ${fullWidth ? 'textarea-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="textarea-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`textarea ${hasError ? 'textarea-error' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <div className={`textarea-helper ${hasError ? 'textarea-helper-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
