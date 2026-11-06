import { useMemo } from 'react';
import { appThemes, type AppColors } from '@/constants/app-theme';
import { usePreferences } from '@/features/preferences';

export function useAppTheme(): AppColors {
  const { themeMode } = usePreferences();
  return appThemes[themeMode];
}

export function useThemedStyles<T>(factory: (colors: AppColors) => T): T {
  const colors = useAppTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
