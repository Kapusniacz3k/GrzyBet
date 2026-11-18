import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCouponResults, couponLinesFor, couponMaxPicks, couponOdds, couponPickOdds, placeCoupon } from '../src/features/coupons.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

function room(count = 2, couponVersion = 2) {
  return { id: 'balance', name: 'Balans kuponów', code: 'BAL123', date: '2026-11-08T09:00:00.000Z', gameMode: 'coupons', couponVersion,
    couponBook: {}, readyIds: [], limit: 30, members: ['Kuba', ...Array.from({ length: count - 1 }, (_, i) => `Gracz${i + 1}`)],
    host: 'Kuba', joined: true, closed: true, phase: 'predicting', scoringVersion: 2, tickets: {}, answers: {}, harvests: [] };
}
const coupon = (id, picks, stake = 1) => ({ id, picks, stake });
const harvest = (member, count, species = 'Borowik') => ({ id: `harvest-${member}`, member, count, species,
  status: 'approved', photoUri: 'file:///photo.jpg', note: '', createdAt: '2026-11-08T10:00:00.000Z' });
function result(state) {
  return calculateCouponResults({ ...state, phase: 'finished', readyIds: state.members, finishedAt: '2026-11-08T12:00:00.000Z' }).find(row => row.member === 'Kuba');
}

test('covering every winner cannot profit on a solo winner, partial tie, full tie or an empty trip', () => {
  for (const count of [2, 3, 4, 5, 10]) {
    let state = room(count);
    assert.equal(couponPickOdds(state, 'winner', 'Kuba'), count * 90);
    for (const [i, member] of state.members.entries()) state = placeCoupon(state, coupon(`winner-${i}`, { winner: member }), 'Kuba');
    for (const tied of [0, 1, Math.ceil(count / 2), count]) {
      state.harvests = state.members.slice(0, tied).map(member => harvest(member, 12));
      assert.ok(result(state).balanceCents < 1000, `no hedge profit with ${count} players and ${tied} winners`);
    }
  }
  let two = room();
  two = placeCoupon(two, coupon('cover001', { winner: 'Kuba' }, 5), 'Kuba');
  two = placeCoupon(two, coupon('cover002', { winner: 'Gracz1' }, 5), 'Kuba');
  two.harvests = [harvest('Kuba', 12), harvest('Gracz1', 12)];
  assert.equal(result(two).payoutCents, 900);
  assert.equal(result(two).balanceCents, 900);
});

test('winner and species ties divide the accumulated payout once per tied market, with cents rounded down', () => {
  let state = placeCoupon(room(4), coupon('ties0001', { winner: 'Kuba', species: 'Borowik' }, 3), 'Kuba');
  state.harvests = [harvest('Kuba', 12), harvest('Gracz1', 12, 'Kurka')];
  const settled = result(state).slips[0];
  assert.equal(settled.odds, 1800);
  assert.equal(settled.tieDivisor, 4);
  assert.equal(settled.payoutCents, 1350);
  assert.equal(settled.won, true);
  state = placeCoupon(room(3), coupon('ties0002', { winner: 'Kuba' }), 'Kuba');
  state.harvests = [harvest('Kuba', 12), harvest('Gracz1', 12)];
  assert.equal(result(state).slips[0].payoutCents, 135);
  state = placeCoupon(room(3), coupon('ties0003', { species: 'Borowik' }), 'Kuba');
  state.harvests = [harvest('Kuba', 12), harvest('Gracz1', 12, 'Kurka'), harvest('Gracz2', 12, 'Maślak')];
  assert.equal(result(state).slips[0].payoutCents, 166);
});

test('own-count bets require collecting rather than abstaining and reject every under line', () => {
  let state = room();
  for (const line of [5, 10, 20]) {
    assert.throws(() => placeCoupon(state, coupon(`under--${line}`, { own: `under${line}` }), 'Kuba'), /oferty/);
    state = placeCoupon(state, coupon(`over---${line}`, { own: `over${line}` }, line === 5 ? 4 : 3), 'Kuba');
  }
  assert.equal(result(state).balanceCents, 0);
  assert.equal(result(state).won, 0);
  for (const line of [5, 10, 20]) for (const actual of [line, line + 1]) {
    const boundary = placeCoupon(room(), coupon('boundary', { own: `over${line}` }), 'Kuba');
    boundary.harvests = [harvest('Kuba', actual)];
    assert.equal(result(boundary).slips[0].won, actual > line);
  }
});

