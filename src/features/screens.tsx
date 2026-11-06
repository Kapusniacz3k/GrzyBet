import { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from './game';
import { Button, Card, Copy, Field, Label, Message, Page, Title } from './ui';

export function CreateScreen() {
  const { create, busy, mode } = useGame();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [limit, setLimit] = useState('8');
  const [error, setError] = useState('');
  async function submit() {
    const parsed = new Date(date + 'T' + time);
    if (name.trim().length < 3 || name.trim().length > 60) return setError('Nazwa powinna mieć od 3 do 60 znaków.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isFinite(parsed.getTime()) || parsed.getFullYear() !== Number(date.slice(0,4)) || parsed.getMonth() + 1 !== Number(date.slice(5,7)) || parsed.getDate() !== Number(date.slice(8,10)) || parsed.getTime() <= Date.now()) return setError('Podaj poprawną datę i godzinę w przyszłości.');
    if (!/^\d+$/.test(limit) || Number(limit) < 2 || Number(limit) > 30) return setError('Liczba uczestników musi wynosić od 2 do 30.');
    try { const id = await create({ name: name.trim(), date: parsed.toISOString(), limit: Number(limit) });
    router.replace({ pathname: '/room/[id]', params: { id } }); } catch (e) { setError((e as Error).message); }
  }
  return <Page><Title>Zbierz swoją ekipę</Title><Copy>{mode === 'online' ? 'Stwórz lobby i przekaż kod swojej ekipie.' : 'Utwórz wyprawę. W tej wersji pokój i jego kod są dostępne na tym urządzeniu.'}</Copy><Field label="Nazwa pokoju" value={name} onChangeText={setName} maxLength={60} placeholder="np. Niedziela w Gorcach" /><Field label="Data wyprawy (RRRR-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-11-08" maxLength={10} /><Field label="Godzina startu (GG:MM)" value={time} onChangeText={setTime} maxLength={5} /><Field label="Limit uczestników (2–30)" value={limit} onChangeText={setLimit} keyboardType="number-pad" maxLength={2} /><Card><Label>Zasady wyprawy</Label><Copy>Najpierw dołączacie do lobby. Organizator uruchamia cztery pytania, po jednym na ekran. Gdy wszyscy zatwierdzą odpowiedzi, organizator wystartuje poszukiwania. Rywalizujemy o punkty.</Copy></Card><Message text={error} /><Button title="Utwórz pokój" onPress={() => { void submit(); }} disabled={busy} /></Page>;
}
export function JoinScreen() {
  const { join, busy, mode } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  async function submit() { try { const id = await join(code); router.replace({ pathname: '/room/[id]', params: { id } }); } catch (e) { setError((e as Error).message); } }
  return <Page><Title>Masz kod? Wchodzisz.</Title><Copy>Wpisz sześcioznakowy kod od organizatora.</Copy><Field label="Kod pokoju" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={6} placeholder="LAS219" /><Message text={error} /><Button title="Dołącz do ekipy" onPress={() => { void submit(); }} disabled={busy} />{mode === 'local' && <Card><Label>Wypróbuj wersję demo</Label><Copy>Kod LAS219 dołącza Cię do przykładowej wyprawy w Beskidy. Kod GRZ482 otwiera pokój, do którego już należysz.</Copy></Card>}</Page>;
}

export { RoomScreen } from './room-screen';

