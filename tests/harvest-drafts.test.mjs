import assert from 'node:assert/strict';
import test from 'node:test';
import { createHarvestDraftSession, createHarvestDraftStore, emptyHarvestDraft, harvestDraftKey, validateHarvestDraft } from '../src/services/harvest-drafts.ts';

const scope = { mode: 'local', userId: 'Kuba', roomId: 'gorce' };
const sample = () => ({ species: 'Borowik', count: '12', note: 'Przy ścieżce', photoUri: 'file:///documents/grzybet-photos/a.jpg' });
function memory() {
  const values = new Map();
  return { values, getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } };
}
function gate() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

test('draft survives a new store instance with photo and unfinished fields', async () => {
  const storage = memory();
  const store = createHarvestDraftStore(storage);
  const draft = { ...sample(), count: '', note: '' };
  await store.save(scope, draft);
  assert.deepEqual(await createHarvestDraftStore(storage).load(scope), draft);
});

test('mode, account and room isolate drafts and delimiter-like IDs cannot collide', async () => {
  const store = createHarvestDraftStore(memory());
  await store.save(scope, sample());
  for (const other of [{ ...scope, mode: 'online' }, { ...scope, userId: 'Kacper' }, { ...scope, roomId: 'beskidy' }]) {
    assert.deepEqual(await store.load(other), emptyHarvestDraft());
  }
  assert.notEqual(harvestDraftKey({ ...scope, userId: 'a:b', roomId: 'c' }), harvestDraftKey({ ...scope, userId: 'a', roomId: 'b:c' }));
  assert.throws(() => harvestDraftKey({ ...scope, userId: '' }));
});

test('validates shape, bounded fields and durable photo schemes without overwriting invalid storage', async () => {
  for (const patch of [{ count: '-1' }, { count: '1000000' }, { count: 12 }, { species: 'Unknown' }, { note: 'x'.repeat(301) },
    { photoUri: 'blob:expired' }, { photoUri: 'https://example.com/image.jpg' }, { photoUri: 'data:image/svg+xml;base64,AA==' },
    { photoUri: 'file:///a\nb' }, { extra: 1 }]) assert.throws(() => validateHarvestDraft({ ...sample(), ...patch }));
  assert.equal(validateHarvestDraft({ ...sample(), photoUri: 'data:image/jpeg;base64,AA==' }).photoUri, 'data:image/jpeg;base64,AA==');
  const storage = memory();
  const key = harvestDraftKey(scope);
  storage.values.set(key, '{broken');
  const store = createHarvestDraftStore(storage);
  await assert.rejects(store.load(scope));
  await assert.rejects(store.save(scope, sample()));
  assert.equal(storage.values.get(key), '{broken');
  await store.clear(scope); // Explicit destructive reset, never automatic recovery.
  assert.deepEqual(await store.load(scope), emptyHarvestDraft());
});

test('serializes writes and reads per key while a different account remains independent', async () => {
  const storage = memory();
  const barrier = gate();
  const entered = gate();
  const originalSet = storage.setItem;
  let first = true;
  storage.setItem = async (key, value) => {
    if (first) { first = false; entered.resolve(); await barrier.promise; }
    await originalSet(key, value);
  };
  const store = createHarvestDraftStore(storage);
  const firstWrite = store.save(scope, sample());
  await entered.promise;
  const latest = { ...sample(), count: '28' };
  const secondWrite = store.save(scope, latest);
  const restored = store.load(scope);
  const other = { ...scope, userId: 'other' };
  await store.save(other, { ...sample(), count: '9' });
  assert.equal((await store.load(other)).count, '9');
  barrier.resolve();
  await Promise.all([firstWrite, secondWrite]);
  assert.deepEqual(await restored, latest);
});

test('a rejected write does not poison subsequent operations', async () => {
  const storage = memory();
  const originalSet = storage.setItem;
  let fail = true;
  storage.setItem = async (...args) => { if (fail) { fail = false; throw new Error('quota'); } await originalSet(...args); };
  const store = createHarvestDraftStore(storage);
  await assert.rejects(store.save(scope, sample()));
  await store.save(scope, { ...sample(), count: '6' });
  assert.equal((await store.load(scope)).count, '6');
});

test('late submission cleanup cannot clear a newer draft', async () => {
  const store = createHarvestDraftStore(memory());
  const sent = sample();
  await store.save(scope, sent);
  const next = { ...sent, count: '16' };
  await store.save(scope, next);
  assert.deepEqual(await store.clear(scope, sent), { cleared: false, retiredPhoto: '' });
  assert.deepEqual(await store.load(scope), next);
});