test('team lines scale with locked membership and resolve each half-mushroom boundary', () => {
  for (const count of [2, 3, 4, 8, 30]) {
    const state = room(count);
    const lines = couponLinesFor(state, 'total');
    assert.deepEqual(lines.map(option => option.line), [5 * count, 10 * count, 20 * count]);
    for (const option of lines) for (const actual of [option.line, option.line + 1]) {
      let boundary = placeCoupon(state, coupon('over0001', { total: `over${option.id}` }), 'Kuba');
      boundary = placeCoupon(boundary, coupon('under001', { total: `under${option.id}` }), 'Kuba');
      boundary.harvests = [harvest('Kuba', actual)];
      assert.equal(result(boundary).slips[0].won, actual > option.line);
      assert.equal(result(boundary).slips[1].won, actual <= option.line);
    }
  }
});

test('dependent own and team selections cannot multiply and solo players cannot bet on guaranteed team outcomes', () => {
  assert.equal(couponMaxPicks(room()), 3);
  assert.throws(() => placeCoupon(room(), coupon('related1', { own: 'over20', total: 'over-low' }), 'Kuba'), /oddzielnych/);
  assert.throws(() => couponOdds(room(), { own: 'over5', total: 'under-mid' }), /oddzielnych/);
  const solo = room(1);
  assert.equal(couponLinesFor(solo, 'total').length, 0);
  assert.throws(() => placeCoupon(solo, coupon('solo0001', { winner: 'Kuba' }), 'Kuba'), /oferty/);
  assert.throws(() => placeCoupon(solo, coupon('solo0002', { total: 'under-low' }), 'Kuba'), /oferty/);
  assert.doesNotThrow(() => placeCoupon(solo, coupon('solo0003', { own: 'over5', species: 'Borowik' }), 'Kuba'));
});

test('old prices, thresholds, allowed combinations and full tie payouts survive storage unchanged', () => {
  let legacy = room(2, 1);
  legacy = placeCoupon(legacy, coupon('legacy01', { winner: 'Kuba', own: 'under20', total: 'under50', species: 'Borowik' }, 2), 'Kuba');
  legacy.harvests = [harvest('Kuba', 12), harvest('Gracz1', 12, 'Kurka')];
  legacy = { ...legacy, phase: 'finished', readyIds: legacy.members, finishedAt: '2026-11-08T12:00:00.000Z' };
  const restored = decodeRooms(encodeRooms([legacy]))[0];
  assert.equal(restored.couponVersion, 1);
  assert.equal(couponMaxPicks(restored), 4);
  assert.deepEqual(couponLinesFor(restored, 'total').map(option => option.line), [20, 50, 100]);
  assert.equal(couponPickOdds(restored, 'winner', 'Kuba'), 300);
  assert.deepEqual(result(restored), result(legacy));
  assert.equal(result(restored).slips[0].tieDivisor, 1);
  assert.equal(result(restored).slips[0].payoutCents, 6630);
});

test('new pricing version and tier selections survive storage while unknown versions and old codes reject', () => {
  const state = placeCoupon(room(4), coupon('modern01', { winner: 'Kuba', total: 'over-mid', species: 'Borowik' }, 2), 'Kuba');
  const restored = decodeRooms(encodeRooms([state]))[0];
  assert.equal(restored.couponVersion, 2);
  assert.deepEqual(restored.couponBook, state.couponBook);
  assert.equal(couponOdds(restored, restored.couponBook.Kuba.slips[0].picks), 3600);
  assert.throws(() => encodeRooms([{ ...state, couponVersion: 3 }]));
  assert.throws(() => placeCoupon(room(), coupon('oldcode1', { total: 'over20' }), 'Kuba'), /oferty/);
});
