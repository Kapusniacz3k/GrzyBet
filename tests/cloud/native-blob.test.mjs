import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { initializeApp, deleteApp } = require('firebase/app');
const { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously } = require('firebase/auth');
const { connectFirestoreEmulator, getFirestore, getDoc, doc, terminate, setLogLevel } = require('firebase/firestore');
const { connectStorageEmulator, getStorage, ref, getBytes } = require('firebase/storage');
const { CloudRepository, submitHarvestWithPhoto } = require('../../src/services/cloud-repository.ts');
const { readNativeUploadPhoto } = require('../../src/services/native-photo-upload.ts');
setLogLevel('silent');

const StandardBlob = globalThis.Blob;
class ReactNativeBlob extends StandardBlob {
  closes = 0;
  constructor(parts, options) {
    for (const part of parts) {
      if (part instanceof ArrayBuffer || ArrayBuffer.isView(part)) {
        throw new Error("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported");
      }
    }
    super(parts, options);
  }
  slice(start, end, type) { return new ReactNativeBlob([super.slice(start, end, type)], { type }); }
  close() { this.closes++; }
}

test('Firebase uploads small and chunked native blobs without constructing blobs from typed arrays', { timeout: 60000 }, async () => {
  const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-grzybet',
    authDomain: 'demo-grzybet.firebaseapp.com', storageBucket: 'demo-grzybet.firebasestorage.app' }, crypto.randomUUID());
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  const originalRequest = globalThis.XMLHttpRequest;
  try {
    const { user } = await signInAnonymously(auth);
    const repo = new CloudRepository(db, user.uid, 'Android');
    const id = await repo.create({ name: 'Zdjęcia z Androida', limit: 2 });
    await repo.transition(id, 'begin');
    const values = { winner: user.uid, own: 12, total: 12, species: 'Borowik' };
    for (const key of ['winner', 'own', 'total', 'species']) await repo.answer(id, key, values[key]);
    await repo.confirm(id, values);
    await repo.transition(id, 'start');
    globalThis.Blob = ReactNativeBlob;
    assert.throws(() => new Blob([new Uint8Array([1])]), /ArrayBuffer/);
    for (const size of [128, 700 * 1024]) {
      const data = new Uint8Array(size).fill(42);
      const blob = new ReactNativeBlob([new StandardBlob([data])], { type: 'image/jpeg' });
      globalThis.XMLHttpRequest = class {
        status = 200;
        response = blob;
        open(method, uri) { assert.equal(method, 'GET'); assert.equal(uri, 'file:///native-photo.jpg'); }
        send() { queueMicrotask(() => this.onload?.()); }
      };
      const photo = await readNativeUploadPhoto('file:///native-photo.jpg', 'image/jpeg');
      const hid = 'native-' + size;
      const progress = [];
      await submitHarvestWithPhoto(repo, storage, id, hid,
        { species: 'Borowik', count: 12, note: '', photoUri: 'file:///native-photo.jpg' }, photo, percent => progress.push(percent));
      assert.equal(blob.closes, 1);
      assert.equal(progress[0], 0); assert.equal(progress.at(-1), 100);
      assert.equal((await getDoc(doc(db, 'rooms', id, 'harvests', hid))).data().status, 'pending');
      assert.deepEqual(new Uint8Array(await getBytes(ref(storage, 'rooms/' + id + '/' + user.uid + '/' + hid))), data);
    }
    const failedBlob = new ReactNativeBlob(['invalid harvest'], { type: 'image/jpeg' });
    await assert.rejects(submitHarvestWithPhoto(repo, storage, id, 'invalid-native',
      { species: 'Borowik', count: 0, note: '', photoUri: 'file:///native-photo.jpg' },
      { data: failedBlob, type: 'image/jpeg', release: () => failedBlob.close() }));
    assert.equal(failedBlob.closes, 1);
    await assert.rejects(getBytes(ref(storage, 'rooms/' + id + '/' + user.uid + '/invalid-native')),
      error => error.code === 'storage/object-not-found');
  } finally {
    globalThis.Blob = StandardBlob;
    if (originalRequest === undefined) delete globalThis.XMLHttpRequest;
    else globalThis.XMLHttpRequest = originalRequest;
    await terminate(db);
    await deleteApp(app);
  }
});
