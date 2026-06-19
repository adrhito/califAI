import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import ColorPicker from '../../components/ui/ColorPicker';
import { getSettings, saveSetting, GeminiModel } from '../../lib/storage/settings';
import { SUPPORT_URL } from '../../lib/constants';
import { generateIconSet, applyThemedFavicon } from '../../lib/utils/icon-generator';

export default function App() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('gemini');
  const [geminiModel, setGeminiModel] = useState<GeminiModel>('gemini-2.5-flash');
  const [colorPrimary, setColorPrimary] = useState('#FFDFB0');
  const [colorSecondary, setColorSecondary] = useState('#7D2E3D');
  const [invertColors, setInvertColors] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [dateFormat, setDateFormat] = useState<'US' | 'ISO'>('US');
  const [defaultEventColor, setDefaultEventColor] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingColors, setIsEditingColors] = useState(false);
  const [editingColorType, setEditingColorType] = useState<'primary' | 'secondary'>('primary');
  const [hexInputValue, setHexInputValue] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    const primary = settings.colorPrimary || '#FFDFB0';
    const secondary = settings.colorSecondary || '#7D2E3D';

    setGeminiApiKey(settings.geminiApiKey || '');
    setOpenaiApiKey(settings.openaiApiKey || '');
    setProvider(settings.provider || 'gemini');
    setGeminiModel(settings.geminiModel || 'gemini-2.5-flash');
    setColorPrimary(primary);
    setColorSecondary(secondary);
    setInvertColors(settings.invertColors || false);
    setTimeFormat(settings.timeFormat || '12h');
    setDateFormat(settings.dateFormat || 'US');
    setDefaultEventColor(settings.defaultEventColor || '');
    setLoading(false);

    // Update icon to match current colors
    await updateExtensionIcon(primary, secondary);
  }

  async function handleSave() {
    setSaved(false);
    await saveSetting('geminiApiKey', geminiApiKey);
    await saveSetting('openaiApiKey', openaiApiKey);
    await saveSetting('provider', provider);
    await saveSetting('geminiModel', geminiModel);
    await saveSetting('colorPrimary', colorPrimary);
    await saveSetting('colorSecondary', colorSecondary);
    await saveSetting('invertColors', invertColors);
    await saveSetting('timeFormat', timeFormat);
    await saveSetting('dateFormat', dateFormat);
    await saveSetting('defaultEventColor', defaultEventColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleInvertColors() {
    // Swap the color values
    const temp = colorPrimary;
    setColorPrimary(colorSecondary);
    setColorSecondary(temp);

    // Immediately apply the inverted colors to the page
    const root = document.documentElement;
    root.style.setProperty('--color-negroni', colorSecondary);
    root.style.setProperty('--color-burgundy', temp);
    root.style.setProperty('--color-burgundy-light', getLighterSecondaryColor(temp));

    // Save to storage
    await saveSetting('colorPrimary', colorSecondary);
    await saveSetting('colorSecondary', temp);

    // Update icon with inverted colors
    await updateExtensionIcon(colorSecondary, temp);
  }

  async function handleRevertColors() {
    // Reset to default colors
    const defaultPrimary = '#FFDFB0';
    const defaultSecondary = '#7D2E3D';
    setColorPrimary(defaultPrimary);
    setColorSecondary(defaultSecondary);

    // Immediately apply the default colors to the page
    const root = document.documentElement;
    root.style.setProperty('--color-negroni', defaultPrimary);
    root.style.setProperty('--color-burgundy', defaultSecondary);
    root.style.setProperty('--color-burgundy-light', getLighterSecondaryColor(defaultSecondary));

    // Save to storage
    await saveSetting('colorPrimary', defaultPrimary);
    await saveSetting('colorSecondary', defaultSecondary);

    // Update icon with default colors
    await updateExtensionIcon(defaultPrimary, defaultSecondary);
  }

  function getLighterSecondaryColor(hexColor: string) {
    // Convert hex to RGB and lighten by mixing with white
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Mix 60% original color with 40% white for a lighter shade
    const lighterR = Math.round(r * 0.6 + 255 * 0.4);
    const lighterG = Math.round(g * 0.6 + 255 * 0.4);
    const lighterB = Math.round(b * 0.6 + 255 * 0.4);

    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  }

  async function updateExtensionIcon(primary: string, secondary: string) {
    try {
      const iconSet = await generateIconSet(primary, secondary);
      await chrome.action.setIcon({ imageData: iconSet });
      // Also retheme this page's own tab favicon
      applyThemedFavicon(primary, secondary);
    } catch (error) {
      console.error('Failed to update extension icon:', error);
    }
  }

  function updateColorLive(color: string, isPrimary: boolean) {
    const root = document.documentElement;
    if (isPrimary) {
      setColorPrimary(color);
      root.style.setProperty('--color-negroni', color);
      saveSetting('colorPrimary', color); // Fire and forget
      // Update icon with new primary color
      updateExtensionIcon(color, colorSecondary);
    } else {
      setColorSecondary(color);
      root.style.setProperty('--color-burgundy', color);
      root.style.setProperty('--color-burgundy-light', getLighterSecondaryColor(color));
      saveSetting('colorSecondary', color); // Fire and forget
      // Update icon with new secondary color
      updateExtensionIcon(colorPrimary, color);
    }
    // Sync hex input when color changes from picker
    setHexInputValue(color);
  }

  function getDimmedSecondaryColor() {
    // Convert hex to RGB and add transparency
    const hex = colorSecondary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  }

  function handleColorBoxClick(type: 'primary' | 'secondary') {
    setEditingColorType(type);
    setIsEditingColors(true);
    // Initialize hex input with current color
    setHexInputValue(type === 'primary' ? colorPrimary : colorSecondary);
  }

  function handleDoneEditing() {
    setIsEditingColors(false);
  }

  function handleHexInputChange(value: string) {
    // Always allow typing, but only apply valid complete hex codes
    let normalized = value.toUpperCase();

    // Remove # if present for validation
    const withoutHash = normalized.replace('#', '');

    // Only allow valid hex characters
    if (!/^[0-9A-F]{0,6}$/.test(withoutHash)) {
      return;
    }

    // Always show # in the input
    const displayValue = '#' + withoutHash;
    setHexInputValue(displayValue);

    // Only update the actual color if we have a complete 6-character hex code
    if (withoutHash.length === 6) {
      updateColorLive(displayValue, editingColorType === 'primary');
    }
  }

  function handleHexInputBlur() {
    // On blur, if the code is incomplete, revert to the current color
    const withoutHash = hexInputValue.replace('#', '');
    if (withoutHash.length !== 6) {
      setHexInputValue(editingColorType === 'primary' ? colorPrimary : colorSecondary);
    }
  }

  if (loading) {
    return <div className="options">Loading...</div>;
  }

  return (
    <div className="options">
      <div className="options-header">
        <h1>CalifAI Settings</h1>
        <p className="text-muted">Configure your preferences and API settings</p>
      </div>

      <Card className="options-section">
        <h2 className="options-section-title">AI Provider</h2>

        <Select
          label="Primary Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'openai' | 'gemini')}
          options={[
            { value: 'gemini', label: 'Gemini 2.5 Flash (Recommended)' },
            { value: 'openai', label: 'OpenAI GPT-4o-mini' }
          ]}
          fullWidth
        />

        {provider === 'gemini' && (
          <Select
            label="Gemini Model"
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
            options={[
              { value: 'gemini-2.5-flash', label: 'Flash - Best quality' },
              { value: 'gemini-2.5-flash-lite', label: 'Flash-Lite - Fastest (slightly lower quality)' }
            ]}
            fullWidth
          />
        )}

        <Input
          label="Gemini API Key"
          type="password"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          helperText="FREE - Get your own key at ai.google.dev (1,500 requests/day)"
          fullWidth
          placeholder="AIza..."
        />

        <Input
          label="OpenAI API Key (Optional)"
          type="password"
          value={openaiApiKey}
          onChange={(e) => setOpenaiApiKey(e.target.value)}
          helperText="Pay-as-you-go - ~$0.0001 per capture"
          fullWidth
          placeholder="sk-proj-..."
        />

        <div className="options-help text-sm" style={{ opacity: 0.6, marginTop: 'var(--space-3)' }}>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Get Your Free Gemini API Key:</p>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="options-link">ai.google.dev</a><br/>
            2. Sign in with Google<br/>
            3. Click "Get API key" → Copy and paste above<br/>
            4. Free tier: 1,500 requests/day (more than enough for daily use)
          </p>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Why Gemini is recommended:</strong><br/>
            • Completely FREE (1,500/day limit)<br/>
            • Optimized for speed and accuracy<br/>
            • No credit card required
          </p>
          <p>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="options-link"
            >
              Get OpenAI key (optional) →
            </a>
          </p>
        </div>
      </Card>

      <Card className="options-section">
        <h2 className="options-section-title">Color Customization</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              marginBottom: 'var(--space-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)'
            }}>
              Primary Color
            </label>
            <div
              onClick={() => handleColorBoxClick('primary')}
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: colorPrimary,
                border: `3px solid ${getDimmedSecondaryColor()}`,
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'border-color var(--transition-base)'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              marginBottom: 'var(--space-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)'
            }}>
              Secondary Color
            </label>
            <div
              onClick={() => handleColorBoxClick('secondary')}
              style={{
                width: '100%',
                height: '60px',
                backgroundColor: colorSecondary,
                border: `3px solid ${getDimmedSecondaryColor()}`,
                borderRadius: 0,
                cursor: 'pointer',
                transition: 'border-color var(--transition-base)'
              }}
            />
          </div>
        </div>

        {!isEditingColors ? (
          <>
            <Button variant="outline" onClick={handleInvertColors} fullWidth>
              Invert Colors
            </Button>

            <Button variant="outline" onClick={handleRevertColors} fullWidth>
              Revert to Default
            </Button>

            <div className="options-help text-sm" style={{ opacity: 0.6 }}>
              <p>Choose the two colors for your theme. Primary is the background, Secondary is the text and borders.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginBottom: 'var(--space-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-primary)'
              }}>
                {editingColorType === 'primary' ? 'Edit Primary Color' : 'Edit Secondary Color'}
              </label>
              <HexColorPicker
                color={editingColorType === 'primary' ? colorPrimary : colorSecondary}
                onChange={(color) => updateColorLive(color, editingColorType === 'primary')}
                style={{ width: '100%', height: '200px' }}
              />
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Input
                  label="Hex Color Code"
                  value={hexInputValue}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  onBlur={handleHexInputBlur}
                  placeholder="#FFDFB0"
                  fullWidth
                />
              </div>
            </div>

            <Button onClick={handleDoneEditing} fullWidth>
              Done
            </Button>
          </>
        )}
      </Card>

      <Card className="options-section">
        <h2 className="options-section-title">Date & Time Format</h2>

        <Select
          label="Time Format"
          value={timeFormat}
          onChange={(e) => setTimeFormat(e.target.value as '12h' | '24h')}
          options={[
            { value: '12h', label: '12-hour (2:30 PM)' },
            { value: '24h', label: '24-hour (14:30)' }
          ]}
          fullWidth
        />

        <Select
          label="Date Format"
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value as 'US' | 'ISO')}
          options={[
            { value: 'US', label: 'US (MM/DD/YYYY)' },
            { value: 'ISO', label: 'ISO (YYYY-MM-DD)' }
          ]}
          fullWidth
        />

        <ColorPicker
          label="Default Event Color"
          value={defaultEventColor}
          onChange={setDefaultEventColor}
        />
      </Card>

      <div className="options-actions">
        <Button onClick={handleSave} size="lg">
          {saved ? '✓ Saved' : 'Save Settings'}
        </Button>
      </div>

      <div className="options-footer text-xs text-muted">
        <p>
          Your settings are stored locally and encrypted by Chrome.
          CalifAI never sends your data to external servers except for AI processing.
        </p>
        <p style={{ marginTop: 'var(--space-3)' }}>
          CalifAI is free to use with your own API key. If it saves you time,
          you can{' '}
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="options-link"
          >
            ☕ buy me a coffee
          </a>
          .
        </p>
      </div>
    </div>
  );
}
