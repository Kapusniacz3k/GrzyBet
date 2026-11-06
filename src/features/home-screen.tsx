import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MotionPressable as Pressable, MotionView } from '@/components/motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowIcon, HelpCircleIcon, MushroomIcon, PlusIcon, SettingsIcon } from '@/components/grzybet-icons';
import { useGame } from './game';
import { HowToPlayModal } from './how-to-play-modal';
import { usePreferences } from './preferences';

export function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { themeMode } = usePreferences();
  const { rooms } = useGame();
  const [showHelp, setShowHelp] = useState(false);
  const latest = [...rooms].reverse().find(room => room.joined && room.phase !== 'finished');
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <MotionView style={styles.header}>
      <Text accessibilityRole="header" style={styles.logo}>Grzy<Text style={styles.green}>Bet</Text></Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Ustawienia" onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.settings, pressed && styles.pressed]}>
        <SettingsIcon color={colors.text} />
      </Pressable>
    </MotionView>

    <ScrollView style={styles.content} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <MotionView delay={40} style={styles.hero}>
        <View style={[styles.mushroomFrame, themeMode === 'light' && styles.mushroomFrameLight]}>
          <MushroomIcon size={176} color={colors.primary} stemColor={colors.mushroomStem}
            spotColor={colors.mushroomSpots} stemOutline={themeMode === 'light' ? colors.accentBorder : undefined} />
        </View>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={styles.title}>Zbierz ekipę.{'\n'}Ruszajcie do lasu.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Jak to działa?" accessibilityHint="Otwiera instrukcję gry z rozwijanymi rozdziałami"
            onPress={() => setShowHelp(true)} style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
            <HelpCircleIcon color={colors.textMuted} />
            <Text style={styles.helpLabel}>Jak to działa?</Text>
          </Pressable>
        </View>
      </MotionView>

      <MotionView delay={100} style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/create')}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Text style={[styles.buttonText, styles.primaryText]}>Stwórz pokój</Text><PlusIcon color={colors.onPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/join')}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Dołącz do pokoju</Text><ArrowIcon color={colors.text} />
        </Pressable>
        {latest && <Pressable accessibilityRole="button" accessibilityLabel={'Wznów grę: ' + latest.name}
          onPress={() => router.push({ pathname: '/room/[id]', params: { id: latest.id } })}
          style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
          <View style={styles.resumeText}>
            <Text style={styles.resumeTitle}>Wznów grę</Text>
            <Text numberOfLines={1} style={styles.roomName}>{latest.name}</Text>
          </View>
          <ArrowIcon size={22} direction="up-right" color={colors.textMuted} />
        </Pressable>}
      </MotionView>
    </ScrollView>

    <HowToPlayModal visible={showHelp} onClose={() => setShowHelp(false)} />
  </SafeAreaView>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  logo: { color: c.text, fontSize: 27, fontWeight: '900', letterSpacing: -1 },
  green: { color: c.primary },
  settings: { width: 48, height: 48, borderWidth: 1, borderColor: c.border, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  content: { flex: 1 },
  page: { flexGrow: 1, width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  hero: { flexGrow: 1, flexShrink: 0, minHeight: 330, alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 28 },
  mushroomFrame: { width: 192, height: 192, alignItems: 'center', justifyContent: 'center', borderRadius: 96 },
  mushroomFrameLight: { backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentBorder },
  intro: { alignItems: 'center', gap: 12 },
  title: { color: c.text, fontSize: 32, lineHeight: 38, letterSpacing: -1.1, fontWeight: '900', textAlign: 'center' },
  help: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  helpLabel: { color: c.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  actions: { width: '100%', gap: 12 },
  primary: { minHeight: 60, backgroundColor: c.primary, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  secondary: { minHeight: 60, borderColor: c.borderStrong, borderWidth: 1, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  buttonText: { color: c.text, fontSize: 16, fontWeight: '800', flexShrink: 1 },
  primaryText: { color: c.onPrimary },
  resume: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 4, paddingTop: 8 },
  resumeText: { flex: 1, gap: 4 },
  resumeTitle: { color: c.text, fontSize: 13, fontWeight: '700' },
  roomName: { color: c.textMuted, fontSize: 12 },
});
