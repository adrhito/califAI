import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import { saveSetting } from '../../lib/storage/settings';
import './SetupView.css';

export default function SetupView() {
  const { setView } = useAppState();
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('gemini');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting setup...');

      // Save API key and provider
      await saveSetting('apiKey', apiKey);
      await saveSetting('provider', provider);
      console.log('Settings saved');

      console.log('Requesting Google authorization...');
      // Authorize Google
      const response = await sendToBackground({ type: 'AUTHORIZE_GOOGLE' });
      console.log('Authorization response:', response);

      if (!response.success || !response.data.success) {
        throw new Error('Google authorization failed');
      }

      console.log('Authorization successful, going to home');
      setView('home');
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setup-view">
      <div className="setup-content">
        <div className="setup-header">
          <h1 className="setup-title">Welcome to CalifAI</h1>
          <p className="setup-subtitle text-muted">
            Let's get you set up to start capturing calendar events
          </p>
        </div>

        <Card className="setup-card">
          <div className="setup-step">
            <div className="setup-step-number">1</div>
            <div className="setup-step-content">
              <h3 className="setup-step-title">Choose your AI provider</h3>
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'openai' | 'gemini')}
                options={[
                  { value: 'gemini', label: 'Google Gemini 2.5 Flash (FREE - Recommended)' },
                  { value: 'openai', label: 'OpenAI GPT-4o-mini ($0.002/image)' }
                ]}
                fullWidth
              />
            </div>
          </div>

          <div className="setup-step">
            <div className="setup-step-number">2</div>
            <div className="setup-step-content">
              <h3 className="setup-step-title">
                Get your {provider === 'gemini' ? 'FREE' : ''} API key
              </h3>
              <p className="setup-step-description text-sm text-muted">
                Visit{' '}
                <a
                  href={
                    provider === 'gemini'
                      ? 'https://aistudio.google.com/app/apikey'
                      : 'https://platform.openai.com/api-keys'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="setup-link"
                >
                  {provider === 'gemini' ? 'Google AI Studio' : 'OpenAI Platform'}
                </a>
                {' '}to create an API key
                {provider === 'gemini' && ' (completely FREE - 1 million tokens/month)'}
                {provider === 'openai' && ' (uses ultra-cheap GPT-4o-mini model)'}
              </p>
            </div>
          </div>

          <div className="setup-step">
            <div className="setup-step-number">3</div>
            <div className="setup-step-content">
              <h3 className="setup-step-title">Enter your API key</h3>
              <Input
                placeholder={provider === 'gemini' ? 'AIza... or AQ.Ab...' : 'sk-proj-...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={error}
                fullWidth
                type="password"
              />
            </div>
          </div>

          <div className="setup-step">
            <div className="setup-step-number">4</div>
            <div className="setup-step-content">
              <h3 className="setup-step-title">Connect Google Calendar</h3>
              <p className="setup-step-description text-sm text-muted">
                You'll be asked to authorize CalifAI to access your Google Calendar
              </p>
            </div>
          </div>
        </Card>

        <Button
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleContinue}
        >
          Continue
        </Button>

        <div className="setup-footer text-xs text-muted">
          <p>
            {provider === 'gemini'
              ? 'Gemini is completely FREE with 1 million tokens/month (~thousands of captures). '
              : 'GPT-4o-mini costs ~$0.002 per capture (500x cheaper than GPT-4o). '}
            Your API key is stored locally and never leaves your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
