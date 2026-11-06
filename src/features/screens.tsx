import { useState } from 'react';
import { router } from 'expo-router';
import { useGame } from './game';
import { Button, Card, Copy, Field, Label, Message, Page, Title } from './ui';

export function CreateScreen() {
  const { create, busy, mode } = useGame();
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('8');
  const [error, setError] = useState('');
  async function submit() {
    if (name.trim().length < 3 || name.trim().length > 60) return setError('Nazwa powinna mieć od 3 do 60 znaków.');
    if (!/^\d+$/.test(limit) || Number(limit) < 2 || Number(limit) > 30) return setError('Liczba uczestników musi wynosić od 2 do 30.');
    try { const id = await create({ name: name.trim(), limit: Number(limit) });
    router.replace({ pathname: '/room/[id]', params: { id } }); } catch (e) { setError((e as Error).message); }
  }
  return <Page>
    <Title>Zbierz swoją ekipę</Title>
    <Copy>{mode === 'online' ? 'Stwórz lobby i przekaż kod swojej ekipie.' : 'Utwórz wyprawę. W tej wersji pokój i jego kod są dostępne na tym urządzeniu.'}</Copy>
    <Field label="Nazwa pokoju" value={name} onChangeText={setName} maxLength={60} placeholder="np. Niedziela w Gorcach" />
    <Field label="Limit uczestników (2–30)" value={limit} onChangeText={setLimit} keyboardType="number-pad" maxLength={2} />
    <Copy>Data wyprawy to dzień utworzenia pokoju. Godzinę startu zapiszemy, gdy organizator rozpocznie typowanie.</Copy>
    <Card><Label>Zasady wyprawy</Label><Copy>Najpierw dołączacie do lobby. Organizator uruchamia cztery pytania, po jednym na ekran. Gdy wszyscy zatwierdzą odpowiedzi, organizator wystartuje poszukiwania. Rywalizujemy o punkty.</Copy></Card>
    <Message text={error} /><Button title="Utwórz pokój" onPress={() => { void submit(); }} disabled={busy} />
  </Page>;
}
export function JoinScreen() {
  const { join, busy, mode } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  async function submit() { try { const id = await join(code); router.replace({ pathname: '/room/[id]', params: { id } }); } catch (e) { setError((e as Error).message); } }
  return <Page><Title>Masz kod? Wchodzisz.</Title><Copy>Wpisz sześcioznakowy kod od organizatora.</Copy><Field label="Kod pokoju" value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={6} placeholder="LAS219" /><Message text={error} /><Button title="Dołącz do ekipy" onPress={() => { void submit(); }} disabled={busy} />{mode === 'local' && <Card><Label>Wypróbuj wersję demo</Label><Copy>Kod LAS219 dołącza Cię do przykładowej wyprawy w Beskidy. Kod GRZ482 otwiera pokój, do którego już należysz.</Copy></Card>}</Page>;
}

export { RoomScreen } from './room-screen';

