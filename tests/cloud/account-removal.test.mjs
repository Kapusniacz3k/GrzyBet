import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously, signOut } = require('firebase/auth');
const { connectFirestoreEmulator, getFirestore, getDocsFromCache, getDocsFromServer, collection, query, where, disableNetwork, enableNetwork, terminate, setLogLevel } = require('firebase/firestore');
const { CloudRepository, roomCode } = require('../../src/services/cloud-repository.ts');
const { registerGuestAccount, signInAccount } = require('../../src/services/email-auth.ts');
const { assertAccountDeletionAllowed } = require('../../src/services/account-removal.ts');
const { activeTripDeletionMessage } = require('../../src/features/account-deletion.ts');

setLogLevel('silent');
const clients = [];
async function client(name) {
  const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-grzybet', authDomain: 'demo-grzybet.firebaseapp.com' }, crypto.randomUUID());
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const { user } = await signInAnonymously(auth);
  const result = { app, auth, db, user, repo: new CloudRepository(db, user.uid, name) };
  clients.push(result);
  return result;
}
after(async () => { await Promise.all(clients.map(async c => { await terminate(c.db); await deleteApp(c.app); })); });
const ownRooms = (db, uid) => query(collection(db, 'rooms'), where('memberIds', 'array-contains', uid));
const blocked = c => assert.rejects(assertAccountDeletionAllowed(c.db, c.user.uid), { message: activeTripDeletionMessage });

test('account removal blocks both roles in every active stage and allows finished history without blocking unrelated users', { timeout: 60000 }, async () => {
  const host = await client('Organizator');
  const guest = await client('Uczestnik');
  const outsider = await client('Poza wyprawą');
  await assertAccountDeletionAllowed(host.db, host.user.uid);
  const id = await host.repo.create({ name: 'Sprawdzanie usuwania kont', limit: 2, gameMode: 'coupons' });
  await guest.repo.join(await roomCode(host.db, id));

  for (const phase of ['lobby', 'predicting', 'collecting']) {
    await blocked(host);
    await blocked(guest);
    await assertAccountDeletionAllowed(outsider.db, outsider.user.uid);
    assert.equal(host.auth.currentUser.uid, host.user.uid);
    assert.equal(guest.auth.currentUser.uid, guest.user.uid);
    if (phase === 'lobby') await host.repo.transition(id, 'begin');
    if (phase === 'predicting') {
      await host.repo.finishCoupons(id);
      await guest.repo.finishCoupons(id);
      await host.repo.transition(id, 'start');
    }
  }

  await host.repo.transition(id, 'finish');
  assert.equal((await getDocsFromCache(ownRooms(guest.db, guest.user.uid))).docs[0].data().phase, 'collecting');
  await assertAccountDeletionAllowed(host.db, host.user.uid);
  await assertAccountDeletionAllowed(guest.db, guest.user.uid);
});

test('server check discovers an active trip created on another device after a cached empty result, without a room observer', { timeout: 30000 }, async () => {
  const first = await client('Pierwszy telefon');
  const email = `deletion-guard-${crypto.randomUUID()}@example.test`;
  const password = 'Bezpieczny!Las73';
  await registerGuestAccount(first.auth, email, password, password);
  const cachedQuery = ownRooms(first.db, first.user.uid);
  assert.equal((await getDocsFromServer(cachedQuery)).empty, true);

  const second = await client('Drugi telefon');
  const user = await signInAccount(second.auth, email, password);
  await new CloudRepository(second.db, user.uid, 'Drugi telefon').create({ name: 'Nowa wyprawa z drugiego telefonu', limit: 2 });
  assert.equal((await getDocsFromCache(cachedQuery)).empty, true);
  await blocked(first);
  assert.equal((await getDocsFromCache(cachedQuery)).size, 1);
});

test('offline and denied server reads cannot authorize removal even with an empty cached query', { timeout: 30000 }, async () => {
  const current = await client('Brak połączenia');
  const rooms = ownRooms(current.db, current.user.uid);
  assert.equal((await getDocsFromServer(rooms)).empty, true);
  await disableNetwork(current.db);
  try {
    assert.equal((await getDocsFromCache(rooms)).empty, true);
    await assert.rejects(assertAccountDeletionAllowed(current.db, current.user.uid), /Nie udało się sprawdzić aktywnych wypraw/);
    assert.equal(current.auth.currentUser.uid, current.user.uid);
  } finally {
    await enableNetwork(current.db);
  }
  await signOut(current.auth);
  await assert.rejects(assertAccountDeletionAllowed(current.db, current.user.uid), /Nie udało się sprawdzić aktywnych wypraw/);
  await assert.rejects(assertAccountDeletionAllowed(current.db, ''), /Najpierw zaloguj/);
});
