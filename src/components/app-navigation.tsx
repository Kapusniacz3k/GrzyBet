import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router, usePathname } from 'expo-router';
import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GrzybdexIcon, MushroomIcon, ProfileIcon } from './grzybet-icons';
import { MotionPressable as Pressable } from './motion';

const BottomNavigationContext = createContext(false);
export function useHasBottomNavigation() { return useContext(BottomNavigationContext); }

export function NavigationFrame({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  const pathname = usePathname();
  const showNavigation = pathname !== '/settings';
  return <BottomNavigationContext.Provider value={showNavigation}>
    <View style={styles.screen}>
      <View style={styles.content}>{children}</View>
      {showNavigation && <BottomNavigation pathname={pathname} />}
    </View>
  </BottomNavigationContext.Provider>;
}

function BottomNavigation({ pathname }: { pathname: string }) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const startActive = ['/', '/home', '/create', '/join'].includes(pathname) || pathname.startsWith('/room/');
  const profileActive = pathname === '/profile';
  const grzybdexActive = pathname === '/grzybdex' || pathname.startsWith('/grzybdex/');
  const startColor = startActive ? colors.primary : colors.textMuted;
  const profileColor = profileActive ? colors.primary : colors.textMuted;
  const grzybdexColor = grzybdexActive ? colors.primary : colors.textMuted;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navigationArea}>
    <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Start" aria-selected={startActive}
        onPress={() => { if (pathname !== '/home') router.navigate('/home'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <ActiveMark active={startActive} />
        <MushroomIcon color={startColor} stemColor={startColor} />
        <Text style={[styles.navLabel, { color: startColor }]}>Start</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Grzybedex" aria-selected={grzybdexActive}
        onPress={() => { if (pathname !== '/grzybdex') router.dismissTo('/grzybdex'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <ActiveMark active={grzybdexActive} />
        <GrzybdexIcon color={grzybdexColor} />
        <Text style={[styles.navLabel, { color: grzybdexColor }]}>Grzybedex</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Mój profil" aria-selected={profileActive}
        onPress={() => { if (!profileActive) router.navigate('/profile'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <ActiveMark active={profileActive} />
        <ProfileIcon color={profileColor} />
        <Text style={[styles.navLabel, { color: profileColor }]}>Profil</Text>
      </Pressable>
    </View>
  </SafeAreaView>;
}

const markIn = FadeIn.duration(160).reduceMotion(ReduceMotion.System);
const markOut = FadeOut.duration(120).reduceMotion(ReduceMotion.System);
function ActiveMark({ active }: { active: boolean }) {
  const styles = useThemedStyles(createStyles);
  return active ? <Animated.View accessible={false} entering={markIn} exiting={markOut} style={styles.activeMark} /> : null;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { flex: 1 },
  navigationArea: { backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
  navigation: { width: '100%', maxWidth: 540, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingBottom: 12, paddingHorizontal: 12 },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  navLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  activeMark: { position: 'absolute', top: 0, width: 22, height: 3, borderRadius: 2, backgroundColor: c.primary },
  pressed: { opacity: 0.6 },
});
