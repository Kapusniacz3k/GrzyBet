import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { hide } from 'expo-splash-screen';
import { ConnectionScreen } from '@/components/connection-screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  joinRoom, saveTicket, answerQuestion, restartAnswers, submitHarvest, reviewHarvest, transitionRoom,
  type Room,
} from './domain';
import { decodeRooms, encodeRooms } from './storage-format';
import { Button, Copy, Message } from './ui';
import { GameContext, type Game } from './game-context';
import { OnlineGameProvider } from './online-game';
import { onlineEnabled } from '../services/firebase';
export { useGame } from './game-context';

export { species, questionKeys, answeredCount, everyoneReady, statusLabel, calculateResults, isReady, memberName } from './domain';
export type { Room, Ticket, Harvest } from './domain';
export const CURRENT_USER = 'Kuba';
const STORAGE_KEY = 'grzybet:rooms:v1';

function seedRooms(): Room[] {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(8, 0, 0, 0);
  return [
    { id: 'gorce', name: 'Grzybobranie w Gorcach', code: 'GRZ482', date: date.toISOString(), limit: 8,
      members: ['Kuba', 'Kacper', 'Mateusz', 'Bartek'], host: 'Kuba', joined: true, closed: false,
      phase: 'lobby', tickets: {}, answers: {}, harvests: [] },
    { id: 'beskidy', name: 'Sobotni wypad w Beskidy', code: 'LAS219', date: date.toISOString(), limit: 6,
      members: ['Kacper', 'Bartek'], host: 'Kacper', joined: false, closed: false,
      phase: 'lobby', tickets: {}, answers: {}, harvests: [] },
  ];
}

async function restoreRooms(): Promise<Room[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw !== null) return decodeRooms(raw);
  const initial = seedRooms();
  await AsyncStorage.setItem(STORAGE_KEY, encodeRooms(initial));
  return initial;
}
export function GameProvider({ children }: { children: ReactNode }) {
  return onlineEnabled ? <OnlineGameProvider>{children}</OnlineGameProvider> : <LocalGameProvider>{children}</LocalGameProvider>;
}
function LocalGameProvider({ children }: { children: ReactNode }) {
  const colors = useAppTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const current = useRef<Room[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const writes = useRef(Promise.resolve());
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    void restoreRooms().then(restored => {
      if (!active) return;
      current.current = restored;
      setRooms(restored);
      setLoaded(true);
    }).catch(() => {
      if (!active) return;
      setLoadError('Nie udało się odczytać zapisanych wypraw. Dane nie zostały usunięte. Spróbuj ponownie.');
    }).finally(() => { if (active) hide(); });
    return () => { active = false; };
  }, [loadAttempt]);

  function persist(next: Room[]) {
    const serialized = encodeRooms(next);
    const version = ++revision.current;
    setSaving(true);
    writes.current = writes.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
      .then(() => {
        if (version === revision.current) { setSaveError(''); setSaving(false); }
      })
      .catch(() => {
        if (version === revision.current) {
          setSaving(false);
          setSaveError('Zmiany nie zostały zapisane na urządzeniu. Nie zamykaj aplikacji i ponów zapis.');
        }
      });
  }
  function commit(next: Room[]) {
    // Validate and enqueue the snapshot before exposing it to the UI.
    // A rejected snapshot must not take ownership of an unsubmitted photo.
    persist(next);
    current.current = next;
    setRooms(next);
  }
  function change(id: string, update: (room: Room) => Room) {
    const room = current.current.find(r => r.id === id);
    if (!room) throw new Error('Nie znaleziono pokoju.');
    const updated = update(room);
    commit(current.current.map(r => r.id === id ? updated : r));
  }
  async function create(data: Pick<Room, 'name' | 'date' | 'limit'>) {
    if (data.name.trim().length < 3 || data.name.trim().length > 60 ||
        !Number.isFinite(Date.parse(data.date)) || Date.parse(data.date) <= Date.now() ||
        !Number.isInteger(data.limit) || data.limit < 2 || data.limit > 30) {
      throw new Error('Sprawdź nazwę, przyszłą datę oraz limit 2–30 uczestników.');
    }
    let code: string;
    do { code = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X'); }
    while (current.current.some(r => r.code === code));
    const id = Date.now().toString(36) + '-' + code;
    commit([...current.current, { ...data, name: data.name.trim(), id, code, members: [CURRENT_USER],
      host: CURRENT_USER, joined: true, closed: false, phase: 'lobby', tickets: {}, answers: {}, harvests: [] }]);
    return id;
  }
  async function join(code: string) {
    const room = current.current.find(r => r.code === code.trim().toUpperCase());
    if (!room) throw new Error('Nie znaleziono pokoju z takim kodem.');
    change(room.id, r => joinRoom(r, CURRENT_USER));
    return room.id;
  }
  const game: Game = {
    rooms, create, join, userId: CURRENT_USER, displayName: CURRENT_USER, mode: 'local', busy: false,
    save: async (id, ticket) => change(id, r => saveTicket(r, ticket, CURRENT_USER)),
    answer: async (id, key, value) => change(id, r => answerQuestion(r, key, value, CURRENT_USER)),
    restart: async id => change(id, r => restartAnswers(r, CURRENT_USER)),
    begin: async id => change(id, r => transitionRoom(r, 'begin', CURRENT_USER)),
    start: async id => change(id, r => transitionRoom(r, 'start', CURRENT_USER)),
    finish: async id => change(id, r => transitionRoom(r, 'finish', CURRENT_USER)),
    addHarvest: async (id, data) => change(id, r => submitHarvest(r, {
      ...data, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      member: CURRENT_USER, createdAt: new Date().toISOString(), status: 'pending',
    }, CURRENT_USER)),
    review: async (id, harvestId, decision, reason = '') =>
      change(id, r => reviewHarvest(r, harvestId, decision, reason, CURRENT_USER)),
  };
  if (!loaded) return <ConnectionScreen stage="restoring" error={loadError}
    onRetry={() => { setLoadError(''); setLoadAttempt(n => n + 1); }} />;
  return <GameContext.Provider value={game}>
    <View style={{ flex: 1 }}>
      {!!saveError && <View style={{ padding: 12, backgroundColor: colors.background, paddingTop: 36 }}>
        <Message text={saveError} /><Button title="Ponów zapis" onPress={() => persist(current.current)} />
      </View>}
      {saving && <View style={{ backgroundColor: colors.background, paddingHorizontal: 20 }}><Copy>Zapisywanie zmian…</Copy></View>}
      {children}
    </View>
  </GameContext.Provider>;
}
export function dateLabel(date: string) {
  return new Date(date).toLocaleString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}
