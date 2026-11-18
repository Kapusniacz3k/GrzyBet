import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '@/constants/app-theme';
import { useThemedStyles } from '@/hooks/use-app-theme';

import { calculateResults, dateLabel, memberName, species, useGame, type Room } from './game';
import { discardPhoto, pickPhoto, type PhotoSource } from './photos';
import { Button, Card, Copy, Field, Label, Message } from './ui';
import { SpeciesPicker } from './species-picker';
import { speciesLabel } from './mushroom-species';

function Photo({ uri }: { uri: string }) {
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);
  if (!uri) return <Copy>Wczytywanie zdjęcia…</Copy>;
  if (failed) return <Copy>Nie można odczytać zdjęcia. Plik mógł zostać usunięty z urządzenia.</Copy>;
  return <Image source={{ uri }} contentFit="contain" accessibilityLabel="Zdjęcie zgłoszonego zbioru" onError={() => setFailed(true)} style={styles.photo} />;
}

export function HarvestPanel({ room }: { room: Room }) {
  const styles = useThemedStyles(createStyles);
  const { userId } = useGame();
  const approved = room.harvests.filter(item => item.status === 'approved' && item.member === userId).reduce((sum, item) => sum + item.count, 0);
  const team = room.phase === 'finished' ? calculateResults(room).sort((a, b) => b.mushrooms - a.mushrooms) : [];
  return <>
    <Card>
      <View style={styles.summary}>
        <View style={styles.summaryCopy}><Text style={styles.title}>Twój zbiór</Text><Text style={styles.meta}>Zatwierdzone przez organizatora</Text></View>
        <Text style={styles.summaryCount}>{approved}<Text style={styles.unit}> szt.</Text></Text>
      </View>
      {room.phase === 'finished' && <Text style={styles.meta}>Cała ekipa: {team.reduce((sum, row) => sum + row.mushrooms, 0)} zatwierdzonych sztuk.</Text>}
    </Card>
    {room.phase === 'finished' && <Card>
      <Label>Zbiory ekipy</Label>
      <View>{team.map((row, index) => <View key={row.member} style={[styles.teamRow, index > 0 && styles.teamDivider]}>
        <Text style={styles.teamMember}>{team.findIndex(item => item.mushrooms === row.mushrooms) + 1}. {memberName(room, row.member)}{row.member === userId ? ' (Ty)' : ''}</Text>
        <Text style={styles.harvestCount}>{row.mushrooms} szt.</Text>
      </View>)}</View>
    </Card>}
    {room.phase === 'collecting'
      ? <HarvestForm key={room.id} roomId={room.id} />
      : <Copy>{room.phase === 'finished' ? 'Wyprawa zakończona. Zgłoszenia i decyzje są dostępne tylko do odczytu.' : 'Dodawanie zbiorów będzie dostępne, gdy organizator rozpocznie zbieranie.'}</Copy>}
    <View style={styles.sectionHeading}><Text style={styles.title}>Zgłoszenia ekipy</Text><Text style={styles.sectionCount}>{room.harvests.length}</Text></View>
    {room.harvests.length === 0 && <Card>
      <Label>{room.phase === 'finished' ? 'Brak zgłoszonych zbiorów' : 'Pierwszy zbiór przed Wami'}</Label>
      <Copy>{room.phase === 'finished' ? 'W tej wyprawie nie dodano żadnych zgłoszeń.' : 'Dodane zgłoszenia pojawią się tutaj wraz ze zdjęciami i decyzją organizatora.'}</Copy>
    </Card>}
    {[...room.harvests].reverse().map(harvest => <HarvestCard key={harvest.id} room={room} harvest={harvest} />)}
  </>;
}

