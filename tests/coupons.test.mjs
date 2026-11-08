import assert from 'node:assert/strict';
import test from 'node:test';
import { answerQuestion, transitionRoom, everyoneReady, species } from '../src/features/domain.ts';
import { calculateCouponResults, couponLines, couponOdds, couponPickOdds, couponWallet, finishCoupons, placeCoupon } from '../src/features/coupons.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

function room() {
  return { id: 'coupons', name: 'Kupony w lesie', code: 'CUP123', date: '2026-11-08T09:00:00.000Z',
    scoringVersion: 2, gameMode: 'coupons', couponVersion: 1, couponBook: {}, readyIds: [],
    limit: 4, members: ['Kuba', 'Kacper'], host: 'Kuba', joined: true, closed: true, phase: 'predicting',
    predictionStartedAt: '2026-11-08T09:10:00.000Z', tickets: {}, answers: {}, harvests: [] };
}
const slip = (id, stake, picks) => ({ id, stake, picks });
const harvest = (member, count, kind = 'Borowik', status = 'approved') => ({ id: `harvest-${member}-${kind}`, member, count, species: kind,
  status, photoUri: 'file:///photo.jpg', note: '', createdAt: '2026-11-08T10:00:00.000Z' });
function completed(state) {
  return { ...state, phase: 'finished', readyIds: [...state.members], finishedAt: '2026-11-08T12:00:00.000Z' };
}

test('several coupons spend one room budget, retries do not charge twice, and another trip starts with ten', () => {
  const original = room();
  const first = slip('coupon01', 3, { winner: 'Kuba' });
  const once = placeCoupon(original, first, 'Kuba');
  const twice = placeCoupon(once, slip('coupon02', 7, { own: 'over10' }), 'Kuba');
  assert.equal(couponWallet(twice, 'Kuba').spent, 10);
  assert.equal(couponWallet(twice, 'Kuba').slips.length, 2);
  assert.equal(couponWallet(twice, 'Kacper').spent, 0);
  assert.equal(couponWallet(original, 'Kuba').spent, 0);
  assert.equal(couponWallet(room(), 'Kuba').spent, 0);
  assert.equal(placeCoupon(twice, first, 'Kuba'), twice);
  assert.throws(() => placeCoupon(twice, slip('coupon03', 1, { total: 'over20' }), 'Kuba'), /wystarczająco/);
  assert.throws(() => placeCoupon(twice, { ...first, stake: 2 }, 'Kuba'), /już zapisany/);
  first.picks.winner = 'Kacper';
  assert.equal(couponWallet(once, 'Kuba').slips[0].picks.winner, 'Kuba');
});

test('prices multiply deterministically, allow one type per market and cannot be supplied by the caller', () => {
  const state = room();
  assert.equal(couponPickOdds(state, 'winner', 'Kuba'), 300);
  assert.equal(couponOdds(state, { winner: 'Kuba', own: 'over10', total: 'under20', species: 'Borowik' }), 5985);
  assert.equal(couponOdds(state, { total: 'under100', winner: 'Kuba', species: 'Borowik', own: 'under20' }), 2438);
  assert.equal(couponOdds(state, { own: 'under20', species: 'Borowik', winner: 'Kuba', total: 'under100' }), 2438);
  for (const picks of [{}, { fake: 'anything' }, { own: ['over5', 'over10'] }, { own: 'over7' }, { winner: 'Obcy' }, { species: 'Nieznany' }, { total: undefined }, null]) {
    assert.throws(() => placeCoupon(state, slip('badpick1', 1, picks), 'Kuba'));
  }
  for (const stake of [0, -1, 0.5, 11, NaN, Infinity, '1']) assert.throws(() => placeCoupon(state, slip('badstake', stake, { own: 'over5' }), 'Kuba'));
  assert.throws(() => placeCoupon(state, { ...slip('badfield', 1, { own: 'over5' }), odds: 999 }, 'Kuba'), /nieznane pola/);
  for (const kind of species) assert.equal(couponOdds(state, { species: kind }), 500);
});

test('coupon readiness is explicit, zero coupons is allowed, and only the host starts searches after everyone is ready', () => {
  const lobby = { ...room(), phase: 'lobby', closed: false, predictionStartedAt: undefined };
  assert.throws(() => placeCoupon(lobby, slip('before01', 1, { winner: 'Kuba' }), 'Kuba'), /otwarciu/);
  const open = transitionRoom(lobby, 'begin', 'Kuba');
  assert.throws(() => answerQuestion(open, 'winner', 'Kuba', 'Kuba'), /zamiast/);
  assert.throws(() => finishCoupons(open, 'Obcy'), /Nie należysz/);
  const hostReady = finishCoupons(open, 'Kuba');
  assert.equal(everyoneReady(hostReady), false);
  assert.throws(() => placeCoupon(hostReady, slip('after001', 1, { own: 'over5' }), 'Kuba'), /Zakończyłeś/);
  assert.throws(() => finishCoupons(hostReady, 'Kuba'), /Zakończyłeś/);
  assert.throws(() => transitionRoom(hostReady, 'start', 'Kuba'), /wszyscy/);
  const allReady = finishCoupons(hostReady, 'Kacper');
  assert.equal(everyoneReady(allReady), true);
  assert.throws(() => transitionRoom(allReady, 'start', 'Kacper'), /organizatora/);
  const collecting = transitionRoom(allReady, 'start', 'Kuba');
  assert.throws(() => placeCoupon(collecting, slip('after002', 1, { own: 'over5' }), 'Kacper'), /przed poszukiwaniami/);
  const finished = transitionRoom(collecting, 'finish', 'Kuba');
  assert.equal(calculateCouponResults(finished)[0].balanceCents, 1000);
});

