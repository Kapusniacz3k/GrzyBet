import type { Room } from '../features/domain.ts';
import { decodeRooms, encodeRooms } from '../features/storage-format.ts';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export function onlineRoomCacheKey(uid: string) {
  if (!uid || uid.length > 300 || uid.includes('/')) throw new Error('Nieprawidłowe konto zapisu.');
  return `grzybet:online-rooms:v1:${encodeURIComponent(uid)}`;
}

/** Read-only fallback, scoped to the authenticated account. Never authorizes a write. */
export function createOnlineRoomCache(storage: Storage) {
  const queues = new Map<string, Promise<unknown>>();
  function queue<T>(uid: string, job: () => Promise<T>) {
    const key = onlineRoomCacheKey(uid);
    const next = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(job);
    const tail = next.then(() => {}, () => {});
    queues.set(key, tail);
    void tail.then(() => { if (queues.get(key) === tail) queues.delete(key); });
    return next;
  }
  return {
    load(uid: string) {
      return queue(uid, async () => {
        const raw = await storage.getItem(onlineRoomCacheKey(uid));
        if (raw === null) return null;
        const envelope = JSON.parse(raw);
        if (envelope?.uid !== uid || envelope.version !== 1 || typeof envelope.rooms !== 'string') throw new Error('Nie można odczytać zapisanych wypraw tego konta.');
        return decodeRooms(envelope.rooms, { userId: uid, cloudPaths: true });
      });
    },
    save(uid: string, rooms: Room[]) {
      // Validate and capture before queueing so a later render cannot change this save.
      const encoded = encodeRooms(rooms, { userId: uid, cloudPaths: true });
      return queue(uid, async () => {
        await storage.setItem(onlineRoomCacheKey(uid), JSON.stringify({ version: 1, uid, rooms: encoded }));
      });
    },
  };
}
