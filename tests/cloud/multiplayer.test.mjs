import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
const { initializeApp, deleteApp } = require('firebase/app');
const { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously } = require('firebase/auth');
const { connectFirestoreEmulator, getFirestore, getDoc, getDocs, doc, collection, query, where, updateDoc, setDoc, runTransaction, serverTimestamp, terminate, setLogLevel } = require('firebase/firestore');
const { connectStorageEmulator, getStorage, getBytes, ref, uploadBytes, deleteObject } = require('firebase/storage');
const { CloudRepository, roomCode, uploadHarvestPhoto, submitHarvestWithPhoto, readHarvestPhoto } = require('../../src/services/cloud-repository.ts');
const { calculateResults } = require('../../src/features/domain.ts');
const { species } = require('../../src/features/mushroom-species.ts');

setLogLevel('silent');
const clients = [];
const stops = new Set();
async function client(name) {
  const app = initializeApp({
    apiKey: 'demo-key', projectId: 'demo-grzybet', authDomain: 'demo-grzybet.firebaseapp.com',
    storageBucket: 'demo-grzybet.firebasestorage.app',
  }, crypto.randomUUID());
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  const { user } = await signInAnonymously(auth);
  const result = { app, auth, db, storage, user, repo: new CloudRepository(db, user.uid, name) };
  clients.push(result);
  return result;
}
after(async () => {
  stops.forEach(stop => stop());
  await Promise.all(clients.map(async c => { await terminate(c.db); await deleteApp(c.app); }));
});
const future = () => new Date(Date.now() + 86400000).toISOString();
const prediction = winner => ({ winner, own: 12, total: 12, species: 'Borowik' });
async function fill(c, id, values) {
  for (const key of ['winner','own','total','species']) await c.repo.answer(id, key, values[key]);
}
function observe(repo, id, predicate) {
  return new Promise((resolve, reject) => {
    let stop;
    const timer = setTimeout(() => { stop?.(); reject(new Error('No matching realtime snapshot')); }, 15000);
    stop = repo.observeRoom(id, room => {
      if (predicate(room)) { clearTimeout(timer); stop(); stops.delete(stop); resolve(room); }
    }, error => { clearTimeout(timer); stop?.(); reject(error); });
    stops.add(stop);
  });
}
async function denied(promise) {
  await assert.rejects(promise, error => ['permission-denied','storage/unauthorized'].includes(error.code), 'security rules must reject this write/read');
}
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4XkAAAAASUVORK5CYII=', 'base64'));

test('all twenty species can be predicted, submitted and reviewed under the cloud rules', { timeout: 120000 }, async () => {
  const host = await client('Katalog');
  const id = await host.repo.create({ name: 'Dwadzieścia gatunków', date: future(), limit: 2 });
  await host.repo.transition(id, 'begin');
  for (const name of species) {
    await fill(host, id, { winner: host.user.uid, own: 20, total: 20, species: name });
    if (name !== species.at(-1)) await host.repo.restart(id);
  }
  await host.repo.confirm(id, { winner: host.user.uid, own: 20, total: 20, species: species.at(-1) });
  await host.repo.transition(id, 'start');
  for (const [index, name] of species.entries()) {
    const hid = `species-${index}`;
    await uploadHarvestPhoto(host.storage, id, host.user.uid, hid, png, 'image/png');
    await host.repo.submit(id, hid, { species: name, count: 1, note: '', photoUri: 'file:///test.png' });
    await host.repo.review(id, hid, 'approved');
  }
  const finished = observe(host.repo, id, room => room.phase === 'finished' && room.harvests.length === 20 && !!room.tickets[host.user.uid]);
  await host.repo.transition(id, 'finish');
  assert.equal(calculateResults(await finished)[0].points, 350);
});

