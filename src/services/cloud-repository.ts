import {
  collection, deleteDoc, doc, getDoc, onSnapshot, onSnapshotsInSync, query, runTransaction, serverTimestamp,
  Timestamp, where, type Firestore, type Unsubscribe,
} from 'firebase/firestore';
import { deleteObject, getBytes, getMetadata, ref, uploadBytesResumable, type FirebaseStorage } from 'firebase/storage';
import type { UploadPhoto } from './photo-upload';
import {
  answerQuestion, restartAnswers, saveTicket, submitHarvest, transitionRoom, cancelRoom, leaveLobby,
  type Harvest, type Phase, type QuestionKey, type Room, type RoomCreation, type Ticket,
} from '../features/domain';
import { CURRENT_COUPON_VERSION, placeCoupon, finishCoupons, type CouponPicks, type CouponWallet } from '../features/coupons';

export type CloudRoom = {
  name: string; code: string; startsAt: Timestamp; limit: number; host: string;
  memberIds: string[]; readyIds: string[]; phase: Phase; pendingCount: number; lastHarvestId: string;
  createdAt: Timestamp; finishedAt: Timestamp | null; predictionStartedAt?: Timestamp | null;
  scoringVersion?: 2;
  gameMode?: Room['gameMode'];
  couponVersion?: 1 | 2;
};
export type CloudHarvest = Omit<Harvest, 'id' | 'photoUri' | 'createdAt'> & { photoPath: string; createdAt: Timestamp };
export function asRoom(id: string, data: CloudRoom, uid: string): Room {
  return {
    id, name: data.name, code: data.code, date: (data.createdAt ?? data.startsAt).toDate().toISOString(),
    limit: data.limit, host: data.host, members: data.memberIds, joined: data.memberIds.includes(uid),
    phase: data.phase, closed: data.phase !== 'lobby', tickets: {}, answers: {}, harvests: [],
    readyIds: data.readyIds, names: {}, progress: {},
    ...(data.scoringVersion === 2 ? { scoringVersion: 2 } : {}),
    ...(data.gameMode ? { gameMode: data.gameMode } : {}),
    ...(data.gameMode === 'coupons' ? { couponVersion: data.couponVersion, couponBook: {} } : {}),
    ...(data.finishedAt ? { finishedAt: data.finishedAt.toDate().toISOString() } : {}),
    ...(data.predictionStartedAt ? { predictionStartedAt: data.predictionStartedAt.toDate().toISOString() } : {}),
  };
}

export class CloudRepository {
  constructor(readonly db: Firestore, readonly uid: string, readonly name: string) {}
  roomRef(id: string) { return doc(this.db, 'rooms', id); }
  memberRef(id: string) { return doc(this.db, 'rooms', id, 'members', this.uid); }
  answersRef(id: string) { return doc(this.db, 'rooms', id, 'answers', this.uid); }
  ticketRef(id: string) { return doc(this.db, 'rooms', id, 'tickets', this.uid); }
  couponsRef(id: string) { return doc(this.db, 'rooms', id, 'coupons', this.uid); }

