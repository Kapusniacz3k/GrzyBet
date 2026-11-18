import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router, usePathname } from 'expo-router';
import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GrzybdexIcon, SproutIcon, ProfileIcon } from './grzybet-icons';
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
  const startColor = startActive ? colors.navigationActive : colors.textMuted;
  const profileColor = profileActive ? colors.navigationActive : colors.textMuted;
  const grzybdexColor = grzybdexActive ? colors.navigationActive : colors.textMuted;
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navigationArea}>
    <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Start" accessibilityState={{ selected: startActive }} aria-selected={startActive}
        onPress={() => { if (pathname !== '/home') router.navigate('/home'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <View style={styles.navIcon}>
          <ActiveMark active={startActive} />
          <View pointerEvents="none" style={styles.navGlyph}><SproutIcon size={20} color={startColor} /></View>
        </View>
        <Text style={[styles.navLabel, { color: startColor }]}>Start</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Grzybedex" accessibilityState={{ selected: grzybdexActive }} aria-selected={grzybdexActive}
        onPress={() => { if (pathname !== '/grzybdex') router.dismissTo('/grzybdex'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <View style={styles.navIcon}>
          <ActiveMark active={grzybdexActive} />
          <View pointerEvents="none" style={styles.navGlyph}><GrzybdexIcon size={20} color={grzybdexColor} /></View>
        </View>
        <Text style={[styles.navLabel, { color: grzybdexColor }]}>Grzybedex</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Mój profil" accessibilityState={{ selected: profileActive }} aria-selected={profileActive}
        onPress={() => { if (!profileActive) router.navigate('/profile'); }}
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
        <View style={styles.navIcon}>
          <ActiveMark active={profileActive} />
          <View pointerEvents="none" style={styles.navGlyph}><ProfileIcon size={20} color={profileColor} /></View>
        </View>
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
  navigation: { width: '100%', maxWidth: 430, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 10, paddingBottom: 14, paddingHorizontal: 12 },
  navItem: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 0 },
  navIcon: { width: 58, height: 32, alignItems: 'center', justifyContent: 'center' },
  navGlyph: { zIndex: 1 },
  navLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
  activeMark: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 0, borderRadius: 16, backgroundColor: c.navigationSurface },
  pressed: { opacity: 0.6 },
});