test('settlement includes the stake once, loses the whole accumulator on one missed leg and ignores unapproved harvests', () => {
  let state = placeCoupon(room(), slip('winning1', 2, { winner: 'Kuba', own: 'over10', total: 'under20', species: 'Borowik' }), 'Kuba');
  state = placeCoupon(state, slip('losing01', 3, { total: 'over20' }), 'Kuba');
  state = placeCoupon(state, slip('guest001', 10, { own: 'under10' }), 'Kacper');
  state.harvests = [harvest('Kuba', 12), harvest('Kacper', 8, 'Kurka'), harvest('Kacper', 900, 'Maślak', 'rejected'), harvest('Kuba', 400, 'Podgrzybek', 'pending')];
  assert.deepEqual(calculateCouponResults(state), []);
  const results = calculateCouponResults(completed(state));
  const own = results.find(row => row.member === 'Kuba');
  assert.equal(own.payoutCents, 11970);
  assert.equal(own.balanceCents, 12470);
  assert.equal(own.netCents, 11470);
  assert.equal(own.won, 1);
  assert.equal(own.slips[0].results.length, 4);
  assert.equal(own.slips[1].results[0].actual, 20);
  assert.equal(own.slips[1].payoutCents, 0);
  assert.equal(results[1].balanceCents, 1800);
});

test('all number lines resolve immediately on either side of their half-mushroom boundary', () => {
  for (const market of ['own', 'total']) for (const option of couponLines[market]) for (const actual of [option.line, option.line + 1]) {
    let state = placeCoupon(room(), slip('over0001', 1, { [market]: `over${option.line}` }), 'Kuba');
    state = placeCoupon(state, slip('under001', 1, { [market]: `under${option.line}` }), 'Kuba');
    state.harvests = [harvest('Kuba', actual)];
    const result = calculateCouponResults(completed(state)).find(row => row.member === 'Kuba');
    assert.equal(result.slips[0].won, actual > option.line);
    assert.equal(result.slips[1].won, actual <= option.line);
  }
});

test('ties qualify every tied winner and species; empty harvests do not invent either outcome', () => {
  let state = placeCoupon(room(), slip('tie00001', 1, { winner: 'Kacper', species: 'Kurka' }), 'Kuba');
  state.harvests = [harvest('Kuba', 12), harvest('Kacper', 12, 'Kurka')];
  const result = calculateCouponResults(completed(state)).find(row => row.member === 'Kuba');
  assert.equal(result.slips[0].won, true);
  assert.deepEqual(result.slips[0].results[0].actual, ['Kuba', 'Kacper']);
  state.harvests = [];
  assert.equal(calculateCouponResults(completed(state)).find(row => row.member === 'Kuba').slips[0].won, false);
  const empty = calculateCouponResults(completed(room()));
  assert.deepEqual(empty.map(row => row.place), [1, 1]);
});

test('coupon budgets, immutable receipts and readiness survive local storage; corrupted or forged ledgers reject', () => {
  let state = placeCoupon(room(), slip('stored01', 3, { own: 'under20' }), 'Kuba');
  state = finishCoupons(state, 'Kuba');
  state = finishCoupons(state, 'Kacper');
  const restored = decodeRooms(encodeRooms([state]))[0];
  assert.deepEqual(restored.couponBook, state.couponBook);
  assert.deepEqual(restored.readyIds, state.readyIds);
  assert.throws(() => encodeRooms([{ ...state, couponBook: { Kuba: { ...state.couponBook.Kuba, spent: 0 } } }]));
  assert.throws(() => encodeRooms([{ ...state, couponBook: { Kuba: { spent: 6, slips: [state.couponBook.Kuba.slips[0], state.couponBook.Kuba.slips[0]] } } }]));
  assert.throws(() => encodeRooms([{ ...state, gameMode: 'classic' }]));
  assert.throws(() => encodeRooms([{ ...state, couponVersion: 2 }]));
  assert.throws(() => encodeRooms([{ ...state, phase: 'collecting', readyIds: ['Kuba'] }]));
});
