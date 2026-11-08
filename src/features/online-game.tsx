import { useEffect, useRef, useState, type ReactNode } from 'react';
import { onIdTokenChanged, signInAnonymously, updateProfile, type Auth, type User } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import { hide } from 'expo-splash-screen';
import { ConnectionScreen } from '@/components/connection-screen';
import { firebaseServices } from '../services/firebase';
import { CloudRepository, readHarvestPhoto, submitHarvestWithPhoto } from '../services/cloud-repository';
import { cachedPhoto, photoForUpload } from '../services/cloud-photos';
import { accountError, registerGuestAccount, removeAccount, resetAccountPassword, signInAccount, signOutAccount } from '../services/email-auth';
import type { Room } from './domain';
import { GameContext, type Game } from './game-context';
import { AccountContext, useAccount, type Account } from './account-context';
import { AccountForm } from './account-screen';
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
  const [identity, setIdentity] = useState({ isGuest: true, email: '' });
  const [accountNotice, setAccountNotice] = useState('');
  const currentUid = useRef('');
  const working = useRef(false);

  useEffect(() => {
    let active = true;
    let stopAuth: (() => void) | undefined;
    hide();
    const timeout = setTimeout(() => {
      if (active) setError('Połączenie trwa zbyt długo. Sprawdź internet i spróbuj ponownie.');
    }, 20000);
    async function connect() {
      const services = firebaseServices();
      const user = await guestUser(services.auth);
      function acceptUser(next: User) {
        if (!active) return;
        const changed = currentUid.current !== next.uid;
        if (changed) {
          currentUid.current = next.uid;
          setLoaded(false); setRooms([]);
        }
        setError('');
        setSession(current => current?.user.uid === next.uid ? current : { services, user: next });
        setName(current => next.displayName ?? (changed ? '' : current));
        setIdentity({ isGuest: next.isAnonymous, email: next.email ?? '' });
      }
      if (!active) return;
      acceptUser(user);
      stopAuth = onIdTokenChanged(services.auth, next => {
        if (!active) return;
        if (next) acceptUser(next);
        else {
          currentUid.current = '';
          setLoaded(false); setRooms([]); setSession(undefined); setName('');
          setIdentity({ isGuest: true, email: '' });
          void guestUser(services.auth).then(acceptUser).catch(e => { if (active) setError(cloudError(e)); });
        }
      }, e => { if (active) setError(cloudError(e)); });
    }
    void connect().catch(e => { if (active) setError(cloudError(e)); }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); stopAuth?.(); };
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
      if (!active || services.auth.currentUser?.uid !== user.uid) return;
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
    function fail(e: unknown) { if (active && services.auth.currentUser?.uid === user.uid) setError(cloudError(e)); }
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
                if (!active || services.auth.currentUser?.uid !== user.uid) return;
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
    if (session.services.auth.currentUser?.uid !== session.user.uid) throw new Error('Konto się zmieniło. Poczekaj na synchronizację.');
    if (working.current) throw new Error('Poczekaj na zakończenie poprzedniej operacji.');
    working.current = true; setBusy(true);
    try { return await action(new CloudRepository(session.services.db, session.user.uid, displayName), session); }
    catch (e) { throw new Error(cloudError(e)); }
    finally { working.current = false; setBusy(false); }
  }
  async function setDisplayName(name: string) {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 24 || /[\u0000-\u001f]/.test(clean)) throw new Error('Nick powinien mieć od 2 do 24 znaków.');
    await operate(async (_repo, current) => { await updateProfile(current.user, { displayName: clean }); setName(clean); setAccountNotice(''); });
  }
  function retry() { setError(''); setLoaded(false); setSession(undefined); setAttempt(n => n + 1); }

  async function accountOperation(action: (auth: Auth) => Promise<unknown>) {
    if (!session) throw new Error('Najpierw połącz się z aplikacją.');
    if (session.services.auth.currentUser?.uid !== session.user.uid) throw new Error('Konto się zmieniło. Poczekaj na synchronizację.');
    if (working.current) throw new Error('Poczekaj na zakończenie poprzedniej operacji.');
    working.current = true; setBusy(true);
    try {
      await action(session.services.auth);
    } catch (e) { throw Object.assign(new Error(accountError(e)), { code: (e as { code?: string }).code }); }
    finally {
      const user = session.services.auth.currentUser;
      if (user) {
        setIdentity({ isGuest: user.isAnonymous, email: user.email ?? '' });
        if (user.displayName) setName(user.displayName);
      }
      working.current = false; setBusy(false);
    }
  }

  if (!session || !loaded) return <ConnectionScreen stage={session ? 'syncing' : 'connecting'} error={error} onRetry={retry} />;
  const account: Account = {
    ...identity, busy, hasGuestProgress: identity.isGuest && rooms.some(room => room.joined),
    register: (email, password, confirmation) => accountOperation(auth => registerGuestAccount(auth, email, password, confirmation)),
    signIn: (email, password) => accountOperation(async auth => { await signInAccount(auth, email, password); setAccountNotice(''); }),
    resetPassword: email => accountOperation(auth => resetAccountPassword(auth, email)),
    signOut: () => accountOperation(signOutAccount),
    remove: password => accountOperation(async auth => {
      await removeAccount(auth, password);
      setAccountNotice('Konto zostało usunięte. Możesz rozpocząć grę z nowym profilem gościa lub zalogować się na inne konto.');
    }),
  };
  if (!displayName) return <AccountContext.Provider value={account}><Nickname onSave={setDisplayName} busy={busy} notice={accountNotice} /></AccountContext.Provider>;

  const game: Game = {
    rooms, userId: session.user.uid, displayName, mode: 'online', busy, setDisplayName,
    create: data => operate(repo => repo.create(data)),
    placeCoupon: (id, picks, stake) => operate(repo => repo.placeCoupon(id, picks, stake)),
    finishCoupons: id => operate(repo => repo.finishCoupons(id)),
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
  return <AccountContext.Provider value={account}><GameContext.Provider value={game}>
    {!!error && <><Message text={error} /><Button title="Ponów synchronizację" onPress={retry} /></>}
    {children}
  </GameContext.Provider></AccountContext.Provider>;
}
function Nickname({ onSave, busy, notice }: { onSave: (name: string) => Promise<void>; busy: boolean; notice: string }) {
  const account = useAccount();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  async function save() {
    try { await onSave(name); } catch (e) { setError((e as Error).message); }
  }
  if (showSignIn && account?.isGuest) return <Page><AccountForm initialMode="login" allowRegistration={false} onCancel={() => setShowSignIn(false)} /></Page>;
  return <Page><Title>Jak się nazywasz?</Title><Copy>Ten nick zobaczy Twoja ekipa. Możesz grać jako gość i później zabezpieczyć konto w profilu.</Copy>
    <Message text={notice} />
    <Field label="Twój nick" value={name} onChangeText={setName} maxLength={24} autoCapitalize="words" editable={!busy} />
    <Message text={error} /><Button title={busy ? 'Zapisywanie…' : 'Zaczynamy'} onPress={() => { void save(); }} disabled={busy} />
    {account?.isGuest && <Button title="Mam już konto — zaloguj się" secondary disabled={busy} onPress={() => setShowSignIn(true)} />}
  </Page>;
}
