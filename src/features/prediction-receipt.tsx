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
    <Text style={styles.copy}>Typy z punktami: {scoring}/4 · Zatwierdzone grzyby: {result.mushrooms}</Text>
    {result.predictions.map(prediction => <View key={prediction.key} style={styles.prediction}>
      <View style={styles.heading}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{prediction.key === 'own' && !own ? 'Zbiór gracza' : predictionLabels[prediction.key]}</Text>
          {prediction.multiplier === 2 && <Text style={styles.boost}>PEWNIAK ×2</Text>}
        </View>
        <Text style={[styles.points, prediction.points > 0 && styles.earned]}>{prediction.points} pkt</Text>
      </View>
      <Text style={styles.copy}>{own ? 'Twój typ' : 'Typ gracza'}: <Text style={styles.value}>{displayValue(room, prediction, prediction.predicted)}</Text></Text>
      <Text style={styles.copy}>Wynik: <Text style={styles.value}>{displayValue(room, prediction, prediction.actual)}</Text></Text>
      <Text style={styles.hint}>{prediction.difference !== undefined ? prediction.difference === 0 ? 'Dokładne trafienie' : `Różnica: ${prediction.difference} szt.`
        : Array.isArray(prediction.actual) && !prediction.actual.length ? 'Brak punktów przy zerowych zbiorach'
          : prediction.basePoints > 0 ? 'Trafiony typ' : 'Nietrafiony typ'}</Text>
      {prediction.multiplier === 2 && <Text style={styles.multiplier}>{prediction.basePoints} pkt × 2 = {prediction.points} pkt</Text>}
    </View>)}
    <View style={styles.total}><Text style={styles.label}>Razem za kupon</Text><Text style={styles.totalPoints}>{result.points} pkt</Text></View>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  receipt: { gap: 16 },
  prediction: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  labelGroup: { flex: 1, minWidth: 0, gap: 6 },
  label: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  points: { color: c.textMuted, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  earned: { color: c.accent },
  boost: { color: c.accent, backgroundColor: c.accentSoft, alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  copy: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  value: { color: c.text, fontWeight: '600' },
  hint: { color: c.textMuted, fontSize: 12, lineHeight: 18 },
  multiplier: { color: c.accent, fontSize: 12, lineHeight: 19, fontWeight: '600' },
  total: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.border },
  totalPoints: { color: c.text, fontSize: 23, lineHeight: 30, fontWeight: '700' },
});
