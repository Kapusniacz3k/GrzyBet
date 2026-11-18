import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { answeredCount, calculateResults, isReady, memberName, dateLabel, everyoneReady, useGame, type Room } from './game';
import { HarvestPanel } from './harvest-panel';
import { TicketForm } from './ticket-form';
import { PredictionReceipt } from './prediction-receipt';
import { ScoringRules } from './scoring-rules';
import { CouponRoom, CouponResults } from './coupon-board';
import { MotionPressable as Pressable } from '@/components/motion';
import { CheckIcon, ChevronIcon, HashIcon, PeopleIcon, ProfileIcon } from '@/components/grzybet-icons';
import { useAppTheme, useThemedStyles } from '@/hooks/use-app-theme';
import { Button, Card, Choices, Copy, Label, Message, Page, RoomAppearance, Title } from './ui';
import { RoomHeader } from './room-header';

export function RoomScreen() {
  return <RoomAppearance><RoomContent /></RoomAppearance>;
}

function RoomContent() {
  const s = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, userId, mode } = useGame();
  const room = rooms.find(r => r.id === id && r.joined);
  const [selection, setSelection] = useState({ roomId: '', phase: '', tab: 'Lobby' });
  if (!room) return <Page topInset={false} contentStyle={{ paddingTop: 0 }}><Title>{mode === 'online' ? 'Łączenie z pokojem…' : 'Nie znaleziono pokoju'}</Title><Button title="Wróć na start" onPress={() => router.replace('/home')} /></Page>;
  const searchesStarted = room.phase === 'collecting' || room.phase === 'finished';
  const tabs = room.phase === 'finished' ? ['Zbiory', 'Wyniki'] : room.phase === 'collecting' ? ['Zbiory'] : room.phase === 'predicting' ? ['Lobby', 'Typowanie'] : ['Lobby'];
  const defaultTab = room.phase === 'finished' ? 'Wyniki' : room.phase === 'collecting' ? 'Zbiory' : 'Lobby';
  const activeTab = selection.roomId === room.id && selection.phase === room.phase && tabs.includes(selection.tab) ? selection.tab : defaultTab;
  const setTab = (tab: string) => setSelection({ roomId: room.id, phase: room.phase, tab });
  if (room.gameMode === 'coupons' && room.phase === 'predicting') return <CouponRoom key={room.id} room={room}>
    <ParticipantReadiness room={room} />
    {room.host === userId ? <OrganizerPanel key={room.phase} room={room} /> : <Copy>Poszukiwania wystartuje organizator, gdy wszyscy zakończą stawianie.</Copy>}
  </CouponRoom>;
  if (room.phase === 'predicting' && !room.tickets[userId]) return <Page key={`${room.id}-question-${answeredCount(room, userId)}`} topInset={false} contentStyle={{ paddingTop: 0 }}>
    <RoomHeader room={room} />
    <TicketForm key={room.id} room={room} />
  </Page>;
  return <Page key={`${room.id}-${room.phase}-${activeTab}`} topInset={false} contentStyle={{ paddingTop: 0 }}>
    <RoomHeader room={room} />
    {room.phase === 'lobby' && <Card>
      <View style={s.sectionHeading}><HashIcon size={18} color={colors.textMuted} /><Label>Kod wyprawy</Label></View>
      <Text accessibilityLabel={'Kod wyprawy: ' + room.code} selectable style={s.roomCode}>{room.code}</Text>
      <Copy>{mode === 'online' ? 'Przekaż kod znajomym. Można dołączyć do rozpoczęcia gry.' : 'W wersji lokalnej kod działa tylko na tym urządzeniu.'}</Copy>
      <View style={s.cardFootnote}><Copy>{room.gameMode === 'coupons' ? 'Kupony · 10 grzybków na osobę'
        : room.scoringVersion === 2 ? 'Typowanie · 4 pytania i pewniak ×2' : 'Typowanie · 4 pytania'}</Copy></View>
    </Card>}
    {tabs.length > 1 && <Choices options={tabs} value={activeTab} onChange={setTab} />}
    {activeTab === 'Lobby' && <>
      <ParticipantReadiness room={room} />
      {room.phase === 'predicting' && <Button title="Zobacz swoje odpowiedzi" onPress={() => setTab('Typowanie')} />}
      {room.host === userId ? <OrganizerPanel key={room.phase} room={room} /> :
        <Card><Label>Czekamy na organizatora</Label><Copy>{room.phase === 'lobby'
          ? room.gameMode === 'coupons' ? 'Gdy ekipa będzie w komplecie, organizator otworzy zakłady.' : 'Gdy ekipa będzie w komplecie, organizator uruchomi pytania.'
          : 'Poszukiwania rozpocznie organizator, gdy wszyscy zatwierdzą odpowiedzi.'}</Copy></Card>}
      {mode === 'local' && <Copy>Wersja lokalna: pozostali gracze nie odpowiadają jeszcze ze swoich telefonów. Pełny przebieg możesz przetestować sam w nowym pokoju.</Copy>}
    </>}
    {room.phase === 'predicting' && activeTab === 'Typowanie' && <TicketForm key={room.id} room={room} />}
    {searchesStarted && activeTab === 'Zbiory' && <>
      <HarvestPanel key={room.id} room={room} />
      {room.phase === 'collecting' && room.host === userId && <OrganizerPanel key={room.phase} room={room} />}
    </>}
    {room.phase === 'finished' && activeTab === 'Wyniki' && (room.gameMode === 'coupons' ? <CouponResults key={room.id} room={room} /> : <ResultsPanel room={room} />)}
  </Page>;
}