test('two independent players share lobby, questions, readiness, photos and final results', { timeout: 60000 }, async () => {
  const host = await client('Kuba');
  const guest = await client('Kuba'); // same nick, distinct identities
  const outsider = await client('Obcy');
  assert.notEqual(host.user.uid, guest.user.uid);
  const id = await host.repo.create({ name: 'Wspólna wyprawa', date: future(), limit: 3 });
  const code = await roomCode(host.db, id);
  await denied(getDocs(collection(outsider.db, 'codes')));
  await denied(getDocs(collection(outsider.db, 'rooms', id, 'members')));
  assert.equal(await guest.repo.join(code.toLowerCase()), id);
  const lobbyA = observe(host.repo, id, r => r.members.length === 2 && r.names[guest.user.uid] === 'Kuba');
  const lobbyB = observe(guest.repo, id, r => r.members.length === 2 && r.phase === 'lobby');
  await Promise.all([lobbyA, lobbyB]);
  await denied(updateDoc(doc(guest.db, 'rooms', id), { phase: 'predicting' }));
  await denied(setDoc(doc(host.db, 'rooms', id, 'answers', host.user.uid), { values: { winner: host.user.uid } }));
  const questions = observe(guest.repo, id, r => r.phase === 'predicting');
  await host.repo.transition(id, 'begin');
  await questions;
  await denied(updateDoc(doc(host.db, 'rooms', id), { phase: 'collecting' }));
  const values = prediction(host.user.uid);
  await host.repo.answer(id, 'winner', host.user.uid);
  await denied(getDoc(doc(guest.db, 'rooms', id, 'answers', host.user.uid)));
  await denied(setDoc(doc(host.db, 'rooms', id, 'answers', guest.user.uid), { values }));
  // Read a fresh observer to emulate reconnecting after the first answer.
  const resumed = await observe(host.repo, id, r => r.answers[host.user.uid]?.winner === host.user.uid);
  assert.equal(Object.keys(resumed.answers[host.user.uid]).length, 1);
  for (const key of ['own','total','species']) await host.repo.answer(id, key, values[key]);
  await host.repo.confirm(id, values);
  await denied(getDoc(doc(guest.db, 'rooms', id, 'tickets', host.user.uid)));
  await denied(updateDoc(doc(guest.db, 'rooms', id), { readyIds: [host.user.uid, guest.user.uid] }));
  await denied(updateDoc(doc(host.db, 'rooms', id), { phase: 'collecting' }));
  await fill(guest, id, values);
  await guest.repo.restart(id);
  await fill(guest, id, values);
  const ready = observe(host.repo, id, r => r.readyIds.length === 2);
  await guest.repo.confirm(id, values);
  const readyRoom = await ready;
  assert.equal(readyRoom.phase, 'predicting'); // no automatic search start
  await denied(updateDoc(doc(guest.db, 'rooms', id), { phase: 'collecting' }));
  const collecting = observe(guest.repo, id, r => r.phase === 'collecting');
  await host.repo.transition(id, 'start');
  await collecting;
  await assert.rejects(outsider.repo.join(code));
  const hid = doc(collection(host.db, 'rooms', id, 'harvests')).id;
  await uploadHarvestPhoto(host.storage, id, host.user.uid, hid, png, 'image/png');
  await host.repo.submit(id, hid, { species: 'Borowik', count: 12, note: '', photoUri: 'file:///test.png' });
  const photoRef = storage => ref(storage, 'rooms/' + id + '/' + host.user.uid + '/' + hid);
  assert.equal((await getBytes(photoRef(guest.storage))).byteLength, png.length);
  await denied(getBytes(photoRef(outsider.storage)));
  await denied(uploadBytes(photoRef(host.storage), png, { contentType: 'image/png' }));
  await denied(deleteObject(photoRef(host.storage)));
  await denied(updateDoc(doc(host.db, 'rooms', id), { pendingCount: 0 }));
  await denied(updateDoc(doc(host.db, 'rooms', id), { phase: 'finished', finishedAt: serverTimestamp() }));
  await denied(updateDoc(doc(guest.db, 'rooms', id, 'harvests', hid), { status: 'approved' }));
  await host.repo.review(id, hid, 'approved');
  const final = observe(guest.repo, id, r => r.phase === 'finished' && Object.keys(r.tickets).length === 2 && r.harvests[0]?.status === 'approved');
  await host.repo.transition(id, 'finish');
  const result = await final;
  assert.equal(calculateResults(result).find(r => r.member === host.user.uid).points, 350);
  await denied(updateDoc(doc(host.db, 'rooms', id), { phase: 'collecting' }));
  await denied(updateDoc(doc(host.db, 'rooms', id, 'harvests', hid), { status: 'rejected', rejectionReason: 'Zmiana' }));
});

test('simultaneous joins cannot exceed the last available place', { timeout: 30000 }, async () => {
  const host = await client('Organizator');
  const one = await client('Pierwszy');
  const two = await client('Drugi');
  const id = await host.repo.create({ name: 'Ostatnie miejsce', date: future(), limit: 2 });
  const code = await roomCode(host.db, id);
  const attempts = await Promise.allSettled([one.repo.join(code), two.repo.join(code)]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await getDoc(doc(host.db, 'rooms', id))).data().memberIds.length, 2);
});

