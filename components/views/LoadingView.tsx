import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import { useAppState } from '../../hooks/useAppState';
import { clearCaptureSession } from '../../lib/storage/capture-session';
import './LoadingView.css';

export default function LoadingView() {
  const { loading, setLoading, goBack } = useAppState();

  async function handleCancel() {
    // Clear pending capture state first - otherwise the previous view sees
    // the processingCapture flag on remount and bounces straight back here.
    // Then return to wherever the user came from (home for initial captures,
    // review/event-selection for Capture More) with their events intact
    await clearCaptureSession();
    setLoading(null);
    goBack();
  }

  return (
    <div className="loading-view">
      <button
        className="close-button"
        onClick={handleCancel}
        title="Cancel"
        style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1, zIndex: 10 }}
      >
        ×
      </button>
      <div className="loading-content">
        <Spinner size="lg" />
        <h2 className="loading-title">
          {loading?.message || 'Processing...'}
        </h2>
        {loading?.progress !== undefined && (
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${loading.progress}%` }}
            />
          </div>
        )}
        <p className="loading-subtitle text-muted">
          This may take a few moments
        </p>
        <div className="loading-actions" style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
