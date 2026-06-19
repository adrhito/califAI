import { useEffect, useState } from 'react';
import { getSettings } from '../../lib/storage/settings';

interface EditIconProps {
  size?: number;
}

export default function EditIcon({ size = 20 }: EditIconProps) {
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
      {/* Pencil body */}
      <path
        d="M3 21L8 20L20 8L16 4L4 16L3 21Z"
        fill={secondaryColor}
        stroke={secondaryColor}
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      {/* Pencil tip highlight */}
      <path
        d="M16 4L20 8L18 10L14 6L16 4Z"
        fill={primaryColor}
      />
      {/* Edit mark */}
      <line
        x1="6"
        y1="18"
        x2="10"
        y2="14"
        stroke={primaryColor}
        strokeWidth="2"
      />
    </svg>
  );
}
