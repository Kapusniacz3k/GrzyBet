import type { AppColors } from '@/constants/app-theme';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MushroomIcon } from './grzybet-icons';
import { FloatingView, MotionPressable as Pressable, MotionView } from './motion';

type ConnectionStage = 'connecting' | 'syncing' | 'restoring';
const errorTitles = {
  connecting: 'Problem z połączeniem',
  syncing: 'Problem z wczytaniem wypraw',
  restoring: 'Problem z odczytem wypraw',
};

export function ConnectionScreen({ stage, error = '', onRetry }: {
  stage: ConnectionStage;
  error?: string;
  onRetry?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const failed = !!error;
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text accessibilityLabel="GrzyBet" style={styles.brand}>Grzy<Text style={styles.green}>Bet</Text></Text>
      <MotionView distance={0} style={styles.main}>
        <FloatingView active={!failed} accessible={false} importantForAccessibility="no-hide-descendants" style={styles.emblem}>
          <MushroomIcon size={112} color={colors.primary} stemColor={colors.mushroomStem} spotColor={colors.mushroomSpots} />
          {failed && <View style={styles.warning}><Text style={styles.warningText}>!</Text></View>}
        </FloatingView>
        {failed && <View style={styles.message}>
          <Text accessibilityRole="header" style={styles.title}>{errorTitles[stage]}</Text>
          <Text accessibilityRole="alert" style={styles.description}>{error}</Text>
        </View>}
        {failed ? onRetry && <Pressable accessibilityRole="button" accessibilityLabel="Spróbuj ponownie" onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Spróbuj ponownie</Text>
        </Pressable> : <View style={styles.status}>
          <ActivityIndicator accessible={false} size="small" color={colors.accent} />
          <Text accessibilityLiveRegion="polite" style={styles.statusText}>Łączenie z aplikacją…</Text>
        </View>}
      </MotionView>
    </ScrollView>
  </SafeAreaView>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  page: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: 28, paddingTop: 28, paddingBottom: 28 },
  brand: { color: c.text, fontSize: 30, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  green: { color: c.primary },
  main: { flexGrow: 1, flexShrink: 0, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 28 },
  emblem: { width: 188, height: 188, alignItems: 'center', justifyContent: 'center' },
  warning: { position: 'absolute', right: 4, bottom: 9, width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.warning, borderWidth: 4, borderColor: c.background, alignItems: 'center', justifyContent: 'center' },
  warningText: { color: c.warningText, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  message: { width: '100%', alignItems: 'center', gap: 12 },
  title: { color: c.text, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  description: { maxWidth: 320, color: c.textMuted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  status: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  statusText: { color: c.accent, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retry: { width: '100%', maxWidth: 320, minHeight: 52, borderRadius: 14, backgroundColor: c.primary,
    paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: c.onPrimary, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
