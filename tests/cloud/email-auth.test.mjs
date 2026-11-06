import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously, updateProfile, confirmPasswordReset } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, terminate, getDoc, doc, setLogLevel } = require('firebase/firestore');
const { getStorage, connectStorageEmulator } = require('firebase/storage');
const { registerGuestAccount, signInAccount, resetAccountPassword, signOutAccount, removeAccount, accountError } = require('../../src/services/email-auth.ts');
const { CloudRepository, roomCode, uploadHarvestPhoto } = require('../../src/services/cloud-repository.ts');
const { calculateGrzybdex } = require('../../src/features/grzybdex-stats.ts');
const { species } = require('../../src/features/mushroom-species.ts');

setLogLevel('silent');
const clients = [];
const password = 'Las!Bezpieczny47';
async function client() {
  const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-grzybet', authDomain: 'demo-grzybet.firebaseapp.com', storageBucket: 'demo-grzybet.firebasestorage.app' }, crypto.randomUUID());
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  const { user } = await signInAnonymously(auth);
  const result = { app, auth, db, storage, user };
  clients.push(result);
  return result;
}
after(async () => { await Promise.all(clients.map(async c => { await terminate(c.db); await deleteApp(c.app); })); });
function roomSnapshot(repo, id) {
  return new Promise((resolve, reject) => {
    let stop;
    const timer = setTimeout(() => { stop?.(); reject(new Error('Room did not synchronize')); }, 15000);
    stop = repo.observeRoom(id, room => {
      if (room.harvests.length === 1 && room.phase === 'finished') { clearTimeout(timer); stop(); resolve(room); }
    }, error => { clearTimeout(timer); stop?.(); reject(error); });
  });
}

test('securing a guest preserves identity, nickname, finished trips and collection on a second device', { timeout: 60000 }, async () => {
  const first = await client();
  const uid = first.user.uid;
  await updateProfile(first.user, { displayName: 'Testowy grzybiarz' });
  const repo = new CloudRepository(first.db, uid, first.user.displayName);
  const id = await repo.create({ name: 'Postęp gościa', limit: 2 });
  await repo.transition(id, 'begin');
  const ticket = { winner: uid, own: 12, total: 12, species: 'Borowik' };
  for (const [key, value] of Object.entries(ticket)) await repo.answer(id, key, value);
  await repo.confirm(id, ticket);
  await repo.transition(id, 'start');
  const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4XkAAAAASUVORK5CYII=', 'base64'));
  await uploadHarvestPhoto(first.storage, id, uid, 'secured-harvest', png, 'image/png');
  await repo.submit(id, 'secured-harvest', { species: 'Borowik', count: 12, note: '', photoUri: 'file:///test.png' });
  await repo.review(id, 'secured-harvest', 'approved');
  await repo.transition(id, 'finish');
  const before = calculateGrzybdex([await roomSnapshot(repo, id)], uid, species);
  const email = `linked-${crypto.randomUUID()}@example.test`;
  const linked = await registerGuestAccount(first.auth, ` ${email} `, password, password);
  assert.equal(linked.uid, uid);
  assert.equal(linked.isAnonymous, false);
  assert.equal(linked.displayName, 'Testowy grzybiarz');
  assert.equal(first.auth.currentUser.email, email);

  await signOutAccount(first.auth);
  assert.equal(first.auth.currentUser, null);
  const second = await client();
  assert.notEqual(second.user.uid, uid);
  await assert.rejects(getDoc(doc(second.db, 'rooms', id)), { code: 'permission-denied' });
  await signInAccount(second.auth, email, password);
  assert.equal(second.auth.currentUser.uid, uid);
  assert.equal(second.auth.currentUser.displayName, 'Testowy grzybiarz');
  const restored = await roomSnapshot(new CloudRepository(second.db, uid, second.auth.currentUser.displayName), id);
  assert.deepEqual(calculateGrzybdex([restored], uid, species), before);
  assert.equal(before.find(item => item.species === 'Borowik').total, 12);
  assert.equal(before.find(item => item.species === 'Borowik').bestTrip, 12);
  assert.equal((await getDoc(doc(second.db, 'rooms', id))).data().host, uid);
});

