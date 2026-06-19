import { CALENDAR_COLORS } from '../../types/event';
import './ColorPicker.css';

interface ColorPickerProps {
  value?: string;
  onChange: (colorId: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="color-picker">
      {label && <label className="color-picker-label">{label}</label>}
      <div className="color-picker-options">
        {CALENDAR_COLORS.map((color) => (
          <button
            key={color.id}
            className={`color-picker-option ${value === color.id ? 'selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            onClick={() => onChange(color.id)}
            title={color.name}
            type="button"
            aria-label={color.name}
          >
            {value === color.id && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
