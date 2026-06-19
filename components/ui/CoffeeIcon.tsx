import { useEffect, useState } from 'react';
import { getSettings } from '../../lib/storage/settings';

interface CoffeeIconProps {
  size?: number;
}

export default function CoffeeIcon({ size = 22 }: CoffeeIconProps) {
  const [secondaryColor, setSecondaryColor] = useState('#7D2E3D');

  useEffect(() => {
    loadColors();
  }, []);

  async function loadColors() {
    const settings = await getSettings();
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
      {/* Steam - only visible on hover, see .coffee-button:hover .coffee-steam */}
      <rect className="coffee-steam" x="7" y="2" width="2" height="4" fill={secondaryColor} />
      <rect className="coffee-steam" x="12" y="1" width="2" height="4" fill={secondaryColor} />
      {/* Cup body */}
      <rect x="4" y="9" width="13" height="11" fill={secondaryColor} />
      {/* Cup handle */}
      <path
        d="M17 12H19A2 2 0 0 1 19 16H17"
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinecap="square"
      />
      {/* Saucer */}
      <rect x="3" y="20" width="15" height="2" fill={secondaryColor} />
    </svg>
  );
}