test('duplicate registration and a wrong password leave the guest account intact', { timeout: 30000 }, async () => {
  const owner = await client();
  const email = `collision-${crypto.randomUUID()}@example.test`;
  await registerGuestAccount(owner.auth, email, password, password);
  const guest = await client();
  const uid = guest.user.uid;
  await assert.rejects(registerGuestAccount(guest.auth, email, password, password), error => {
    assert.match(accountError(error), /e-mail jest już przypisany/);
    return true;
  });
  await assert.rejects(signInAccount(guest.auth, email, 'Niepoprawne!42'));
  assert.equal(guest.auth.currentUser.uid, uid);
  assert.equal(guest.auth.currentUser.isAnonymous, true);
  await assert.rejects(registerGuestAccount(guest.auth, email, '1234567', '1234567'), /co najmniej 8/);
  await assert.rejects(registerGuestAccount(guest.auth, email, password, 'Innehasło!42'), /takie same/);
  await assert.rejects(registerGuestAccount(guest.auth, 'bez-adresu', password, password), /poprawny adres/);
  assert.equal(guest.auth.currentUser.uid, uid);
  await assert.rejects(registerGuestAccount(owner.auth, `other-${email}`, password, password), /już zabezpieczone/);
  assert.equal(owner.auth.currentUser.email, email);
});

test('password reset restores access to the same account and keeps the requesting guest signed in', { timeout: 30000 }, async () => {
  const owner = await client();
  const email = `reset-${crypto.randomUUID()}@example.test`;
  const uid = owner.user.uid;
  await registerGuestAccount(owner.auth, email, password, password);
  const guest = await client();
  const guestUid = guest.user.uid;
  await resetAccountPassword(guest.auth, email);
  assert.equal(guest.auth.currentUser.uid, guestUid);
  const response = await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-grzybet/oobCodes');
  assert.equal(response.ok, true);
  const { oobCodes } = await response.json();
  const reset = oobCodes.find(item => item.email === email && item.requestType === 'PASSWORD_RESET');
  assert.ok(reset, 'the emulator should issue a reset email');
  const newPassword = 'Nowe!LesneHaslo73';
  await confirmPasswordReset(guest.auth, reset.oobCode, newPassword);
  await assert.rejects(signInAccount(guest.auth, email, password));
  await signInAccount(guest.auth, email, newPassword);
  assert.equal(guest.auth.currentUser.uid, uid);
});

test('deleting an account revokes its login without deleting another participant\'s shared trip', { timeout: 30000 }, async () => {
  const owner = await client();
  const email = `delete-${crypto.randomUUID()}@example.test`;
  const uid = owner.user.uid;
  await registerGuestAccount(owner.auth, email, password, password);
  const repo = new CloudRepository(owner.db, uid, 'Organizator');
  const id = await repo.create({ name: 'Wspólna historia', limit: 3 });
  const teammate = await client();
  await new CloudRepository(teammate.db, teammate.user.uid, 'Ekipa').join(await roomCode(owner.db, id));

  await removeAccount(owner.auth);
  assert.equal(owner.auth.currentUser, null);
  await assert.rejects(signInAccount(owner.auth, email, password));
  assert.equal(owner.auth.currentUser, null);
  assert.equal((await getDoc(doc(teammate.db, 'rooms', id))).exists(), true);

  const fresh = await client();
  await registerGuestAccount(fresh.auth, email, password, password);
  assert.notEqual(fresh.auth.currentUser.uid, uid);
  const oldTrip = (await getDoc(doc(teammate.db, 'rooms', id))).data();
  assert.equal(oldTrip.memberIds.includes(fresh.auth.currentUser.uid), false);
});

test('a wrong reauthentication password cannot delete or switch the account', { timeout: 30000 }, async () => {
  const owner = await client();
  const email = `reauth-${crypto.randomUUID()}@example.test`;
  const uid = owner.user.uid;
  await registerGuestAccount(owner.auth, email, password, password);
  await assert.rejects(removeAccount(owner.auth, 'BledneHaslo!91'));
  assert.equal(owner.auth.currentUser.uid, uid);
  assert.equal(owner.auth.currentUser.email, email);
  await assert.rejects(removeAccount(owner.auth, ''), /Wpisz hasło/);
  await removeAccount(owner.auth, password);
  assert.equal(owner.auth.currentUser, null);
  await assert.rejects(signInAccount(owner.auth, email, password));
});

test('deleting a guest clears its session and cannot be applied again without a user', { timeout: 30000 }, async () => {
  const guest = await client();
  await removeAccount(guest.auth);
  assert.equal(guest.auth.currentUser, null);
  await assert.rejects(removeAccount(guest.auth), /Najpierw zaloguj/);
});
