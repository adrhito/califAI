import Spinner from '../ui/Spinner';
import { useAppState } from '../../hooks/useAppState';
import './LoadingView.css';

export default function LoadingView() {
  const { loading } = useAppState();

  return (
    <div className="loading-view">
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
      </div>
    </div>
  );
}