  async create(data: RoomCreation): Promise<string> {
    if (data.name.trim().length < 3 || data.name.trim().length > 60 || !Number.isInteger(data.limit) || data.limit < 2 || data.limit > 30) {
      throw new Error('Sprawdź nazwę i limit uczestników.');
    }
    if (data.gameMode !== undefined && !['classic', 'coupons'].includes(data.gameMode)) throw new Error('Wybierz tryb wyprawy.');
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomRef = doc(collection(this.db, 'rooms'));
      const code = roomRef.id.slice(0, 6).toUpperCase();
      const codeRef = doc(this.db, 'codes', code);
      const created = await runTransaction(this.db, async tx => {
        if ((await tx.get(codeRef)).exists()) return false;
        tx.set(roomRef, {
          name: data.name.trim(), code, startsAt: serverTimestamp(), limit: data.limit,
          host: this.uid, memberIds: [this.uid], readyIds: [], phase: 'lobby', pendingCount: 0,
          lastHarvestId: '', createdAt: serverTimestamp(), finishedAt: null, predictionStartedAt: null, scoringVersion: 2,
          ...(data.gameMode === 'coupons' ? { gameMode: 'coupons', couponVersion: CURRENT_COUPON_VERSION } : {}),
        });
        tx.set(codeRef, { roomId: roomRef.id });
        tx.set(doc(roomRef, 'members', this.uid), { name: this.name, progress: 0, joinedAt: serverTimestamp() });
        return true;
      });
      if (created) return roomRef.id;
    }
    throw new Error('Nie udało się utworzyć kodu. Spróbuj ponownie.');
  }

  async join(input: string): Promise<string> {
    const code = input.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error('Wpisz sześci znakowy kod pokoju.');
    return runTransaction(this.db, async tx => {
      const invitation = await tx.get(doc(this.db, 'codes', code));
      if (!invitation.exists()) throw new Error('Nie znaleziono pokoju z takim kodem.');
      const id = invitation.data().roomId as string;
      const snapshot = await tx.get(this.roomRef(id));
      if (!snapshot.exists()) throw new Error('Pokój nie jest dostępny.');
      const room = snapshot.data() as CloudRoom;
      if (room.memberIds.includes(this.uid)) return id;
      if (room.phase !== 'lobby') throw new Error('Organizator uruchomił już pytania.');
      if (room.memberIds.length >= room.limit) throw new Error('W tym pokoju nie ma wolnych miejsc.');
      tx.update(this.roomRef(id), { memberIds: [...room.memberIds, this.uid] });
      tx.set(this.memberRef(id), { name: this.name, progress: 0, joinedAt: serverTimestamp() });
      return id;
    });
  }

  async cancel(id: string): Promise<void> {
    await runTransaction(this.db, async tx => {
      const snapshot = await tx.get(this.roomRef(id));
      if (!snapshot.exists()) throw new Error('Nie znaleziono pokoju.');
      cancelRoom(asRoom(id, snapshot.data() as CloudRoom, this.uid), this.uid);
      tx.update(this.roomRef(id), { phase: 'cancelled', finishedAt: serverTimestamp() });
    });
  }

  async leave(id: string): Promise<void> {
    await runTransaction(this.db, async tx => {
      const snapshot = await tx.get(this.roomRef(id));
      if (!snapshot.exists()) throw new Error('Nie znaleziono pokoju.');
      const updated = leaveLobby(asRoom(id, snapshot.data() as CloudRoom, this.uid), this.uid);
      tx.update(this.roomRef(id), { memberIds: updated.members });
      tx.delete(this.memberRef(id));
    });
  }

  async answer(id: string, key: QuestionKey, value: string | number) {
    await runTransaction(this.db, async tx => {
      const [room, answers, ticket] = await Promise.all([tx.get(this.roomRef(id)), tx.get(this.answersRef(id)), tx.get(this.ticketRef(id))]);
      if (!room.exists()) throw new Error('Nie znaleziono pokoju.');
      const model = asRoom(id, room.data() as CloudRoom, this.uid);
      model.answers[this.uid] = answers.data()?.values ?? {};
      if (ticket.exists()) model.tickets[this.uid] = ticket.data().values;
      const updated = answerQuestion(model, key, value, this.uid);
      const values = updated.answers[this.uid];
      tx.set(this.answersRef(id), { values });
      tx.update(this.memberRef(id), { progress: Object.keys(values).length });
    });
  }

  async restart(id: string) {
    await runTransaction(this.db, async tx => {
      const [room, ticket] = await Promise.all([tx.get(this.roomRef(id)), tx.get(this.ticketRef(id))]);
      const model = asRoom(id, room.data() as CloudRoom, this.uid);
      if (ticket.exists()) model.tickets[this.uid] = ticket.data().values;
      restartAnswers(model, this.uid);
      tx.delete(this.answersRef(id));
      tx.update(this.memberRef(id), { progress: 0 });
    });
  }

  async confirm(id: string, values: Ticket) {
    await runTransaction(this.db, async tx => {
      const [room, answers, ticket] = await Promise.all([tx.get(this.roomRef(id)), tx.get(this.answersRef(id)), tx.get(this.ticketRef(id))]);
      const data = room.data() as CloudRoom;
      const model = asRoom(id, data, this.uid);
      model.answers[this.uid] = answers.data()?.values ?? {};
      if (ticket.exists()) model.tickets[this.uid] = ticket.data().values;
      saveTicket(model, values, this.uid);
      tx.set(this.ticketRef(id), { values });
      tx.update(this.roomRef(id), { readyIds: [...data.readyIds, this.uid] });
      tx.delete(this.answersRef(id));
    });
  }

  async placeCoupon(id: string, picks: CouponPicks, stake: number) {
    const couponId = doc(collection(this.db, 'rooms')).id;
    await runTransaction(this.db, async tx => {
      const [snapshot, ledger] = await Promise.all([tx.get(this.roomRef(id)), tx.get(this.couponsRef(id))]);
      if (!snapshot.exists()) throw new Error('Nie znaleziono pokoju.');
      const model = asRoom(id, snapshot.data() as CloudRoom, this.uid);
      model.couponBook = ledger.exists() ? { [this.uid]: ledger.data() as CouponWallet } : {};
      const updated = placeCoupon(model, { id: couponId, picks, stake }, this.uid);
      tx.set(this.couponsRef(id), updated.couponBook![this.uid]);
    });
  }

  async finishCoupons(id: string) {
    await runTransaction(this.db, async tx => {
      const snapshot = await tx.get(this.roomRef(id));
      if (!snapshot.exists()) throw new Error('Nie znaleziono pokoju.');
      const updated = finishCoupons(asRoom(id, snapshot.data() as CloudRoom, this.uid), this.uid);
      tx.update(this.roomRef(id), { readyIds: updated.readyIds });
    });
  }

  async transition(id: string, action: 'begin' | 'start' | 'finish') {
    await runTransaction(this.db, async tx => {
      const room = await tx.get(this.roomRef(id));
      if (!room.exists()) throw new Error('Nie znaleziono pokoju.');
      const data = room.data() as CloudRoom;
      if (action === 'finish' && data.pendingCount > 0) throw new Error('Najpierw rozpatrz wszystkie oczekujące zgłoszenia.');
      const updated = transitionRoom(asRoom(id, data, this.uid), action, this.uid);
      tx.update(this.roomRef(id), { phase: updated.phase,
        ...(action === 'begin' ? { predictionStartedAt: serverTimestamp() } : {}),
        ...(action === 'finish' ? { finishedAt: serverTimestamp() } : {}) });
    });
  }

  async submit(id: string, hid: string, data: Pick<Harvest, 'species' | 'count' | 'note' | 'photoUri'>) {
    await runTransaction(this.db, async tx => {
      const room = await tx.get(this.roomRef(id));
      if (!room.exists()) throw new Error('Nie znaleziono pokoju.');
      const state = room.data() as CloudRoom;
      submitHarvest(asRoom(id, state, this.uid), {
        ...data, id: hid, member: this.uid, createdAt: new Date().toISOString(), status: 'pending',
      }, this.uid);
      tx.set(doc(this.roomRef(id), 'harvests', hid), {
        member: this.uid, species: data.species, count: data.count, note: data.note.trim(),
        photoPath: 'rooms/' + id + '/' + this.uid + '/' + hid,
        createdAt: serverTimestamp(), status: 'pending', rejectionReason: '',
      });
      tx.update(this.roomRef(id), { pendingCount: state.pendingCount + 1, lastHarvestId: hid });
    });
  }

  async review(id: string, hid: string, decision: 'approved' | 'rejected', reason = '') {
    if (decision === 'rejected' && !reason.trim()) throw new Error('Podaj powód odrzucenia.');
    if (reason.length > 300) throw new Error('Powód może mieć maksymalnie 300 znaków.');
    await runTransaction(this.db, async tx => {
      const target = doc(this.roomRef(id), 'harvests', hid);
      const [room, harvest] = await Promise.all([tx.get(this.roomRef(id)), tx.get(target)]);
      const data = room.data() as CloudRoom;
      if (data.host !== this.uid || data.phase !== 'collecting') throw new Error('Ta czynność jest dostępna dla organizatora podczas poszukiwań.');
      if (!harvest.exists() || harvest.data().status !== 'pending') throw new Error('To zgłoszenie zostało już rozpatrzone.');
      tx.update(target, { status: decision, rejectionReason: decision === 'rejected' ? reason.trim() : '' });
      tx.update(this.roomRef(id), { pendingCount: data.pendingCount - 1, lastHarvestId: hid });
    });
  }

  observeIds(next: (ids: string[]) => void, error: (e: Error) => void, connection?: (online: boolean) => void): Unsubscribe {
    return onSnapshot(query(collection(this.db, 'rooms'), where('memberIds', 'array-contains', this.uid)), { includeMetadataChanges: true },
      snapshot => {
        // Local pending writes do not mean the transport disconnected. Treating them as
        // offline would invalidate unrelated rooms which receive no new snapshot.
        connection?.(!snapshot.metadata.fromCache);
        if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) next(snapshot.docs.map(item => item.id));
      }, error);
  }

  observeRoom(id: string, next: (room: Room) => void, error: (e: Error) => void): Unsubscribe {
    let publicRoom: CloudRoom | undefined;
    let publicRoomReady = false;
    let names: Record<string, string> = {};
    let progress: Record<string, number> = {};
    let answers: Partial<Ticket> = {};
    let tickets: Record<string, Ticket> = {};
    let harvests: Harvest[] = [];
    let couponBook: Record<string, CouponWallet> = {};
    let ownCouponsReady = false;
    let allCouponsReady = false;
    let ownCoupons: Unsubscribe | undefined;
    let allCoupons: Unsubscribe | undefined;
    let ownAnswersReady = false;
    let ownTicketReady = false;
    let membersReady = false;
    let harvestsReady = false;
    let allTicketsReady = false;
    let allTickets: Unsubscribe | undefined;
    let dirty = false;
    function emit() { dirty = true; }
    function publish() {
      if (!dirty || !publicRoomReady || !publicRoom || !ownAnswersReady || !ownTicketReady || !membersReady || !harvestsReady) return;
      if (!publicRoom.memberIds.every(member => !!names[member])) return;
      const coupons = publicRoom.gameMode === 'coupons';
      if (coupons && (!ownCouponsReady || (publicRoom.phase === 'finished' && !allCouponsReady))) return;
      if (!coupons && ['collecting', 'finished', 'cancelled'].includes(publicRoom.phase) && !allTicketsReady) return;
      if (!coupons && ['collecting', 'finished'].includes(publicRoom.phase) && publicRoom.readyIds.some(member => !tickets[member])) return;
      if (publicRoom.pendingCount !== harvests.filter(item => item.status === 'pending').length) return;
      if (publicRoom.lastHarvestId && !harvests.some(item => item.id === publicRoom!.lastHarvestId)) return;
      if (!coupons && publicRoom.readyIds.includes(self.uid) && !tickets[self.uid]) return;
      if (!coupons && !tickets[self.uid] && (progress[self.uid] ?? 0) > Object.keys(answers).length) return;
      dirty = false;
      next({ ...asRoom(id, publicRoom, self.uid), names, progress, answers: { [self.uid]: answers }, tickets,
        ...(tickets[self.uid] ? { ticket: tickets[self.uid] } : {}), ...(coupons ? { couponBook } : {}), harvests });
    }
    const self = this;
    const stops = [
      onSnapshot(this.roomRef(id), { includeMetadataChanges: true }, snapshot => {
        publicRoomReady = (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites);
        if (!publicRoomReady) return;
        if (!snapshot.exists()) return;
        publicRoom = snapshot.data() as CloudRoom;
        if (publicRoom.gameMode === 'coupons' && !ownCoupons) {
          ownCoupons = onSnapshot(this.couponsRef(id), { includeMetadataChanges: true }, data => {
            ownCouponsReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
            if (!ownCouponsReady) return;
            if (data.exists()) couponBook = { ...couponBook, [self.uid]: data.data() as CouponWallet };
            ownCouponsReady = true; emit();
          }, error);
        }
        if (publicRoom.gameMode === 'coupons' && publicRoom.phase === 'finished' && !allCoupons) {
          allCoupons = onSnapshot(collection(this.roomRef(id), 'coupons'), { includeMetadataChanges: true }, data => {
            allCouponsReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
            if (!allCouponsReady) return;
            couponBook = Object.fromEntries(data.docs.map(item => [item.id, item.data() as CouponWallet]));
            allCouponsReady = true; emit();
          }, error);
        }
        if (publicRoom.gameMode !== 'coupons' && ['collecting', 'finished', 'cancelled'].includes(publicRoom.phase) && !allTickets) {
          allTickets = onSnapshot(collection(this.roomRef(id), 'tickets'), { includeMetadataChanges: true }, data => {
            allTicketsReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
            if (!allTicketsReady) return;
            tickets = Object.fromEntries(data.docs.map(item => [item.id, item.data().values]));
            allTicketsReady = true;
            emit();
          }, error);
        }
        emit();
      }, error),
      onSnapshot(collection(this.roomRef(id), 'members'), { includeMetadataChanges: true }, data => {
        membersReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
        if (!membersReady) return;
        names = Object.fromEntries(data.docs.map(item => [item.id, item.data().name]));
        progress = Object.fromEntries(data.docs.map(item => [item.id, item.data().progress]));
        membersReady = true;
        emit();
      }, error),
      onSnapshot(this.answersRef(id), { includeMetadataChanges: true }, data => { ownAnswersReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites); if (!ownAnswersReady) return; answers = data.data()?.values ?? {}; emit(); }, error),
      onSnapshot(this.ticketRef(id), { includeMetadataChanges: true }, data => {
        ownTicketReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
        if (!ownTicketReady) return;
        if (data.exists()) tickets = { ...tickets, [this.uid]: data.data().values };
        ownTicketReady = true; emit();
      }, error),
      onSnapshot(collection(this.roomRef(id), 'harvests'), { includeMetadataChanges: true }, data => {
        harvestsReady = (!data.metadata.fromCache && !data.metadata.hasPendingWrites);
        if (!harvestsReady) return;
        harvests = data.docs.map(item => {
          const h = item.data() as CloudHarvest;
          const { photoPath, createdAt, rejectionReason, ...values } = h;
          return { ...values, id: item.id, photoUri: photoPath, createdAt: createdAt?.toDate().toISOString() ?? new Date().toISOString(),
            ...(rejectionReason ? { rejectionReason } : {}) };
        }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        harvestsReady = true;
        emit();
      }, error),
    ];
    const stopSync = onSnapshotsInSync(this.db, publish);
    return () => { stopSync(); stops.forEach(stop => stop()); allTickets?.(); ownCoupons?.(); allCoupons?.(); };
  }
}

