import { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { getSettings, saveSetting } from '../../lib/storage/settings';
import { COMMON_TIMEZONES } from '../../lib/utils/date';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [defaultTimezone, setDefaultTimezone] = useState('America/Los_Angeles');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    setApiKey(settings.apiKey || '');
    setDefaultTimezone(settings.defaultTimezone || 'America/Los_Angeles');
    setLoading(false);
  }

  async function handleSave() {
    setSaved(false);
    await saveSetting('apiKey', apiKey);
    await saveSetting('defaultTimezone', defaultTimezone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <div className="options">Loading...</div>;
  }

  return (
    <div className="options">
      <div className="options-header">
        <h1>Calify Settings</h1>
        <p className="text-muted">Configure your preferences and API settings</p>
      </div>

      <Card className="options-section">
        <h2 className="options-section-title">AI Provider</h2>

        <Input
          label="Gemini API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          helperText="Get your API key from Google AI Studio"
          fullWidth
        />

        <div className="options-help text-sm text-muted">
          <p>Don't have an API key?</p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="options-link"
          >
            Create one at Google AI Studio →
          </a>
        </div>
      </Card>

      <Card className="options-section">
        <h2 className="options-section-title">Defaults</h2>

        <Select
          label="Default Timezone"
          value={defaultTimezone}
          onChange={(e) => setDefaultTimezone(e.target.value)}
          options={COMMON_TIMEZONES}
          fullWidth
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
          Calify never sends your data to external servers except for AI processing.
        </p>
      </div>
    </div>
  );
}