test('one counter update cannot conceal two pending submissions', { timeout: 30000 }, async () => {
  const host = await client('Sam');
  const id = await host.repo.create({ name: 'Test zgłoszeń', date: future(), limit: 2 });
  await host.repo.transition(id, 'begin');
  const values = prediction(host.user.uid);
  await fill(host, id, values);
  await host.repo.confirm(id, values);
  await host.repo.transition(id, 'start');
  const make = hid => ({
    member: host.user.uid, species: 'Borowik', count: 1, note: '',
    photoPath: 'rooms/' + id + '/' + host.user.uid + '/' + hid,
    status: 'pending', rejectionReason: '', createdAt: serverTimestamp(),
  });
  await denied(runTransaction(host.db, async tx => {
    tx.set(doc(host.db, 'rooms', id, 'harvests', 'one'), make('one'));
    tx.set(doc(host.db, 'rooms', id, 'harvests', 'two'), make('two'));
    tx.update(doc(host.db, 'rooms', id), { pendingCount: 1, lastHarvestId: 'two' });
  }));
});

test('reconnecting a cached room list still confirms server readiness', { timeout: 20000 }, async () => {
  const host = await client('Powracający');
  const id = await host.repo.create({ name: 'Powrót do gry', date: future(), limit: 2 });
  const roomsQuery = query(collection(host.db, 'rooms'), where('memberIds', 'array-contains', host.user.uid));
  await getDocs(roomsQuery);
  await new Promise((resolve, reject) => {
    let stop;
    const timer = setTimeout(() => { stop?.(); reject(new Error('Cached query never reported server readiness')); }, 8000);
    stop = host.repo.observeIds(ids => {
      if (ids.includes(id)) { clearTimeout(timer); stop(); stops.delete(stop); resolve(); }
    }, error => { clearTimeout(timer); stop?.(); reject(error); });
    stops.add(stop);
  });
});

test('photo submissions report progress, clean up failed writes, and exclude rejected harvests', { timeout: 60000 }, async () => {
  const host = await client('Organizator zdjęć');
  const guest = await client('Uczestnik zdjęć');
  const id = await host.repo.create({ name: 'Weryfikacja zdjęć', date: future(), limit: 2 });
  await guest.repo.join(await roomCode(host.db, id));
  await host.repo.transition(id, 'begin');
  const values = prediction(guest.user.uid);
  for (const c of [host, guest]) { await fill(c, id, values); await c.repo.confirm(id, values); }
  await host.repo.transition(id, 'start');
  const photo = { data: png, type: 'image/png' };
  const data = { species: 'Borowik', count: 12, note: 'Cały zbiór', photoUri: 'file:///test.png' };
  const progress = [];
  await submitHarvestWithPhoto(guest.repo, guest.storage, id, 'approved-photo', data, photo, value => progress.push(value));
  assert.equal(progress[0], 0);
  assert.equal(progress.at(-1), 100);
  assert.ok(progress.every((value, index) => value >= 0 && value <= 100 && (index === 0 || value >= progress[index - 1])));
  const downloaded = await readHarvestPhoto(host.storage, 'rooms/' + id + '/' + guest.user.uid + '/approved-photo');
  assert.deepEqual(new Uint8Array(downloaded.bytes), png);
  assert.equal(downloaded.type, 'image/png');

  await assert.rejects(submitHarvestWithPhoto(guest.repo, guest.storage, id, 'invalid-photo', { ...data, count: 0 }, photo));
  assert.equal((await getDoc(doc(guest.db, 'rooms', id, 'harvests', 'invalid-photo'))).exists(), false);
  await assert.rejects(getBytes(ref(guest.storage, 'rooms/' + id + '/' + guest.user.uid + '/invalid-photo')),
    error => error.code === 'storage/object-not-found');
  assert.equal((await getDoc(doc(host.db, 'rooms', id))).data().pendingCount, 1);

  await submitHarvestWithPhoto(guest.repo, guest.storage, id, 'rejected-photo', { ...data, count: 90 }, photo);
  await assert.rejects(host.repo.transition(id, 'finish'));
  await host.repo.review(id, 'rejected-photo', 'rejected', 'Nie widać całego zgłaszanego zbioru');
  await assert.rejects(host.repo.transition(id, 'finish'));
  await host.repo.review(id, 'approved-photo', 'approved');
  await host.repo.transition(id, 'finish');
  const finished = await observe(guest.repo, id, room => room.phase === 'finished' && room.harvests.length === 2 && Object.keys(room.tickets).length === 2);
  assert.equal(finished.harvests.find(h => h.id === 'rejected-photo').rejectionReason, 'Nie widać całego zgłaszanego zbioru');
  assert.equal(calculateResults(finished).find(row => row.member === guest.user.uid).mushrooms, 12);
  assert.equal(calculateResults(finished).find(row => row.member === guest.user.uid).points, 350);
});
