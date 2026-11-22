import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhotoLoader } from '../src/services/photo-loader.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test('photos download only on request, deduplicate requests, and cap concurrent downloads', async () => {
  const calls = [];
  const jobs = new Map();
  const released = [];
  const loader = createPhotoLoader(path => { calls.push(path); const job = deferred(); jobs.set(path, job); return job.promise; });
  assert.deepEqual(calls, []);
  const first = loader.load('one'); const duplicate = loader.load('one');
  const second = loader.load('two'); const third = loader.load('three');
  await tick(); assert.deepEqual(calls, ['one', 'two']);
  jobs.get('one').resolve({ uri: 'file:///one', release: () => released.push('one') });
  assert.equal(await first, 'file:///one'); assert.equal(await duplicate, 'file:///one');
  await tick(); assert.deepEqual(calls, ['one', 'two', 'three']);
  for (const path of ['two', 'three']) jobs.get(path).resolve({ uri: `file:///${path}`, release: () => released.push(path) });
  await Promise.all([second, third]);
  assert.equal(await loader.load('one'), 'file:///one');
  assert.equal(calls.length, 3);
  loader.dispose(); loader.dispose(); assert.deepEqual(released.sort(), ['one', 'three', 'two']);
});

test('failed downloads retry and image refresh replaces and releases the cached file', async () => {
  let calls = 0; const released = [];
  const loader = createPhotoLoader(async () => {
    const id = ++calls; if (id === 1) throw new Error('offline');
    return { uri: `file:///${id}`, release: () => released.push(id) };
  });
  await assert.rejects(loader.load('photo'), /offline/);
  assert.equal(await loader.load('photo'), 'file:///2');
  assert.equal(await loader.load('photo', true), 'file:///3');
  assert.deepEqual(released, [2]); loader.dispose(); assert.deepEqual(released, [2, 3]);
});

test('changing accounts releases in-flight files and does not download queued photos', async () => {
  const job = deferred(); const calls = []; let released = 0;
  const loader = createPhotoLoader(path => { calls.push(path); return job.promise; }, 1);
  const first = assert.rejects(loader.load('first'), /Konto/);
  const second = assert.rejects(loader.load('queued'), /Konto/);
  await tick(); loader.dispose();
  job.resolve({ uri: 'file:///old-account', release: () => released++ });
  await Promise.all([first, second]);
  assert.deepEqual(calls, ['first']); assert.equal(released, 1);
  await assert.rejects(loader.load('later'), /zakończona/);
});
