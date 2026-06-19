import { useEffect, useState } from 'react';
import { getSettings } from '../../lib/storage/settings';

interface ClockIconProps {
  size?: number;
}

export default function ClockIcon({ size = 20 }: ClockIconProps) {
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
      {/* Clock circle */}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={primaryColor}
        stroke={secondaryColor}
        strokeWidth="2"
      />
      {/* Hour hand */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="8"
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1="12"
        y1="12"
        x2="15"
        y2="12"
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill={secondaryColor}
      />
    </svg>
  );
}
