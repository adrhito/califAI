import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { getSettings } from '../../lib/storage/settings';

// Apply custom theme colors
async function applyCustomColors() {
  const settings = await getSettings();

  if (settings.colorPrimary && settings.colorSecondary) {
    const root = document.documentElement;
    root.style.setProperty('--color-negroni', settings.colorPrimary);
    root.style.setProperty('--color-burgundy', settings.colorSecondary);

    // Create lighter version of secondary color
    const hex = settings.colorSecondary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lighterR = Math.round(r * 0.6 + 255 * 0.4);
    const lighterG = Math.round(g * 0.6 + 255 * 0.4);
    const lighterB = Math.round(b * 0.6 + 255 * 0.4);
    const lighterColor = `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
    root.style.setProperty('--color-burgundy-light', lighterColor);
  }
}

applyCustomColors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
