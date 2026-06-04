// Hook for managing settings

import { useState, useEffect } from 'react';
import { Settings, getSettings, saveSetting } from '../lib/storage/settings';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    await saveSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return {
    settings,
    loading,
    updateSetting,
    reload: loadSettings
  };
}
