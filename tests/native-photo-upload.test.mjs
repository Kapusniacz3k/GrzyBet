import assert from 'node:assert/strict';
import test from 'node:test';
import { readNativeUploadPhoto } from '../src/services/native-photo-upload.ts';

class NativeBlob extends Blob {
  closes = 0;
  arrayBuffer() { throw new Error('The native photo must not be converted to an ArrayBuffer'); }
  close() { this.closes++; }
}
async function withReader({ blob, status = 200, event = 'load' }, run) {
  const original = globalThis.XMLHttpRequest;
  let request;
  class FileRequest {
    response = blob;
    status = status;
    constructor() { request = this; }
    open(method, uri, async) { this.opened = { method, uri, async }; }
    send(body) { this.body = body; queueMicrotask(() => this['on' + event]?.()); }
  }
  globalThis.XMLHttpRequest = FileRequest;
  try { await run(() => request); }
  finally {
    if (original === undefined) delete globalThis.XMLHttpRequest;
    else globalThis.XMLHttpRequest = original;
  }
}

test('native photos stay native blobs and remain open until explicitly released', async () => {
  const blob = new NativeBlob(['image fixture'], { type: 'image/jpeg' });
  await withReader({ blob, status: 0 }, async getRequest => {
    const photo = await readNativeUploadPhoto('file:///photos/photo.jpg', 'image/jpeg');
    assert.equal(photo.data, blob);
    assert.equal(photo.type, 'image/jpeg');
    assert.equal(blob.closes, 0);
    assert.deepEqual(getRequest().opened, { method: 'GET', uri: 'file:///photos/photo.jpg', async: true });
    assert.equal(getRequest().responseType, 'blob');
    assert.equal(getRequest().timeout, 15000);
    assert.equal(getRequest().body, null);
    assert.equal(getRequest().onload, null);
    photo.release(); photo.release();
    assert.equal(blob.closes, 1);
  });
});

test('unreadable, empty and oversized native photos reject and release their native data', async () => {
  for (const scenario of [
    { blob: new NativeBlob(['not found']), status: 404 },
    { blob: new NativeBlob([]) },
    { blob: new NativeBlob(['x'.repeat(5 * 1024 * 1024 + 1)]) },
  ]) {
    await withReader(scenario, async () => {
      await assert.rejects(readNativeUploadPhoto('file:///photo.jpg', 'image/jpeg'));
      assert.equal(scenario.blob.closes, 1);
    });
  }
  await withReader({ blob: new Uint8Array([1, 2, 3]) }, async () => {
    await assert.rejects(readNativeUploadPhoto('file:///photo.jpg', 'image/jpeg'));
  });
});

test('native file read errors, timeouts and cancellation settle without leaving handlers attached', async () => {
  for (const event of ['error', 'timeout', 'abort']) {
    await withReader({ blob: null, event }, async getRequest => {
      await assert.rejects(readNativeUploadPhoto('file:///photo.jpg', 'image/jpeg'), /odczytać zdjęcia/);
      for (const handler of ['onload', 'onerror', 'ontimeout', 'onabort']) assert.equal(getRequest()[handler], null);
    });
  }
});
