import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

import { dateLabel, memberName, species, useGame, type Room } from './game';
import { discardPhoto, pickPhoto, type PhotoSource } from './photos';
import { Button, Card, Copy, Field, Label, Message } from './ui';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';

function Photo({ uri }: { uri: string }) {
  const colors = useAppTheme();
  const [failed, setFailed] = useState(false);
  if (!uri) return <Copy>Wczytywanie zdjęcia…</Copy>;
  if (failed) return <Copy>Nie można odczytać zdjęcia. Plik mógł zostać usunięty z urządzenia.</Copy>;
  return <Image source={{ uri }} contentFit="contain" accessibilityLabel="Zdjęcie zgłoszonego zbioru" onError={() => setFailed(true)} style={{ width: '100%', height: 220, backgroundColor: colors.surface, borderRadius: 6 }} />;
}

export function HarvestPanel({ room }: { room: Room }) {
  const { userId } = useGame();
  const approved = room.harvests.filter(item => item.status === 'approved' && item.member === userId).reduce((sum, item) => sum + item.count, 0);
  return <>
    <Card><Label>Twój zatwierdzony zbiór: {approved} szt.</Label><Copy>Do wyników liczą się tylko zgłoszenia zaakceptowane przez organizatora.</Copy></Card>
    {room.phase === 'collecting'
      ? <HarvestForm key={room.id} roomId={room.id} />
      : <Copy>{room.phase === 'finished' ? 'Wyprawa zakończona. Zgłoszenia i decyzje są dostępne tylko do odczytu.' : 'Dodawanie zbiorów będzie dostępne, gdy organizator rozpocznie zbieranie.'}</Copy>}
    <Label>Zgłoszenia ekipy · {room.harvests.length}</Label>
    {room.harvests.length === 0 && <Card><Copy>Nie ma jeszcze zgłoszeń. Pierwszy zbiór pojawi się tutaj wraz ze zdjęciem.</Copy></Card>}
    {[...room.harvests].reverse().map(harvest => <HarvestCard key={harvest.id} room={room} harvest={harvest} />)}
  </>;
}

