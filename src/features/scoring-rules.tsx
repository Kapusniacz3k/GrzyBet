import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { HelpCircleIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import type { Room } from './domain';
import { boostScoringCopy, numericScoringCopy, numericToleranceCopy } from './prediction-copy';
import { Card, Copy } from './ui';

export function ScoringRules({ room }: { room: Room }) {
  const [expanded, setExpanded] = useState(false);
  const colors = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}>
    <Pressable accessibilityRole="button" accessibilityLabel="Jak liczymy punkty?" aria-expanded={expanded}
      accessibilityHint="Rozwija lub zwija zasady punktacji" onPress={() => setExpanded(current => !current)}
      style={({ pressed }) => [styles.help, pressed && styles.pressed]}>
      <HelpCircleIcon color={colors.textMuted} />
      <Text style={styles.helpLabel}>Jak liczymy punkty?</Text>
    </Pressable>
    {expanded && <Card>
    {room.scoringVersion === 2 ? <>
      <Copy>Punkty za typowanie własnych zbiorów i wyniku ekipy:</Copy>
      <Copy>{numericScoringCopy}</Copy>
      <Copy>{numericToleranceCopy}</Copy>
      <Copy>{boostScoringCopy}</Copy>
      <Copy>Zwycięzca: 100 pkt. Najczęstszy gatunek: 50 pkt. Z pewniakiem możesz zdobyć do 450 pkt.</Copy>
    </> : <>
      <Copy>Zasady tej wyprawy: zwycięzca 100 pkt. Własny zbiór: dokładnie 100 pkt, pomyłka do 3 sztuk 70 pkt, do 5 sztuk 40 pkt. Dokładny wynik ekipy: 100 pkt. Najczęstszy gatunek: 50 pkt.</Copy>
      <Copy>Maksymalnie 350 pkt.</Copy>
    </>}
    <Copy>Remis zalicza każdego zwycięzcę i każdy najczęstszy gatunek. Przy zerowych zbiorach punktują tylko odpowiedzi liczbowe.</Copy>
    </Card>}
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  section: { gap: 12 },
  help: { alignSelf: 'center', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  helpLabel: { color: c.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