test('session blocks editing until restore and never overwrites saved draft during hydration', async () => {
  const storage = memory();
  await createHarvestDraftStore(storage).save(scope, sample());
  const barrier = gate();
  const get = storage.getItem;
  storage.getItem = async key => { await barrier.promise; return get(key); };
  const session = createHarvestDraftSession(createHarvestDraftStore(storage), scope);
  const restoring = session.load();
  await assert.rejects(session.update({ count: '7' }));
  assert.equal(session.getSnapshot().ready, false);
  barrier.resolve(); await restoring;
  assert.deepEqual(session.getSnapshot().draft, sample());
  assert.equal(session.getSnapshot().ready, true);
});

test('unsubscribe/navigation keeps queued data and photos; a new session restores them', async () => {
  const store = createHarvestDraftStore(memory());
  const retired = [];
  const session = createHarvestDraftSession(store, scope, uri => retired.push(uri));
  await session.load();
  const unsubscribe = session.subscribe(() => {});
  const saving = session.update(sample());
  unsubscribe();
  await saving;
  const next = createHarvestDraftSession(store, scope);
  await next.load();
  assert.deepEqual(next.getSnapshot().draft, sample());
  assert.deepEqual(retired, []);
});

test('failed save retains in-memory draft, shows error and retires old photo only after retry succeeds', async () => {
  const storage = memory();
  const store = createHarvestDraftStore(storage);
  await store.save(scope, sample());
  const retired = [];
  const session = createHarvestDraftSession(store, scope, uri => retired.push(uri));
  await session.load();
  const originalSet = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  const newPhoto = 'file:///documents/grzybet-photos/b.jpg';
  await assert.rejects(session.update({ photoUri: newPhoto }));
  assert.equal(session.getSnapshot().draft.photoUri, newPhoto);
  assert.ok(session.getSnapshot().error);
  assert.deepEqual(retired, []);
  assert.equal((await store.load(scope)).photoUri, sample().photoUri);
  storage.setItem = originalSet;
  await session.flush();
  assert.deepEqual(retired, [sample().photoUri]);
  assert.equal(session.getSnapshot().error, '');
});

test('explicit reset retires photo only after successful deletion', async () => {
  const storage = memory();
  const store = createHarvestDraftStore(storage);
  const retired = [];
  const session = createHarvestDraftSession(store, scope, uri => retired.push(uri));
  await session.load(); await session.update(sample());
  const remove = storage.removeItem;
  storage.removeItem = async () => { throw new Error('disk'); };
  await assert.rejects(session.clear());
  assert.deepEqual(retired, []);
  assert.deepEqual(session.getSnapshot().draft, sample());
  storage.removeItem = remove;
  await session.clear();
  assert.deepEqual(retired, [sample().photoUri]);
  assert.deepEqual(await store.load(scope), emptyHarvestDraft());
});

test('local successful submission preserves the photo now owned by its room', async () => {
  const store = createHarvestDraftStore(memory());
  const retired = [];
  const session = createHarvestDraftSession(store, scope, uri => retired.push(uri));
  await session.load(); await session.update(sample());
  await session.clear({ preservePhoto: sample().photoUri });
  assert.deepEqual(retired, []);
  assert.deepEqual(await store.load(scope), emptyHarvestDraft());
});

test('confirmed discard works when quota blocked the latest draft edit', async () => {
  const storage = memory();
  const store = createHarvestDraftStore(storage);
  const retired = [];
  const session = createHarvestDraftSession(store, scope, uri => retired.push(uri));
  await session.load(); await session.update(sample());
  storage.setItem = async () => { throw new Error('quota'); };
  await assert.rejects(session.update({ count: '44' }));
  await session.clear({ force: true });
  assert.deepEqual(await store.load(scope), emptyHarvestDraft());
  assert.deepEqual(retired, [sample().photoUri]);
});

test('failed restore is visible and retry loads intact account data', async () => {
  const storage = memory();
  const store = createHarvestDraftStore(storage);
  await store.save(scope, sample());
  const get = storage.getItem;
  storage.getItem = async () => { throw new Error('read failure'); };
  const session = createHarvestDraftSession(store, scope);
  await session.load();
  assert.equal(session.getSnapshot().ready, false);
  assert.ok(session.getSnapshot().error);
  storage.getItem = get;
  await session.load();
  assert.deepEqual(session.getSnapshot().draft, sample());
  assert.equal(session.getSnapshot().error, '');
});
