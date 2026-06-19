import { useEffect, useState } from 'react';
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
  const [hydrated, setHydrated] = useState(false);

  // Hydrate state from storage on mount and check if setup is needed
  useEffect(() => {
    async function init() {
      await hydrate();

      // Check if API key is configured (read the view AFTER hydration -
      // the closure value is the pre-hydration default)
      const settings = await getSettings();
      const hasApiKey = settings.geminiApiKey || settings.openaiApiKey;
      if (!hasApiKey && useAppState.getState().view === 'home') {
        setView('setup');
      }

      setHydrated(true);
    }

    init();
  }, []);

  // Don't mount any view until state is restored. Mounting HomeView with the
  // default pre-hydration state starts a second pending-capture handler that
  // races the real view's handler and replaces the user's event list
  if (!hydrated) {
    return null;
  }

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
