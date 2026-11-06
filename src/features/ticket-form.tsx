import { useState } from 'react';
import { answeredCount, memberName, questionKeys, useGame, type Room, type Ticket } from './game';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';
import { Button, Card, Choices, Copy, Field, Hint, Label, Message } from './ui';

export function TicketForm({ room }: { room: Room }) {
  const { save, restart, userId, busy } = useGame();
  const [message, setMessage] = useState('');
  const submitted = room.tickets[userId];
  const draft = room.answers[userId] ?? {};
  const count = answeredCount(room, userId);

  if (room.phase === 'lobby') return <Card>
    <Label>Czekamy na organizatora</Label>
    <Copy>Najpierw zbieramy ekipę w lobby. Pytania pojawią się, gdy organizator naciśnie Start.</Copy>
  </Card>;

  if (submitted) return <>
    <Card><Label>Twoje odpowiedzi są gotowe</Label>
      <Copy>{room.phase === 'predicting'
        ? 'Czekamy na pozostałych uczestników. Poszukiwania uruchomi organizator, gdy wszyscy skończą.'
        : 'Odpowiedzi zostały zatwierdzone i są zablokowane.'}</Copy>
    </Card>
    <TicketSummary room={room} ticket={submitted} />
  </>;

  if (room.phase !== 'predicting') return <Card><Copy>Nie zapisano odpowiedzi w tej wyprawie.</Copy></Card>;

  if (count < questionKeys.length) return <QuestionCard key={questionKeys[count]} room={room} index={count} />;

  async function confirm() {
    try { await save(room.id, draft as Ticket); setMessage('Odpowiedzi zatwierdzone.'); }
    catch (e) { setMessage((e as Error).message); }
  }
  async function reset() {
    try { await restart(room.id); setMessage(''); }
    catch (e) { setMessage((e as Error).message); }
  }
  return <>
    <Label>Sprawdź swoje odpowiedzi</Label>
    <Copy>Po zatwierdzeniu nie będzie można ich zmienić. Pozostali uczestnicy zobaczą, że jesteś gotowy.</Copy>
    <TicketSummary room={room} ticket={draft as Ticket} />
    <Message text={message} />
    <Button title="Zatwierdź i czekaj na ekipę" onPress={() => { void confirm(); }} disabled={busy} />
    <Button title="Odpowiedz ponownie" secondary onPress={() => { void reset(); }} disabled={busy} />
  </>;
}

function QuestionCard({ room, index }: { room: Room; index: number }) {
  const { answer, userId, busy } = useGame();
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
    <Copy>Pytanie {index + 1} z {questionKeys.length}</Copy>
    <Card>
      <Label>{titles[index]}</Label>
      {numeric
        ? <Field label="Twoja odpowiedź" placeholder="np. 12" value={value} onChangeText={setValue} keyboardType="number-pad" maxLength={6} editable={!busy} />
        : key === 'species' ? <SpeciesPicker value={value} onChange={setValue} disabled={busy} />
          : <Choices options={room.members} value={value} onChange={setValue} disabled={busy} getLabel={id => memberName(room, id)} />}
      {key === 'total' && <Copy>Twój przewidywany zbiór: {room.answers[userId]?.own} szt. Wynik ekipy nie może być mniejszy.</Copy>}
      <Message text={error} />
      <Button title={index === questionKeys.length - 1 ? 'Przejdź do podsumowania' : 'Dalej'} onPress={() => { void next(); }} disabled={!value || busy} />
    </Card>
    <Hint>Każdy odpowiada we własnym tempie. Potwierdzone odpowiedzi zapisujemy, aby można było wrócić do następnego pytania.</Hint>
  </>;
}

function TicketSummary({ room, ticket }: { room: Room; ticket: Ticket }) {
  return <Card>
    <Label>Twoje typy</Label>
    <Copy>Zwycięzca: {memberName(room, ticket.winner)}</Copy>
    <Copy>Twój zbiór: {ticket.own} szt.</Copy>
    <Copy>Zbiór ekipy: {ticket.total} szt.</Copy>
    <Copy>Najczęstszy gatunek: {speciesLabel(ticket.species)}</Copy>
  </Card>;
}
