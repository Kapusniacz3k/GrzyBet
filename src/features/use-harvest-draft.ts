import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createHarvestDraftSession, createHarvestDraftStore, type HarvestDraftScope } from '@/services/harvest-drafts';
import { discardPhoto } from './photos';
import { useGame } from './game-context';

const store = createHarvestDraftStore(AsyncStorage);

export function useHarvestDraft({ mode, userId, roomId }: HarvestDraftScope) {
  const { rooms } = useGame();
  // A submitted local photo may still be referenced by a draft if its deletion failed.
  // Preserve such files even after reopening the screen and replacing/resetting the draft.
  const [ownedPhotos] = useState(() => new Set<string>());
  useEffect(() => {
    if (mode === 'local') for (const room of rooms) for (const harvest of room.harvests) ownedPhotos.add(harvest.photoUri);
  }, [mode, rooms, ownedPhotos]);
  const session = useMemo(() => createHarvestDraftSession(store, { mode, userId, roomId }, uri => {
    if (!ownedPhotos.has(uri)) discardPhoto(uri);
  }), [mode, userId, roomId, ownedPhotos]);
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => { void session.load(); }, [session]);
  return { ...snapshot, session };
}
