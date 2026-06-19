import { useEffect, useState } from 'react';
import { getSettings } from '../../lib/storage/settings';

interface CalendarIconProps {
  size?: number;
}

export default function CalendarIcon({ size = 20 }: CalendarIconProps) {
  const [primaryColor, setPrimaryColor] = useState('#FFDFB0');
  const [secondaryColor, setSecondaryColor] = useState('#7D2E3D');

  useEffect(() => {
    loadColors();
  }, []);

  async function loadColors() {
    const settings = await getSettings();
    setPrimaryColor(settings.colorPrimary || '#FFDFB0');
    setSecondaryColor(settings.colorSecondary || '#7D2E3D');
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar body */}
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        fill={primaryColor}
        stroke={secondaryColor}
        strokeWidth="2"
      />
      {/* Top binding area */}
      <rect
        x="3"
        y="4"
        width="18"
        height="4"
        fill={secondaryColor}
      />
      {/* Binding rings */}
      <line
        x1="7"
        y1="2"
        x2="7"
        y2="6"
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="2"
        x2="17"
        y2="6"
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Date dots */}
      <circle cx="8" cy="12" r="1" fill={secondaryColor} />
      <circle cx="12" cy="12" r="1" fill={secondaryColor} />
      <circle cx="16" cy="12" r="1" fill={secondaryColor} />
      <circle cx="8" cy="16" r="1" fill={secondaryColor} />
      <circle cx="12" cy="16" r="1" fill={secondaryColor} />
      <circle cx="16" cy="16" r="1" fill={secondaryColor} />
    </svg>
  );
}
