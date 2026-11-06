export type ThemeMode = 'dark' | 'light';
export type StoredPreferences = { showHints: boolean; themeMode: ThemeMode };
export const defaultPreferences: StoredPreferences = { showHints: true, themeMode: 'dark' };

/** Existing v1 settings only contain showHints; keep their appearance unchanged. */
export function decodePreferences(raw: string | null): StoredPreferences {
  if (raw === null) return { ...defaultPreferences };
  const stored: unknown = JSON.parse(raw);
  if (!stored || typeof stored !== 'object' || !('showHints' in stored) || typeof stored.showHints !== 'boolean') {
    throw new Error('Nieprawidłowy zapis ustawień.');
  }
  const themeMode = 'themeMode' in stored ? stored.themeMode : 'dark';
  if (themeMode !== 'dark' && themeMode !== 'light') throw new Error('Nieprawidłowy motyw.');
  return { showHints: stored.showHints, themeMode };
}
