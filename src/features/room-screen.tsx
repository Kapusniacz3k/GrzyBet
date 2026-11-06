import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { answeredCount, calculateResults, isReady, memberName, dateLabel, everyoneReady, statusLabel, useGame, type Room } from './game';
import { HarvestPanel } from './harvest-panel';
import { TicketForm } from './ticket-form';
import { Button, Card, Choices, Copy, Label, Message, Page, useUIStyles, Title } from './ui';

export function RoomScreen() {
  const s = useUIStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, userId, mode } = useGame();
  const room = rooms.find(r => r.id === id && r.joined);
  const [selection, setSelection] = useState({ roomId: '', phase: '', tab: 'Lobby' });
  if (!room) return <Page><Title>{mode === 'online' ? 'Łączenie z pokojem…' : 'Nie znaleziono pokoju'}</Title><Button title="Wróć na start" onPress={() => router.replace('/home')} /></Page>;
  const searchesStarted = room.phase === 'collecting' || room.phase === 'finished';
  const tabs = room.phase === 'finished' ? ['Zbiory', 'Wyniki'] : room.phase === 'collecting' ? ['Zbiory'] : ['Lobby', 'Typowanie'];
  const defaultTab = room.phase === 'finished' ? 'Wyniki' : room.phase === 'collecting' ? 'Zbiory' : 'Lobby';
  const activeTab = selection.roomId === room.id && selection.phase === room.phase && tabs.includes(selection.tab) ? selection.tab : defaultTab;
  const setTab = (tab: string) => setSelection({ roomId: room.id, phase: room.phase, tab });
  if (room.phase === 'predicting' && !room.tickets[userId]) return <Page>
    <Text style={s.badge}>TYPOWANIE ROZPOCZĘTE</Text>
    <Title>{room.name}</Title>
    <TicketForm key={room.id} room={room} />
  </Page>;
  return <Page>
    <Text style={s.badge}>{statusLabel(room).toUpperCase()}</Text>
    <Title>{room.name}</Title>
    <Copy>{dateLabel(room.date)} · Organizator: {memberName(room, room.host)}</Copy>
    <Card><Copy>KOD POKOJU</Copy><Text selectable style={s.title}>{room.code}</Text><Copy>{mode === 'online' ? 'Przekaż kod znajomym, żeby dołączyli do lobby.' : 'W wersji lokalnej kod działa tylko na tym urządzeniu.'}</Copy></Card>
    <Choices options={tabs} value={activeTab} onChange={setTab} />
    {activeTab === 'Lobby' && <>
      <ParticipantReadiness room={room} />
      {room.phase === 'predicting' && <Button title="Zobacz swoje odpowiedzi" onPress={() => setTab('Typowanie')} />}
      {room.host === userId ? <OrganizerPanel key={room.phase} room={room} /> :
        <Card><Label>Czekamy na organizatora</Label><Copy>{room.phase === 'lobby' ? 'Gdy ekipa będzie w komplecie, organizator uruchomi pytania.' : 'Poszukiwania rozpocznie organizator, gdy wszyscy zatwierdzą odpowiedzi.'}</Copy></Card>}
      {mode === 'local' && <Copy>Wersja lokalna: pozostali gracze nie odpowiadają jeszcze ze swoich telefonów. Pełny przebieg możesz przetestować sam w nowym pokoju.</Copy>}
    </>}
    {activeTab === 'Typowanie' && <TicketForm key={room.id} room={room} />}
    {searchesStarted && activeTab === 'Zbiory' && <>
      <HarvestPanel key={room.id} room={room} />
      {room.phase === 'collecting' && room.host === userId && <OrganizerPanel key={room.phase} room={room} />}
    </>}
    {room.phase === 'finished' && activeTab === 'Wyniki' && <ResultsPanel room={room} />}
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
      <Copy>{everyoneReady(room) ? 'Wszyscy skończyli. Czekamy, aż organizator wystartuje poszukiwania.' : 'Czekamy, aż wszyscy odpowiedzą na pytania i zatwierdzą swoje typy.'}</Copy>
    </Card>}
    {room.members.map(member => <View key={member} style={s.row}>
      <Label>{memberName(room, member) + (member === userId ? ' (Ty)' : '')}</Label>
      <Copy>{room.phase === 'lobby' ? 'W lobby' : isReady(room, member) ? 'Gotowe ✓' : answeredCount(room, member) + '/4 odpowiedzi'}</Copy>
    </View>)}
  </>;
}

function OrganizerPanel({ room }: { room: Room }) {
  const { begin, start, finish, busy } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const pending = room.harvests.filter(h => h.status === 'pending').length;
  if (room.phase === 'finished') return <Card><Label>Wyprawa zakończona</Label><Copy>Wyniki zapisano {dateLabel(room.finishedAt!)}. Kupony, zbiory i decyzje są już zablokowane.</Copy></Card>;
  const title = room.phase === 'lobby' ? 'Start — rozpocznij pytania' : room.phase === 'predicting' ? 'Wystartuj poszukiwania' : 'Zakończ wyprawę';
  const explanation = room.phase === 'lobby'
    ? 'Gdy wszyscy dołączą, uruchom typowanie. Każdy dostanie po jednym pytaniu. Po starcie nie można dołączać.'
    : room.phase === 'predicting'
      ? 'Poszukiwania możesz uruchomić, gdy każdy uczestnik zatwierdzi swoje odpowiedzi.'
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
  const [metric, setMetric] = useState('Zbiory');
  if (room.phase !== 'finished') return null;
  const results = calculateResults(room);
  const rows = metric === 'Zbiory' ? [...results].sort((a, b) => b.mushrooms - a.mushrooms) : results;
  return <>
    <Label>Wyniki końcowe</Label>
    <Copy>Klasyfikacja z zatwierdzonych zgłoszeń. Remisy mają wspólne miejsce.</Copy>
    <Card><Label>{results.reduce((sum, row) => sum + row.mushrooms, 0)} grzybów całej ekipy</Label><Copy>Oczekujące i odrzucone zgłoszenia nie zwiększają wyniku.</Copy></Card>
    <Choices options={['Zbiory', 'Typowanie']} value={metric} onChange={setMetric} />
    {rows.map(row => <Card key={row.member}>
        <View style={s.row}><Label>{metric === 'Zbiory' ? rows.findIndex(r => r.mushrooms === row.mushrooms) + 1 : row.place}. {memberName(room, row.member)}</Label>
          <Label>{metric === 'Zbiory' ? row.mushrooms + ' szt.' : row.points + ' pkt'}</Label></View>
        {metric === 'Typowanie' && <Copy>{room.tickets[row.member]
          ? 'Zwycięzca: ' + row.breakdown.winner + ' · Własny zbiór: ' + row.breakdown.own + ' · Ekipa: ' + row.breakdown.total + ' · Gatunek: ' + row.breakdown.species
          : 'Brak zapisanego kuponu.'}</Copy>}
      </Card>)}
    <Card><Label>Jak liczymy punkty?</Label><Copy>Zwycięzca zbiorów: 100 pkt. Własny zbiór: dokładnie 100 pkt, pomyłka do 3 szt. 70 pkt, do 5 szt. 40 pkt. Dokładny wynik ekipy: 100 pkt. Najczęstszy gatunek: 50 pkt.</Copy><Copy>Przy remisie zaliczamy każdego zwycięzcę i każdy najczęstszy gatunek. Przy zerowych zbiorach nie ma punktów za zwycięzcę i gatunek. Maksymalnie: 350 pkt.</Copy></Card>
  </>;
}
