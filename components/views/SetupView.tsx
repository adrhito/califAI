import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { useAppState } from '../../hooks/useAppState';
import { sendToBackground } from '../../lib/messaging/send';
import { saveSetting } from '../../lib/storage/settings';
import './SetupView.css';

export default function SetupView() {
  const { setView } = useAppState();
  const [apiKey, setApiKey] = useState('');
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
      // Save API key
      await saveSetting('apiKey', apiKey);

      // Authorize Google
      const response = await sendToBackground({ type: 'AUTHORIZE_GOOGLE' });

      if (!response.success || !response.data.success) {
        throw new Error('Google authorization failed');
      }

      setView('home');
    } catch (err) {
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
              <h3 className="setup-step-title">Get your Gemini API key</h3>
              <p className="setup-step-description text-sm text-muted">
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="setup-link"
                >
                  Google AI Studio
                </a>
                {' '}to create a free API key
              </p>
            </div>
          </div>

          <div className="setup-step">
            <div className="setup-step-number">2</div>
            <div className="setup-step-content">
              <h3 className="setup-step-title">Enter your API key</h3>
              <Input
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                error={error}
                fullWidth
                type="password"
              />
            </div>
          </div>

          <div className="setup-step">
            <div className="setup-step-number">3</div>
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
            Your API key is stored locally and never leaves your browser.
            See our privacy policy for more details.
          </p>
        </div>
      </div>
    </div>
  );
}
