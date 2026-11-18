import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { CheckIcon } from '@/components/grzybet-icons';
import { MotionPressable as Pressable } from '@/components/motion';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { answeredCount, memberName, questionKeys, useGame, type Room, type Ticket } from './game';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';
import type { QuestionKey } from './domain';
import { boostScoringCopy, predictionLabels } from './prediction-copy';
import { ScoringRules } from './scoring-rules';
import { Button, Card, Choices, Copy, Field, Hint, Label, Message } from './ui';

export function TicketForm({ room }: { room: Room }) {
  const { save, restart, userId, busy } = useGame();
  const styles = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const [message, setMessage] = useState('');
  const [boost, setBoost] = useState<QuestionKey>();
  const submitted = room.tickets[userId];
  const draft = room.answers[userId] ?? {};
  const count = answeredCount(room, userId);

  if (room.phase === 'lobby') return <Card>
    <Label>Czekamy na organizatora</Label>
    <Copy>Najpierw zbieramy ekipę w lobby. Pytania pojawią się, gdy organizator wybierze „Rozpocznij typowanie”.</Copy>
  </Card>;

  if (submitted) return <>
    <Card><View style={styles.heading}><View style={styles.stateIcon}><CheckIcon size={18} color={colors.textMuted} /></View>
      <View style={styles.headingCopy}><Text style={styles.eyebrow}>4 z 4 odpowiedzi zapisane</Text><Label>Jesteś gotowy</Label></View></View>
      <Copy>{room.phase === 'predicting'
        ? 'Czekamy na pozostałych uczestników. Poszukiwania uruchomi organizator, gdy wszyscy skończą.'
        : 'Odpowiedzi zostały zatwierdzone i są zablokowane.'}</Copy>
    </Card>
    <TicketSummary room={room} ticket={submitted} />
  </>;

  if (room.phase !== 'predicting') return <Card><Copy>Nie zapisano odpowiedzi w tej wyprawie.</Copy></Card>;

  if (count < questionKeys.length) return <QuestionCard key={questionKeys[count]} room={room} index={count} />;

  async function confirm() {
    try { await save(room.id, { ...draft as Ticket, ...(room.scoringVersion === 2 && boost ? { boost } : {}) }); setMessage('Odpowiedzi zatwierdzone.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function reset() {
    try { await restart(room.id); setBoost(undefined); setMessage(''); }
    catch (e) { setMessage((e as Error).message); }
  }
  return <>
    <QuestionProgress completed={4} />
    <Label>Sprawdź swoje typy</Label>
    <Copy>Po zatwierdzeniu nie będzie można ich zmienić. Pozostali uczestnicy zobaczą, że jesteś gotowy.</Copy>
    <TicketSummary room={room} ticket={{ ...draft as Ticket, ...(room.scoringVersion === 2 && boost ? { boost } : {}) }} />
    {room.scoringVersion === 2 && <Card>
      <View style={styles.heading}><Label>Twój pewniak ×2</Label><Text style={styles.pill}>Opcjonalnie</Text></View>
      <Copy>{boostScoringCopy}</Copy>
      <View style={styles.boostChoices}>{questionKeys.map(key => <Pressable key={key} accessibilityRole="radio"
        accessibilityState={{ checked: boost === key, disabled: busy }} aria-checked={boost === key} disabled={busy}
        onPress={() => setBoost(current => current === key ? undefined : key)}
        style={({ pressed }) => [styles.boostChoice, boost === key && styles.boostSelected, (pressed || busy) && styles.dimmed]}>
        <Text style={[styles.boostLabel, boost === key && styles.boostSelectedText]}>{predictionLabels[key]}</Text>
        <Text style={[styles.boostMultiplier, boost === key && styles.boostSelectedText]}>×2</Text>
      </Pressable>)}</View>
    </Card>}
    <Message text={message} />
    <Button title="Zatwierdź i czekaj na ekipę" onPress={() => { void confirm(); }} disabled={busy} />
    <Button title="Odpowiedz ponownie" secondary onPress={() => { void reset(); }} disabled={busy} />
    <ScoringRules room={room} />
  </>;
}

function QuestionCard({ room, index }: { room: Room; index: number }) {
  const { answer, userId, busy } = useGame();
  const styles = useThemedStyles(createStyles);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const key = questionKeys[index];
  const titles = ['Kto zbierze najwięcej grzybów?', 'Ile grzybów zbierzesz Ty?', 'Ile grzybów zbierze cała ekipa?', 'Jaki gatunek będzie najczęstszy?'];
  const numeric = key === 'own' || key === 'total';
  async function next() {
    if (numeric && !/^\d+$/.test(value)) { setError('Podaj pełną, nieujemną liczbę grzybów.'); return; }
    try { await answer(room.id, key, numeric ? Number(value) : value); }
    catch (e) { setError((e as Error).message); }
  }
  return <>
    <QuestionProgress completed={index} />
    <Card>
      <Text style={styles.eyebrow}>{numeric ? 'Podaj liczbę' : 'Wybierz jedną odpowiedź'}</Text>
      <Label>{titles[index]}</Label>
      {numeric
        ? <Field label="Twoja odpowiedź · sztuki" placeholder="np. 12" value={value} onChangeText={setValue} keyboardType="number-pad" maxLength={6} editable={!busy} style={styles.numberField} />
        : key === 'species' ? <SpeciesPicker value={value} onChange={setValue} disabled={busy} />
          : <Choices options={room.members} value={value} onChange={setValue} disabled={busy} getLabel={id => memberName(room, id)} />}
      {key === 'total' && <Copy>Twój przewidywany zbiór: {room.answers[userId]?.own} szt. Wynik ekipy nie może być mniejszy.</Copy>}
      {numeric && room.scoringVersion === 2 && <Copy>Dokładnie: 100 pkt. Pomyłka o 5 sztuk: 20 pkt. {key === 'own'
        ? 'Pomyłka powyżej 5 sztuk: 0 pkt.'
        : 'Różnica 6–10 sztuk: 10 pkt, większa: 0 pkt.'}</Copy>}
      <Message text={error} />
      <Button title={index === questionKeys.length - 1 ? 'Przejdź do podsumowania' : 'Dalej'} onPress={() => { void next(); }} disabled={!value || busy} />
    </Card>
    <Hint>Każdy odpowiada we własnym tempie. Potwierdzone odpowiedzi zapisujemy, aby można było wrócić do następnego pytania.</Hint>
  </>;
}

function TicketSummary({ room, ticket }: { room: Room; ticket: Ticket }) {
  const styles = useThemedStyles(createStyles);
  const values: Record<QuestionKey, string> = {
    winner: memberName(room, ticket.winner), own: `${ticket.own} szt.`,
    total: `${ticket.total} szt.`, species: speciesLabel(ticket.species),
  };
  return <Card>
    <Label>Twoje typy</Label>
    {questionKeys.map((key, index) => <View key={key} style={[styles.summaryRow, index > 0 && styles.summaryDivider]}>
      <Text style={styles.summaryNumber}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.headingCopy}><Text style={styles.eyebrow}>{predictionLabels[key]}</Text><Text style={styles.summaryValue}>{values[key]}</Text></View>
      {ticket.boost === key && <Text accessibilityLabel="Pewniak, podwójne punkty" style={styles.boostBadge}>×2</Text>}
    </View>)}
  </Card>;
}

function QuestionProgress({ completed }: { completed: number }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.progress}>
    <View style={styles.progressHeading}><Text style={styles.progressLabel}>{completed === 4 ? 'Podsumowanie' : 'Twoje odpowiedzi'}</Text>
      <Text style={styles.eyebrow}>{completed === 4 ? '4 z 4 gotowe' : `Pytanie ${completed + 1} z 4`}</Text></View>
    <View accessibilityRole="progressbar" accessibilityLabel="Ukończone pytania" accessibilityValue={{ min: 0, max: 4, now: completed }} style={styles.progressSegments}>
      {questionKeys.map((key, index) => <View key={key} style={[styles.segment, index < completed && styles.segmentDone, index === completed && styles.segmentCurrent]} />)}
    </View>
  </View>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0, gap: 3 },
  stateIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: c.textMuted, fontSize: 11, lineHeight: 17 },
  pill: { color: c.textMuted, backgroundColor: c.surfaceRaised, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, fontSize: 10, lineHeight: 15 },
  boostChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  boostChoice: { flexGrow: 1, flexBasis: '44%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    minHeight: 48, padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.surfaceInset },
  boostSelected: { borderColor: c.actionGreen, backgroundColor: c.navigationSurface },
  boostLabel: { flex: 1, color: c.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  boostMultiplier: { color: c.textMuted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  boostSelectedText: { color: c.navigationActive },
  boostBadge: { color: c.navigationActive, backgroundColor: c.navigationSurface, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
  numberField: { backgroundColor: c.surfaceInset, fontSize: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 13 },
  summaryNumber: { color: c.textMuted, fontSize: 11, lineHeight: 17, width: 19 },
  summaryValue: { color: c.text, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  progress: { gap: 10, paddingVertical: 2 },
  progressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  progressLabel: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  progressSegments: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 3, backgroundColor: c.surfaceRaised },
  segmentDone: { backgroundColor: c.progress },
  segmentCurrent: { backgroundColor: c.navigationActive },
});