export async function uploadHarvestPhoto(storage: FirebaseStorage, roomId: string, uid: string, hid: string, data: UploadPhoto['data'], type: string, onProgress?: (percent: number) => void) {
  const size = data instanceof Uint8Array ? data.byteLength : data.size;
  if (!size || size > 5 * 1024 * 1024 || !type.startsWith('image/')) throw new Error('Wybierz zdjęcie o rozmiarze do 5 MB.');
  onProgress?.(0);
  const task = uploadBytesResumable(ref(storage, 'rooms/' + roomId + '/' + uid + '/' + hid), data, { contentType: type });
  const stop = task.on('state_changed', snapshot => onProgress?.(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)));
  try { await task; onProgress?.(100); }
  finally { stop(); }
}
export async function submitHarvestWithPhoto(repo: CloudRepository, storage: FirebaseStorage, roomId: string, hid: string,
  data: Pick<Harvest, 'species' | 'count' | 'note' | 'photoUri'>, photo: UploadPhoto, onProgress?: (percent: number) => void) {
  try {
    await uploadHarvestPhoto(storage, roomId, repo.uid, hid, photo.data, photo.type, onProgress);
    try { await repo.submit(roomId, hid, data); }
    catch (error) { await cleanupUnsubmittedPhoto(storage, roomId, repo.uid, hid); throw error; }
  } finally { photo.release?.(); }
}
export async function readHarvestPhoto(storage: FirebaseStorage, path: string) {
  const target = ref(storage, path);
  const [bytes, metadata] = await Promise.all([getBytes(target, 5 * 1024 * 1024), getMetadata(target)]);
  return { bytes, type: metadata.contentType ?? 'image/jpeg' };
}
export async function cleanupUnsubmittedPhoto(storage: FirebaseStorage, roomId: string, uid: string, hid: string) {
  try { await deleteObject(ref(storage, 'rooms/' + roomId + '/' + uid + '/' + hid)); } catch { /* Registered photos are protected by Storage rules. */ }
}
export async function roomCode(db: Firestore, id: string) { return (await getDoc(doc(db, 'rooms', id))).data()?.code as string; }
export { deleteDoc };
