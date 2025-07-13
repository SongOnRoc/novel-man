import { useState, useEffect } from 'react';
import { UserSettings } from '@/types/settings';

const SETTINGS_KEY = 'user-settings';

const defaultSettings: UserSettings = {
  editor: {
    fontSize: 16,
    lineHeight: 1.5,
    autoSave: true,
  },
  ai: {
    defaultWritingStyle: 'neutral',
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
    }
  };

  const saveSettings = (newSettings: UserSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return { settings, loadSettings, saveSettings };
}