function HarvestForm({ roomId }: { roomId: string }) {
  const { addHarvest, mode } = useGame();
  const [kind, setKind] = useState('');
  const [count, setCount] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [activity, setActivity] = useState<'preparing' | 'sending' | null>(null);
  const [progress, setProgress] = useState(0);
  const busy = activity !== null;
  const draftPhoto = useRef('');
  const picking = useRef(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (!submitting.current && draftPhoto.current) discardPhoto(draftPhoto.current); };
  }, []);

  async function choose(source: PhotoSource) {
    if (picking.current) return;
    picking.current = true;
    setActivity('preparing');
    setMessage('');
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      if (!mounted.current) { discardPhoto(uri); return; }
      if (draftPhoto.current) discardPhoto(draftPhoto.current);
      draftPhoto.current = uri;
      setPhoto(uri);
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Nie udało się otworzyć zdjęcia. Spróbuj ponownie.');
    } finally {
      picking.current = false;
      if (mounted.current) setActivity(null);
    }
  }

  async function submit() {
    if (picking.current) return;
    if (!species.includes(kind)) { setMessage('Wybierz gatunek grzyba.'); return; }
    if (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 999999) { setMessage('Podaj pełną liczbę sztuk od 1 do 999999.'); return; }
    if (!draftPhoto.current) { setMessage('Dodaj zdjęcie przed wysłaniem zgłoszenia.'); return; }
    picking.current = true;
    submitting.current = true;
    setActivity('sending');
    setProgress(0);
    setMessage('');
    try {
      await addHarvest(roomId, { species: kind, count: Number(count), photoUri: draftPhoto.current, note: note.trim() },
        percent => { if (mounted.current) setProgress(percent); });
      // The room now owns the photo. Draft cleanup must not delete it.
      if (mode === 'online') discardPhoto(draftPhoto.current);
      draftPhoto.current = '';
      if (mounted.current) {
        setPhoto(''); setCount(''); setNote(''); setKind('');
        setMessage('Zgłoszenie zapisane. Czeka na decyzję organizatora.');
      }
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Nie udało się zapisać zgłoszenia. Wyślij je ponownie.');
    } finally {
      picking.current = false; submitting.current = false;
      if (mounted.current) setActivity(null);
      else if (draftPhoto.current) discardPhoto(draftPhoto.current);
    }
  }

  return <Card>
    <Label>Dodaj swój zbiór</Label>
    <Copy>Gatunek</Copy><SpeciesPicker value={kind} onChange={setKind} disabled={busy} />
    <Field label="Liczba sztuk" value={count} onChangeText={setCount} keyboardType="number-pad" maxLength={6} editable={!busy} placeholder="np. 12" />
    <Field label="Notatka (opcjonalnie, do 300 znaków)" value={note} onChangeText={setNote} maxLength={300} multiline editable={!busy} />
    {photo ? <Photo key={photo} uri={photo} /> : <Copy>Zdjęcie jest wymagane. Pokaż cały zgłaszany zbiór.</Copy>}
    <Button title="Wybierz z galerii" secondary onPress={() => { void choose('library'); }} disabled={busy} />
    <Button title="Zrób zdjęcie" secondary onPress={() => { void choose('camera'); }} disabled={busy} />
    <Copy>Zdjęcie zostanie zmniejszone przed wysłaniem. Pokaż cały zbiór tak, żeby dało się policzyć grzyby.</Copy>
    {Platform.OS === 'web' && <Copy>W przeglądarce: JPG, PNG lub WebP do 20 MB. Dostępność aparatu zależy od urządzenia.</Copy>}
    {activity === 'preparing' && <Message text="Przygotowywanie zdjęcia…" />}
    <Message text={message} />
    <Button title={activity === 'sending'
      ? mode === 'online' && progress < 100 ? `Wysyłanie zdjęcia… ${progress}%` : 'Zapisywanie zgłoszenia…'
      : 'Wyślij zgłoszenie'} onPress={() => { void submit(); }} disabled={busy} />
  </Card>;
}

function HarvestCard({ room, harvest }: { room: Room; harvest: Room['harvests'][number] }) {
  const { review, userId, busy } = useGame();
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const canReview = room.host === userId && room.phase === 'collecting' && harvest.status === 'pending';
  const status = { pending: 'Oczekuje na weryfikację', approved: 'Zatwierdzone', rejected: 'Odrzucone' }[harvest.status];
  async function decide(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !reason.trim()) { setMessage('Podaj powód odrzucenia, aby uczestnik wiedział, co poprawić.'); return; }
    try { await review(room.id, harvest.id, decision, reason.trim()); setMessage('Decyzja zapisana.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Nie udało się zapisać decyzji.'); }
  }
  return <Card>
    <Label>{speciesLabel(harvest.species)} · {harvest.count} szt.</Label>
    <Copy>{memberName(room, harvest.member)} · {dateLabel(harvest.createdAt)}</Copy>
    <Photo key={harvest.photoUri} uri={harvest.photoUri} />
    <Label>{status}</Label>
    {!!harvest.note && <Copy>{harvest.note}</Copy>}
    {!!harvest.rejectionReason && <Copy>Powód: {harvest.rejectionReason}</Copy>}
    {canReview && <View style={{ gap: 12 }}>
      <Button title="Zatwierdź zgłoszenie" disabled={busy} onPress={() => { void decide('approved'); }} />
      <Field label="Powód odrzucenia" value={reason} onChangeText={setReason} maxLength={300} placeholder="np. Nie widać całego zbioru" />
      <Button title="Odrzuć zgłoszenie" secondary disabled={busy} onPress={() => { void decide('rejected'); }} />
    </View>}
    <Message text={message} />
  </Card>;
}