function ParticipantReadiness({ room }: { room: Room }) {
  const s = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { userId } = useGame();
  const ready = room.members.filter(member => isReady(room, member)).length;
  return <Card>
    <View style={s.sectionHeading}>
      <PeopleIcon size={18} color={colors.textMuted} /><View style={s.flex}><Label>Twoja ekipa</Label></View>
      <Text style={s.smallCopy}>{room.members.length}/{room.limit}</Text>
    </View>
    {room.phase === 'predicting' && <View style={s.readiness}>
      <View style={s.between}><Text style={s.smallCopy}>Gotowi do wyjścia</Text><Text style={s.readinessValue}>{ready}/{room.members.length}</Text></View>
      <View accessibilityRole="progressbar" accessibilityLabel="Gotowość uczestników" aria-valuemin={0}
        aria-valuemax={room.members.length} aria-valuenow={ready} style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${room.members.length ? ready / room.members.length * 100 : 0}%` }]} />
      </View>
      <Copy>{everyoneReady(room) ? 'Wszyscy skończyli. Czekamy, aż organizator wystartuje poszukiwania.'
        : room.gameMode === 'coupons' ? 'Czekamy, aż każdy zakończy stawianie kuponów i oznaczy gotowość.' : 'Czekamy, aż wszyscy odpowiedzą na pytania i zatwierdzą swoje typy.'}</Copy>
    </View>}
    {room.members.map((member, index) => <View key={member} style={[s.member, index > 0 && s.memberDivider]}>
      <View style={s.avatar}><ProfileIcon size={18} color={colors.textMuted} /></View>
      <View style={s.flex}>
        <Text style={s.memberName}>{memberName(room, member)}{member === userId ? ' (Ty)' : ''}</Text>
        {member === room.host && <Text style={s.smallCopy}>Organizator</Text>}
      </View>
      {room.phase === 'predicting' && isReady(room, member) ? <View style={s.memberStatus}>
        <CheckIcon size={14} color={colors.navigationActive} /><Text style={s.readyLabel}>Gotowe</Text>
      </View> : <Text style={s.memberProgress}>{room.phase === 'lobby' ? 'W lobby'
        : room.gameMode === 'coupons' ? 'Stawia kupony' : answeredCount(room, member) + '/4 odpowiedzi'}</Text>}
    </View>)}
  </Card>;
}

function OrganizerPanel({ room }: { room: Room }) {
  const s = useThemedStyles(createStyles);
  const { begin, start, finish, busy } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const pending = room.harvests.filter(h => h.status === 'pending').length;
  if (room.phase === 'finished') return <Card><Label>Wyprawa zakończona</Label><Copy>Wyniki zapisano {dateLabel(room.finishedAt!)}. Kupony, zbiory i decyzje są już zablokowane.</Copy></Card>;
  const title = room.phase === 'lobby' ? room.gameMode === 'coupons' ? 'Otwórz zakłady' : 'Rozpocznij typowanie' : room.phase === 'predicting' ? 'Wystartuj poszukiwania' : 'Zakończ wyprawę';
  const explanation = room.phase === 'lobby'
    ? room.gameMode === 'coupons' ? 'Gdy wszyscy dołączą, otwórz zakłady. Każdy ma 10 grzybków na kilka kuponów. Po otwarciu nie można dołączać.'
      : 'Gdy wszyscy dołączą, uruchom typowanie. Każdy dostanie po jednym pytaniu. Po starcie nie można dołączać.'
    : room.phase === 'predicting'
      ? room.gameMode === 'coupons' ? 'Poszukiwania możesz uruchomić, gdy każdy zakończy stawianie kuponów i oznaczy gotowość.'
        : 'Poszukiwania możesz uruchomić, gdy każdy uczestnik zatwierdzi swoje odpowiedzi.'
      : 'Wyniki zostaną rozliczone. Dodawanie zbiorów i zmienianie decyzji będzie zablokowane.';
  const blocked = (room.phase === 'predicting' && !everyoneReady(room)) || (room.phase === 'collecting' && pending > 0);
  async function apply() {
    try {
      if (room.phase === 'lobby') await begin(room.id);
      else if (room.phase === 'predicting') await start(room.id);
      else await finish(room.id);
    } catch (e) { setError((e as Error).message); }
  }
  return <Card><View style={s.between}><Label>Panel organizatora</Label><Text style={s.smallCopy}>Tylko Ty</Text></View><Copy>{explanation}</Copy>
    {pending > 0 && room.phase === 'collecting' && <Message text={'Do sprawdzenia: ' + pending + '. Rozpatrz wszystkie zgłoszenia w zakładce Zbiory przed zakończeniem.'} />}
    {confirm ? <><Copy>Potwierdź zmianę etapu. Nie można jej cofnąć.</Copy><Button title={'Potwierdź: ' + title.toLowerCase()} disabled={blocked || busy} onPress={() => { void apply(); }} /><Button title="Anuluj" secondary onPress={() => setConfirm(false)} /></> :
      <Button title={title} secondary={room.phase === 'collecting'} disabled={blocked || busy} onPress={() => setConfirm(true)} />}
    <Message text={error} />
  </Card>;
}

function ResultsPanel({ room }: { room: Room }) {
  const s = useThemedStyles(createStyles);
  const colors = useAppTheme();
  const { userId } = useGame();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (room.phase !== 'finished') return null;
  const results = calculateResults(room);
  const own = results.find(row => row.member === userId);
  return <>
    <Card>
      <Text style={s.smallCopy}>Twoje podsumowanie</Text>
      <View style={s.stats}>
        <View style={s.stat}><Text style={s.statValue}>{own?.points ?? 0}<Text style={s.statUnit}> pkt</Text></Text><Text style={s.smallCopy}>za typowanie</Text></View>
        <View style={[s.stat, s.statDivider]}><Text style={s.statValue}>{own?.mushrooms ?? 0}<Text style={s.statUnit}> szt.</Text></Text><Text style={s.smallCopy}>Twój zbiór</Text></View>
      </View>
      <View style={s.cardFootnote}><Copy>Cała ekipa: {results.reduce((sum, row) => sum + row.mushrooms, 0)} zatwierdzonych grzybów.</Copy></View>
    </Card>
    <View style={s.sectionHeading}><View style={s.flex}><Label>Wyniki ekipy</Label></View><Text style={s.smallCopy}>Ekipa: {results.length}</Text></View>
    {results.map(row => <Card key={row.member}>
      <Pressable accessibilityRole="button" accessibilityLabel={row.member === userId ? 'Twój kupon' : `Kupon gracza ${memberName(room, row.member)}`}
        aria-expanded={expanded === row.member} onPress={() => setExpanded(current => current === row.member ? null : row.member)}
        style={s.resultRow}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}><Label>{row.place}. {memberName(room, row.member)}{row.member === userId ? ' (Ty)' : ''}</Label>
          <Copy>{row.points} pkt · {row.mushrooms} szt.</Copy></View>
        <ChevronIcon size={20} direction={expanded === row.member ? 'up' : 'down'} color={colors.textMuted} />
      </Pressable>
      {expanded === row.member && <PredictionReceipt room={room} result={row} own={row.member === userId} />}
    </Card>)}
    <ScoringRules room={room} />
  </>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  roomCode: { color: c.text, fontSize: 30, lineHeight: 40, letterSpacing: 4, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  smallCopy: { color: c.textMuted, fontSize: 11, lineHeight: 18 },
  cardFootnote: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 },
  readiness: { gap: 10, paddingBottom: 2 },
  readinessValue: { color: c.text, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: c.navigationActive },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  memberDivider: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 },
  avatar: { width: 34, height: 34, borderRadius: 11, backgroundColor: c.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  memberName: { color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  memberStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readyLabel: { color: c.navigationActive, fontSize: 11, lineHeight: 18, fontWeight: '500' },
  memberProgress: { maxWidth: '42%', color: c.textMuted, fontSize: 11, lineHeight: 18, textAlign: 'right' },
  stats: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, minWidth: 0, gap: 3 },
  statDivider: { paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: c.border },
  statValue: { color: c.text, fontSize: 30, lineHeight: 38, fontWeight: '700', letterSpacing: -0.7 },
  statUnit: { color: c.textMuted, fontSize: 13, fontWeight: '500', letterSpacing: 0 },
  resultRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
