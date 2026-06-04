import { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { getSettings, saveSetting } from '../../lib/storage/settings';
import { COMMON_TIMEZONES } from '../../lib/utils/date';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('gemini');
  const [defaultTimezone, setDefaultTimezone] = useState('America/Los_Angeles');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    setApiKey(settings.apiKey || '');
    setProvider(settings.provider || 'gemini');
    setDefaultTimezone(settings.defaultTimezone || 'America/Los_Angeles');
    setLoading(false);
  }

  async function handleSave() {
    setSaved(false);
    await saveSetting('apiKey', apiKey);
    await saveSetting('provider', provider);
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
        <h1>CalifAI Settings</h1>
        <p className="text-muted">Configure your preferences and API settings</p>
      </div>

      <Card className="options-section">
        <h2 className="options-section-title">AI Provider</h2>

        <Select
          label="AI Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as 'openai' | 'gemini')}
          options={[
            { value: 'gemini', label: 'Google Gemini (Free - Recommended)' },
            { value: 'openai', label: 'OpenAI GPT-4o' }
          ]}
          fullWidth
        />

        <Input
          label={provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          helperText={
            provider === 'gemini'
              ? 'Free tier: 1,500 requests/day - Get your free API key from Google AI Studio'
              : 'Paid tier - Get your API key from OpenAI Platform'
          }
          fullWidth
          placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
        />

        <div className="options-help text-sm text-muted">
          <p>Don't have an API key?</p>
          <a
            href={
              provider === 'gemini'
                ? 'https://aistudio.google.com/app/apikey'
                : 'https://platform.openai.com/api-keys'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="options-link"
          >
            {provider === 'gemini'
              ? 'Get a free key at Google AI Studio →'
              : 'Create one at OpenAI Platform →'}
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
          CalifAI never sends your data to external servers except for AI processing.
        </p>
      </div>
    </div>
  );
}
