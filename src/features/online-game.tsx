import { useEffect, useRef, useState, type ReactNode } from 'react';
import { signInAnonymously, updateProfile, type Auth, type User } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import { hide } from 'expo-splash-screen';
import { ConnectionScreen } from '@/components/connection-screen';
import { firebaseServices } from '../services/firebase';
import { CloudRepository, readHarvestPhoto, submitHarvestWithPhoto } from '../services/cloud-repository';
import { cachedPhoto, photoForUpload } from '../services/cloud-photos';
import type { Room } from './domain';
import { GameContext, type Game } from './game-context';
import { Button, Copy, Field, Message, Page, Title } from './ui';

type Session = { services: ReturnType<typeof firebaseServices>; user: User };
let signInJob: Promise<User> | undefined;
async function guestUser(auth: Auth) {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  signInJob ??= signInAnonymously(auth).then(result => result.user).finally(() => { signInJob = undefined; });
  return signInJob;
}
export function cloudError(error: unknown): string {
  const code = (error as { code?: string }).code;
  if (code?.includes('permission-denied') || code === 'storage/unauthorized') return 'Brak dostępu do tej czynności. Pokój mógł już zmienić etap lub nie należysz do jego ekipy.';
  if (code?.includes('unavailable') || code?.includes('network-request-failed')) return 'Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') return 'Logowanie gości nie jest jeszcze włączone dla tej gry.';
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/canceled') return 'Nie udało się połączyć z przechowywaniem zdjęć. Sprawdź internet i spróbuj ponownie.';
  if (code === 'storage/unknown' || code === 'storage/bucket-not-found') return 'Nie udało się wysłać zdjęcia. Sprawdź połączenie oraz konfigurację przechowywania zdjęć.';
  if (code) return 'Nie udało się wykonać operacji online. Spróbuj ponownie.';
  return error instanceof Error ? error.message : 'Wystąpił problem z połączeniem.';
}

export function OnlineGameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>();
  const [displayName, setName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const working = useRef(false);

  useEffect(() => {
    let active = true;
    hide();
    const timeout = setTimeout(() => {
      if (active) setError('Połączenie trwa zbyt długo. Sprawdź internet i spróbuj ponownie.');
    }, 20000);
    async function connect() {
      const services = firebaseServices();
      const user = await guestUser(services.auth);
      if (active) { setError(''); setSession({ services, user }); setName(user.displayName ?? ''); }
    }
    void connect().catch(e => { if (active) setError(cloudError(e)); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); };
  }, [attempt]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const { services, user } = session;
    const repo = new CloudRepository(services.db, user.uid, user.displayName ?? '');
    const stops = new Map<string, () => void>();
    const cache = new Map<string, Room>();
    const photos = new Map<string, { uri: string; release: () => void }>();
    const downloading = new Set<string>();
    let ids: string[] = [];
    let initialized = false;
    const timeout = setTimeout(() => { if (active) setError('Nie udało się wczytać pokojów. Sprawdź połączenie i ponów synchronizację.'); }, 20000);
    function publish() {
      if (!active) return;
      setRooms(ids.flatMap(id => {
        const room = cache.get(id);
        return room ? [{ ...room, harvests: room.harvests.map(h => ({ ...h, photoUri: photos.get(h.photoUri)?.uri ?? '' })) }] : [];
      }));
      if (ids.every(id => cache.has(id))) {
        clearTimeout(timeout);
        if (!initialized) { setError(''); initialized = true; }
        setLoaded(true);
      }
    }
    function fail(e: unknown) { if (active) setError(cloudError(e)); }
    const stopIds = repo.observeIds(next => {
      ids = next;
      for (const [id, stop] of stops) if (!ids.includes(id)) { stop(); stops.delete(id); cache.delete(id); }
      for (const id of ids) if (!stops.has(id)) {
        stops.set(id, repo.observeRoom(id, room => {
          cache.set(id, room);
          for (const harvest of room.harvests) {
            const path = harvest.photoUri;
            if (!downloading.has(path)) {
              downloading.add(path);
              void readHarvestPhoto(services.storage, path).then(({ bytes, type }) => {
                if (!active) return;
                photos.set(path, cachedPhoto(harvest.id, bytes, type));
                publish();
              }).catch(error => { downloading.delete(path); fail(error); });
            }
          }
          publish();
        }, fail));
      }
      publish();
    }, fail);
    return () => { active = false; clearTimeout(timeout); stopIds(); stops.forEach(stop => stop()); photos.forEach(photo => photo.release()); };
  }, [session]);

  async function operate<T,>(action: (repo: CloudRepository, session: Session) => Promise<T>): Promise<T> {
    if (!session) throw new Error('Najpierw połącz się z grą.');
    if (working.current) throw new Error('Poczekaj na zakończenie poprzedniej operacji.');
    working.current = true; setBusy(true);
    try { return await action(new CloudRepository(session.services.db, session.user.uid, displayName), session); }
    catch (e) { throw new Error(cloudError(e)); }
    finally { working.current = false; setBusy(false); }
  }
  async function setDisplayName(name: string) {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 24 || /[\u0000-\u001f]/.test(clean)) throw new Error('Nick powinien mieć od 2 do 24 znaków.');
    await operate(async (_repo, current) => { await updateProfile(current.user, { displayName: clean }); setName(clean); });
  }
  function retry() { setError(''); setLoaded(false); setSession(undefined); setAttempt(n => n + 1); }

  if (!session || !loaded) return <ConnectionScreen stage={session ? 'syncing' : 'connecting'} error={error} onRetry={retry} />;
  if (!displayName) return <Nickname onSave={setDisplayName} busy={busy} />;

  const game: Game = {
    rooms, userId: session.user.uid, displayName, mode: 'online', busy, setDisplayName,
    create: data => operate(repo => repo.create(data)),
    join: code => operate(repo => repo.join(code)),
    answer: (id, key, value) => operate(repo => repo.answer(id, key, value)),
    restart: id => operate(repo => repo.restart(id)),
    save: (id, ticket) => operate(repo => repo.confirm(id, ticket)),
    begin: id => operate(repo => repo.transition(id, 'begin')),
    start: id => operate(repo => repo.transition(id, 'start')),
    finish: id => operate(repo => repo.transition(id, 'finish')),
    review: (id, hid, decision, reason) => operate(repo => repo.review(id, hid, decision, reason)),
    addHarvest: (id, data, onProgress) => operate(async (repo, current) => {
      const hid = doc(collection(current.services.db, 'rooms', id, 'harvests')).id;
      const photo = await photoForUpload(data.photoUri);
      await submitHarvestWithPhoto(repo, current.services.storage, id, hid, data, photo, onProgress);
    }),
  };
  return <GameContext.Provider value={game}>
    {!!error && <><Message text={error} /><Button title="Ponów synchronizację" onPress={retry} /></>}
    {children}
  </GameContext.Provider>;
}
function Nickname({ onSave, busy }: { onSave: (name: string) => Promise<void>; busy: boolean }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  async function save() {
    try { await onSave(name); } catch (e) { setError((e as Error).message); }
  }
  return <Page><Title>Jak się nazywasz?</Title><Copy>Ten nick zobaczy Twoja ekipa. Konto gościa zapamiętamy na tym urządzeniu.</Copy>
    <Field label="Twój nick" value={name} onChangeText={setName} maxLength={24} autoCapitalize="words" editable={!busy} />
    <Message text={error} /><Button title={busy ? 'Zapisywanie…' : 'Zaczynamy'} onPress={() => { void save(); }} disabled={busy} />
  </Page>;
}
