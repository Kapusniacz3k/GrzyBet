import assert from 'node:assert/strict';
import test from 'node:test';
import { createOnlineRoomCache, onlineRoomCacheKey } from '../src/services/online-room-cache.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';
import { placeCoupon } from '../src/features/coupons.ts';

const uid = 'firebase-user';
function room(overrides = {}) {
  const ticket = { winner: uid, own: 2, total: 2, species: 'Borowik' };
  return { id: 'trip', name: 'Test zapisu', code: 'CACHE1', date: '2026-11-22T08:00:00.000Z', limit: 3,
    host: uid, members: [uid, 'other'], joined: true, phase: 'finished', closed: true, tickets: { [uid]: ticket }, ticket,
    answers: { [uid]: {} }, names: { [uid]: 'Kuba', other: 'Ola' }, progress: { [uid]: 4, other: 4 }, readyIds: [uid, 'other'],
    finishedAt: '2026-11-22T12:00:00.000Z', harvests: [{ id: 'photo1', member: uid, species: 'Borowik', count: 2,
      photoUri: `rooms/trip/${uid}/photo1`, note: '', status: 'approved', createdAt: '2026-11-22T10:00:00.000Z' }], ...overrides };
}
function memory() { const values = new Map(); return { values, async getItem(key) { return values.get(key) ?? null; }, async setItem(key, value) { values.set(key, value); } }; }

test('online cache restores complete per-account data without downloading photos', async () => {
  const storage = memory(); const cache = createOnlineRoomCache(storage);
  assert.equal(await cache.load(uid), null);
  const trip = room(); await cache.save(uid, [trip]);
  assert.deepEqual(await cache.load(uid), [trip]);
  assert.equal(await cache.load('another-account'), null);
  const raw = storage.values.get(onlineRoomCacheKey(uid));
  storage.values.set(onlineRoomCacheKey('another-account'), raw);
  await assert.rejects(cache.load('another-account'), /konta/);
});

test('cache rejects foreign memberships, cloud photo paths and invalid snapshots without replacing a good record', async () => {
  const storage = memory(); const cache = createOnlineRoomCache(storage); const trip = room();
  await cache.save(uid, [trip]); const raw = storage.values.get(onlineRoomCacheKey(uid));
  for (const broken of [room({ joined: false }), room({ members: ['other'] }), room({ harvests: [{ ...trip.harvests[0], photoUri: 'rooms/other/user/photo1' }] }),
    room({ harvests: [{ ...trip.harvests[0], photoUri: 'https://example.com/photo' }] }), room({ progress: { [uid]: 99 } })]) {
    assert.throws(() => cache.save(uid, [broken])); assert.equal(storage.values.get(onlineRoomCacheKey(uid)), raw);
  }
  assert.throws(() => encodeRooms([trip])); // Local mode still refuses cloud paths and online aliases.
  assert.throws(() => decodeRooms(JSON.parse(raw).rooms));
});

test('queued saves capture immutable snapshots and preserve the newest state across slow writes and failures', async () => {
  const storage = memory(); let fail = true;
  const cache = createOnlineRoomCache({ ...storage, async setItem(key, value) {
    await new Promise(resolve => setTimeout(resolve, 5));
    if (fail) { fail = false; throw new Error('quota'); } await storage.setItem(key, value);
  } });
  const old = cache.save(uid, [room({ name: 'Starszy' })]);
  const newest = room({ name: 'Nowszy' }); const saved = cache.save(uid, [newest]); newest.name = 'Późniejsza mutacja';
  await assert.rejects(old, /quota/); await saved;
  assert.equal((await cache.load(uid))[0].name, 'Nowszy');
});

test('coupon readiness and cancelled pending harvests survive offline restoration', async () => {
  const storage = memory(); const cache = createOnlineRoomCache(storage);
  let trip = room({ phase: 'predicting', finishedAt: undefined, gameMode: 'coupons', couponVersion: 2, tickets: {}, ticket: undefined, answers: {}, harvests: [], readyIds: [], couponBook: {} });
  trip = placeCoupon(trip, { id: 'slip0001', picks: { own: 'over5' }, stake: 2 }, uid);
  await cache.save(uid, [trip]); assert.deepEqual(await cache.load(uid), [JSON.parse(JSON.stringify(trip))]);
  const cancelled = room({ phase: 'cancelled' }); cancelled.harvests[0].status = 'pending';
  await cache.save(uid, [cancelled]); assert.equal((await cache.load(uid))[0].harvests[0].status, 'pending');
});
