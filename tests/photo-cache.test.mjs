import assert from 'node:assert/strict';
import test from 'node:test';
import { writeCachedPhoto } from '../src/services/photo-cache.ts';
import { cachedPhoto as webCachedPhoto } from '../src/services/cloud-photos.web.ts';

const bytes = new Uint8Array([0xff, 0xd8, 3, 4]).buffer;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fileStore(writes = []) {
  const contents = new Map();
  const files = [];
  const createFile = name => {
    const pending = writes[files.length];
    const file = {
      uri: `file:///cache/${name}`,
      deletes: 0,
      get exists() { return contents.has(file.uri); },
      async write(data) {
        // A real SDK can create a partial file before I/O resolves or rejects.
        contents.set(file.uri, new Uint8Array(data.slice(0, 1)));
        await pending?.promise;
        contents.set(file.uri, new Uint8Array(data));
      },
      delete() { file.deletes++; contents.delete(file.uri); },
    };
    files.push(file);
    return file;
  };
  return { contents, files, createFile };
}

test('a native cache URI is not published while SDK58 write is pending', async () => {
  const diskWrite = deferred();
  const store = fileStore([diskWrite]);
  let published = false;
  const pendingPhoto = writeCachedPhoto('harvest', bytes, 'image/jpeg', store.createFile).then(photo => {
    published = true;
    assert.deepEqual(store.contents.get(photo.uri), new Uint8Array(bytes), 'consumers must see all bytes');
    return photo;
  });
  await Promise.resolve();
  assert.equal(published, false);
  assert.equal(store.contents.get(store.files[0].uri).byteLength, 1, 'the partial SDK file is not ready');
  diskWrite.resolve();
  const photo = await pendingPhoto;
  assert.equal(published, true);
  assert.equal(photo.uri, store.files[0].uri);
  photo.release(); photo.release();
  assert.equal(store.files[0].deletes, 1);
  assert.equal(store.contents.size, 0);
});

test('a rejected SDK write rejects the cache operation and removes the incomplete file', async () => {
  const diskWrite = deferred();
  const store = fileStore([diskWrite]);
  const failure = new Error('device storage full');
  const pendingPhoto = writeCachedPhoto('harvest', bytes, 'image/png', store.createFile);
  const rejection = assert.rejects(pendingPhoto, error => error === failure);
  assert.equal(store.contents.size, 1);
  diskWrite.reject(failure);
  await rejection;
  assert.equal(store.files[0].deletes, 1);
  assert.equal(store.contents.size, 0);
});

test('cleanup failure does not mask the original write failure', async () => {
  const failure = new Error('write failed');
  let deletes = 0;
  await assert.rejects(writeCachedPhoto('harvest', bytes, 'image/jpeg', () => ({
    uri: 'file:///cache/partial.jpg', exists: true,
    write: async () => { throw failure; },
    delete: () => { deletes++; throw new Error('cleanup denied'); },
  })), error => error === failure);
  assert.equal(deletes, 1);
});

test('late completion and release of the same harvest from an old session cannot delete the new cache', async () => {
  const oldWrite = deferred();
  const store = fileStore([oldWrite]);
  const originalNow = Date.now;
  Date.now = () => 123456789;
  try {
    const oldPendingPhoto = writeCachedPhoto('same-harvest', bytes, 'image/webp', store.createFile);
    const freshPhoto = await writeCachedPhoto('same-harvest', bytes, 'image/webp', store.createFile);
    oldWrite.resolve();
    const stalePhoto = await oldPendingPhoto;
    assert.notEqual(stalePhoto.uri, freshPhoto.uri);
    stalePhoto.release(); stalePhoto.release();
    assert.deepEqual(store.contents.get(freshPhoto.uri), new Uint8Array(bytes));
    assert.equal(store.files[0].deletes, 1);
    assert.equal(store.files[1].deletes, 0);
    freshPhoto.release();
    assert.equal(store.contents.size, 0);
  } finally { Date.now = originalNow; }
});

test('native cache files retain an image extension while names stay inside their cache directory', async () => {
  const store = fileStore();
  for (const [type, extension] of [['image/png', '.png'], ['image/webp', '.webp'], ['image/heic', '.heic'], ['image/jpeg', '.jpg']]) {
    const photo = await writeCachedPhoto('../same/harvest', bytes, type, store.createFile);
    assert.ok(photo.uri.endsWith(extension));
    assert.equal(photo.uri.slice('file:///cache/'.length).includes('/'), false);
    photo.release();
  }
  assert.equal(store.contents.size, 0);
});

test('web object URLs for the same harvest have separate lifetimes and idempotent release', async () => {
  const stalePhoto = webCachedPhoto('same-harvest', bytes, 'image/jpeg');
  const freshPhoto = webCachedPhoto('same-harvest', bytes, 'image/jpeg');
  try {
    assert.notEqual(stalePhoto.uri, freshPhoto.uri);
    stalePhoto.release(); stalePhoto.release();
    const response = await fetch(freshPhoto.uri);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(bytes));
  } finally { stalePhoto.release(); freshPhoto.release(); }
});
