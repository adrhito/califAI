import { useEffect } from 'react';
import { useAppState } from '../../hooks/useAppState';
import SetupView from '../../components/views/SetupView';
import HomeView from '../../components/views/HomeView';
import LoadingView from '../../components/views/LoadingView';
import EventSelectionView from '../../components/views/EventSelectionView';
import ReviewView from '../../components/views/ReviewView';
import EditView from '../../components/views/EditView';
import SuccessView from '../../components/views/SuccessView';
import ErrorView from '../../components/views/ErrorView';
import { getSettings } from '../../lib/storage/settings';

export default function App() {
  const { view, hydrate, setView } = useAppState();

  // Hydrate state from storage on mount and check if setup is needed
  useEffect(() => {
    async function init() {
      await hydrate();

      // Check if API key is configured
      const settings = await getSettings();
      if (!settings.apiKey && view === 'home') {
        setView('setup');
      }
    }

    init();
  }, []);

  // View router
  switch (view) {
    case 'home':
      return <HomeView />;

    case 'loading':
      return <LoadingView />;

    case 'review':
      return <ReviewView />;

    case 'importing':
      return <LoadingView />;

    case 'success':
      return <SuccessView />;

    case 'setup':
      return <SetupView />;

    case 'event-selection':
      return <EventSelectionView />;

    case 'edit':
      return <EditView />;

    case 'error':
      return <ErrorView />;

    default:
      return <HomeView />;
  }
}
