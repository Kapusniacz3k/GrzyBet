import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { answeredCount, calculateResults, isReady, memberName, dateLabel, everyoneReady, statusLabel, useGame, type Room } from './game';
import { HarvestPanel } from './harvest-panel';
import { TicketForm } from './ticket-form';
import { PredictionReceipt } from './prediction-receipt';
import { ScoringRules } from './scoring-rules';
import { CouponRoom, CouponResults } from './coupon-board';
import { MotionPressable as Pressable } from '@/components/motion';
import { ChevronIcon } from '@/components/grzybet-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Button, Card, Choices, Copy, Label, Message, Page, useUIStyles, Title } from './ui';

export function RoomScreen() {
  const s = useUIStyles();
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
  if (room.phase === 'predicting' && !room.tickets[userId]) return <Page topInset={false} contentStyle={{ paddingTop: 0 }}>
    <Text style={s.badge}>TYPOWANIE ROZPOCZĘTE</Text>
    <TicketForm key={room.id} room={room} />
  </Page>;
  return <Page topInset={false} contentStyle={{ paddingTop: 0 }}>
    <Text style={s.badge}>{statusLabel(room).toUpperCase()}</Text>
    {room.phase !== 'predicting' && <Title>{room.name}</Title>}
    <Copy>Organizator: {memberName(room, room.host)}</Copy>
    {room.phase === 'lobby' && <Copy>Tryb: {room.gameMode === 'coupons' ? 'Kupony · 10 grzybków dla każdego' : 'Typowanie · cztery pytania'}</Copy>}
    {room.phase === 'lobby' && <Card><Copy>KOD POKOJU</Copy><Text selectable style={s.title}>{room.code}</Text><Copy>{mode === 'online' ? 'Przekaż kod znajomym, żeby dołączyli do lobby.' : 'W wersji lokalnej kod działa tylko na tym urządzeniu.'}</Copy></Card>}
    <Choices options={tabs} value={activeTab} onChange={setTab} />
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
  const s = useUIStyles();
  const { userId } = useGame();
  const ready = room.members.filter(member => isReady(room, member)).length;
  return <>
    <Label>Ekipa · {room.members.length}/{room.limit}</Label>
    {room.phase === 'predicting' && <Card>
      <Label>Gotowi: {ready} / {room.members.length}</Label>
      <Copy>{everyoneReady(room) ? 'Wszyscy skończyli. Czekamy, aż organizator wystartuje poszukiwania.'
        : room.gameMode === 'coupons' ? 'Czekamy, aż każdy zakończy stawianie kuponów i oznaczy gotowość.' : 'Czekamy, aż wszyscy odpowiedzą na pytania i zatwierdzą swoje typy.'}</Copy>
    </Card>}
    {room.members.map(member => <View key={member} style={s.row}>
      <Label>{memberName(room, member) + (member === userId ? ' (Ty)' : '')}</Label>
      <Copy>{room.phase === 'lobby' ? 'W lobby' : isReady(room, member) ? 'Gotowe ✓' : room.gameMode === 'coupons' ? 'Stawia kupony' : answeredCount(room, member) + '/4 odpowiedzi'}</Copy>
    </View>)}
  </>;
}

function OrganizerPanel({ room }: { room: Room }) {
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
  return <Card><Label>Panel organizatora</Label><Copy>{explanation}</Copy>
    {pending > 0 && room.phase === 'collecting' && <Message text={'Do sprawdzenia: ' + pending + '. Rozpatrz wszystkie zgłoszenia w zakładce Zbiory przed zakończeniem.'} />}
    {confirm ? <><Copy>Potwierdź zmianę etapu. Nie można jej cofnąć.</Copy><Button title={'Potwierdź: ' + title.toLowerCase()} disabled={blocked || busy} onPress={() => { void apply(); }} /><Button title="Anuluj" secondary onPress={() => setConfirm(false)} /></> :
      <Button title={title} secondary disabled={blocked || busy} onPress={() => setConfirm(true)} />}
    <Message text={error} />
  </Card>;
}

function ResultsPanel({ room }: { room: Room }) {
  const s = useUIStyles();
  const colors = useAppTheme();
  const { userId } = useGame();
  const [metric, setMetric] = useState('Typowanie');
  const [expanded, setExpanded] = useState<string | null>(userId);
  if (room.phase !== 'finished') return null;
  const results = calculateResults(room);
  const rows = metric === 'Zbiory' ? [...results].sort((a, b) => b.mushrooms - a.mushrooms) : results;
  return <>
    <Label>Wyniki końcowe</Label>
    <Copy>Sprawdź swój kupon i porównaj typy ekipy. Liczą się tylko zatwierdzone zbiory.</Copy>
    <Card><Label>{results.reduce((sum, row) => sum + row.mushrooms, 0)} grzybów całej ekipy</Label><Copy>Oczekujące i odrzucone zgłoszenia nie zwiększają wyniku.</Copy></Card>
    <Choices options={['Zbiory', 'Typowanie']} value={metric} onChange={setMetric} />
    {rows.map(row => <Card key={row.member}>
        {metric === 'Typowanie' ? <>
          <Pressable accessibilityRole="button" accessibilityLabel={row.member === userId ? 'Twój kupon' : `Kupon gracza ${memberName(room, row.member)}`}
            aria-expanded={expanded === row.member} onPress={() => setExpanded(current => current === row.member ? null : row.member)}
            style={[s.row, { minHeight: 48 }]}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}><Label>{row.place}. {memberName(room, row.member)}{row.member === userId ? ' (Ty)' : ''}</Label>
              <Copy>{row.points} pkt · {row.mushrooms} grzybów</Copy></View>
            <ChevronIcon size={20} direction={expanded === row.member ? 'up' : 'down'} color={colors.textMuted} />
          </Pressable>
          {expanded === row.member && <PredictionReceipt room={room} result={row} own={row.member === userId} />}
        </> : <View style={s.row}><View style={{ flex: 1 }}><Label>{rows.findIndex(r => r.mushrooms === row.mushrooms) + 1}. {memberName(room, row.member)}</Label></View>
          <Label>{row.mushrooms} szt.</Label></View>}
      </Card>)}
    <ScoringRules room={room} />
  </>;
}
