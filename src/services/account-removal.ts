import { collection, getDocsFromServer, query, where, type Firestore } from 'firebase/firestore';
import { activeTripDeletionMessage } from '../features/account-deletion';

export async function assertAccountDeletionAllowed(db: Firestore, userId: string): Promise<void> {
  if (!userId.trim()) throw new Error('Najpierw zaloguj się na konto, które chcesz usunąć.');

  // A stale or empty local cache cannot authorize removal of a trip participant.
  const rooms = await getDocsFromServer(query(collection(db, 'rooms'), where('memberIds', 'array-contains', userId)))
    .catch(() => {
      throw new Error('Nie udało się sprawdzić aktywnych wypraw. Sprawdź połączenie i spróbuj ponownie. Konto nie zostało usunięte.');
    });

  if (rooms.docs.some(room => !['finished', 'cancelled'].includes(room.data().phase))) throw new Error(activeTripDeletionMessage);
}