function HarvestForm({ roomId }: { roomId: string }) {
  const styles = useThemedStyles(createStyles);
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
    <View style={styles.formHeading}><Label>Dodaj zbiór</Label><Copy>Jeden gatunek na zgłoszenie.</Copy></View>
    <View style={styles.fieldGroup}><Copy>Gatunek</Copy><SpeciesPicker value={kind} onChange={setKind} disabled={busy} /></View>
    <Field label="Liczba sztuk" value={count} onChangeText={setCount} keyboardType="number-pad" maxLength={6} editable={!busy} placeholder="np. 12" />
    <View style={styles.photoSection}>
      <Text style={styles.title}>Zdjęcie zbioru</Text>
      {photo ? <Photo key={photo} uri={photo} /> : <View style={styles.photoEmpty}><Text style={styles.emptyTitle}>Dodaj zdjęcie</Text><Text style={styles.emptyCopy}>Pokaż cały zbiór tak, żeby można było policzyć grzyby.</Text></View>}
      <View style={styles.photoActions}>
        <View style={styles.photoAction}><Button title="Z galerii" secondary onPress={() => { void choose('library'); }} disabled={busy} /></View>
        <View style={styles.photoAction}><Button title="Zrób zdjęcie" secondary onPress={() => { void choose('camera'); }} disabled={busy} /></View>
      </View>
      <Text style={styles.meta}>Zdjęcie jest wymagane. Zmniejszymy je przed wysłaniem.</Text>
      {Platform.OS === 'web' && <Text style={styles.meta}>JPG, PNG lub WebP do 20 MB. Dostępność aparatu zależy od urządzenia.</Text>}
    </View>
    <Field label="Notatka · opcjonalnie" value={note} onChangeText={setNote} maxLength={300} multiline editable={!busy} placeholder="Do 300 znaków" />
    {activity === 'preparing' && <Message text="Przygotowywanie zdjęcia…" />}
    <Message text={message} />
    <Button title={activity === 'sending'
      ? mode === 'online' && progress < 100 ? `Wysyłanie zdjęcia… ${progress}%` : 'Zapisywanie zgłoszenia…'
      : 'Wyślij zgłoszenie'} onPress={() => { void submit(); }} disabled={busy} />
  </Card>;
}

function HarvestCard({ room, harvest }: { room: Room; harvest: Room['harvests'][number] }) {
  const styles = useThemedStyles(createStyles);
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
    <View style={styles.harvestHeading}>
      <View style={styles.summaryCopy}><Text style={styles.title}>{speciesLabel(harvest.species)}</Text><Text style={styles.meta}>{memberName(room, harvest.member)}</Text></View>
      <Text style={styles.harvestCount}>{harvest.count} szt.</Text>
    </View>
    <Photo key={harvest.photoUri} uri={harvest.photoUri} />
    <View style={styles.statusRow}><View style={styles.statusDot} /><Text style={styles.status}>{status}</Text></View>
    <Text style={styles.meta}>{dateLabel(harvest.createdAt)}</Text>
    {!!harvest.note && <Copy>{harvest.note}</Copy>}
    {!!harvest.rejectionReason && <View style={styles.reason}><Text style={styles.title}>Powód odrzucenia</Text><Copy>{harvest.rejectionReason}</Copy></View>}
    {canReview && <View style={styles.review}>
      <Text style={styles.title}>Weryfikacja organizatora</Text>
      <Button title="Zatwierdź zgłoszenie" disabled={busy} onPress={() => { void decide('approved'); }} />
      <Field label="Powód odrzucenia" value={reason} onChangeText={setReason} maxLength={300} placeholder="np. Nie widać całego zbioru" />
      <Button title="Odrzuć zgłoszenie" secondary disabled={busy} onPress={() => { void decide('rejected'); }} />
    </View>}
    <Message text={message} />
  </Card>;
}

const createStyles = (c: AppColors) => StyleSheet.create({
  title: { color: c.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  meta: { color: c.textMuted, fontSize: 12, lineHeight: 19 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  summaryCopy: { flex: 1, minWidth: 0, gap: 3 },
  summaryCount: { color: c.text, fontSize: 24, lineHeight: 31, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 46 },
  teamDivider: { borderTopWidth: 1, borderTopColor: c.border },
  teamMember: { flex: 1, minWidth: 0, color: c.text, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  unit: { color: c.textMuted, fontSize: 13, fontWeight: '400', letterSpacing: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  sectionCount: { color: c.textMuted, fontSize: 13, lineHeight: 20, fontVariant: ['tabular-nums'] },
  formHeading: { gap: 3, paddingBottom: 2 },
  fieldGroup: { gap: 8 },
  photoSection: { gap: 10, paddingTop: 4 },
  photo: { width: '100%', height: 200, backgroundColor: c.photoPlaceholder, borderRadius: 12 },
  photoEmpty: { minHeight: 114, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', borderRadius: 12,
    backgroundColor: c.surfaceInset, alignItems: 'center', justifyContent: 'center', padding: 18, gap: 6 },
  emptyTitle: { color: c.textSecondary, fontSize: 14, lineHeight: 21, fontWeight: '500', textAlign: 'center' },
  emptyCopy: { color: c.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoAction: { flex: 1, minWidth: 115 },
  harvestHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  harvestCount: { color: c.text, fontSize: 14, lineHeight: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.textMuted },
  status: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  reason: { gap: 6, borderLeftWidth: 2, borderLeftColor: c.borderStrong, paddingLeft: 12 },
  review: { gap: 12, paddingTop: 16, marginTop: 2, borderTopWidth: 1, borderTopColor: c.border },
});
