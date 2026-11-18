import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { useThemedStyles } from '@/hooks/use-app-theme';
import { memberName, type PredictionResult, type ResultRow, type Room } from './domain';
import { speciesLabel } from './mushroom-species';
import { predictionLabels } from './prediction-copy';

function displayValue(room: Room, result: PredictionResult, value: string | number | string[]): string {
  if (typeof value === 'number') return `${value} szt.`;
  const values = Array.isArray(value) ? value : [value];
  if (!values.length) return 'Brak zbiorów';
  return values.map(item => result.key === 'winner' ? memberName(room, item) : speciesLabel(item)).join(', ');
}

export function PredictionReceipt({ room, result, own }: { room: Room; result: ResultRow; own: boolean }) {
  const styles = useThemedStyles(createStyles);
  // The actual results are revealed only after the host finishes the trip.
  if (room.phase !== 'finished') return null;
  if (!result.predictions.length) return <Text style={styles.copy}>Brak zatwierdzonego kuponu.</Text>;
  const scoring = result.predictions.filter(prediction => prediction.points > 0).length;
  return <View style={styles.receipt}>
    <View style={styles.summary}>
      <View style={styles.summaryItem}><Text style={styles.hint}>Typy z punktami</Text><Text style={styles.summaryValue}>{scoring}<Text style={styles.copy}> / 4</Text></Text></View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}><Text style={styles.hint}>Zatwierdzony zbiór</Text><Text style={styles.summaryValue}>{result.mushrooms}<Text style={styles.copy}> szt.</Text></Text></View>
    </View>
    {result.predictions.map(prediction => <View key={prediction.key} style={styles.prediction}>
      <View style={styles.heading}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{prediction.key === 'own' && !own ? 'Zbiór gracza' : predictionLabels[prediction.key]}</Text>
          {prediction.multiplier === 2 && <Text style={styles.boost}>PEWNIAK ×2</Text>}
        </View>
        <Text style={styles.points}>{prediction.points} pkt</Text>
      </View>
      <View style={styles.valueRow}><Text style={styles.copy}>{own ? 'Twój typ' : 'Typ gracza'}</Text><Text style={styles.value}>{displayValue(room, prediction, prediction.predicted)}</Text></View>
      <View style={styles.valueRow}><Text style={styles.copy}>Wynik</Text><Text style={styles.value}>{displayValue(room, prediction, prediction.actual)}</Text></View>
      <Text style={styles.hint}>{prediction.difference !== undefined ? prediction.difference === 0 ? 'Dokładne trafienie' : `Różnica: ${prediction.difference} szt.`
        : Array.isArray(prediction.actual) && !prediction.actual.length ? 'Brak punktów przy zerowych zbiorach'
          : prediction.basePoints > 0 ? 'Trafiony typ' : 'Nietrafiony typ'}</Text>
      {prediction.multiplier === 2 && <Text style={styles.multiplier}>{prediction.basePoints} pkt × 2 = {prediction.points} pkt</Text>}
    </View>)}
    <View style={styles.total}><Text style={styles.label}>Razem za kupon</Text><Text style={styles.totalPoints}>{result.points} pkt</Text></View>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  receipt: { gap: 18 },
  summary: { flexDirection: 'row', alignItems: 'stretch', gap: 16, backgroundColor: c.surfaceInset, borderRadius: 12, padding: 14 },
  summaryItem: { flex: 1, minWidth: 0, gap: 5 },
  summaryDivider: { width: 1, backgroundColor: c.border },
  summaryValue: { color: c.text, fontSize: 18, lineHeight: 25, fontWeight: '600', fontVariant: ['tabular-nums'] },
  prediction: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 18, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  labelGroup: { flex: 1, minWidth: 0, gap: 6 },
  label: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  points: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '600', fontVariant: ['tabular-nums'] },
  boost: { color: c.textSecondary, backgroundColor: c.surfaceRaised, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, lineHeight: 15, fontWeight: '600', letterSpacing: 0.4 },
  copy: { color: c.textMuted, fontSize: 13, lineHeight: 21 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  value: { flex: 1, color: c.text, fontSize: 13, lineHeight: 21, fontWeight: '500', textAlign: 'right' },
  hint: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  multiplier: { color: c.textSecondary, fontSize: 12, lineHeight: 19, fontWeight: '500' },
  total: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 18, borderTopWidth: 1, borderTopColor: c.border },
  totalPoints: { color: c.text, fontSize: 22, lineHeight: 29, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
});
