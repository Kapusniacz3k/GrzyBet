import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { decodePreferences, defaultPreferences, type StoredPreferences, type ThemeMode } from './preferences-format';

const STORAGE_KEY = 'grzybet:preferences:v1';
type Preferences = {
  showHints: boolean;
  themeMode: ThemeMode;
  ready: boolean;
  saving: boolean;
  error: string;
  setShowHints: (value: boolean) => Promise<void>;
  setThemeMode: (value: ThemeMode) => Promise<void>;
  retry: () => void;
};
const Context = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const stored = decodePreferences(raw);
      if (active) { setSettings(stored); setReady(true); setError(''); }
    }).catch(() => {
      if (active) setError('Nie udało się odczytać ustawień. Ponów odczyt, aby je zmienić.');
    });
    return () => { active = false; };
  }, [attempt]);

  async function saveSettings(update: Partial<StoredPreferences>) {
    if (!ready || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const next = { ...settings, ...update };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
    } catch {
      setError('Nie udało się zapisać ustawienia. Spróbuj zmienić je ponownie.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return <Context.Provider value={{
    ...settings, ready, saving, error,
    setShowHints: value => saveSettings({ showHints: value }),
    setThemeMode: value => saveSettings({ themeMode: value }),
    retry: () => { setError(''); setAttempt(n => n + 1); },
  }}>{children}</Context.Provider>;
}

export function usePreferences() {
  const preferences = useContext(Context);
  if (!preferences) throw new Error('Brak PreferencesProvider');
  return preferences;
}
