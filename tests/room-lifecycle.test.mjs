import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerQuestion, cancelRoom, joinRoom, leaveLobby, questionKeys, saveTicket, species,
  transitionRoom,
} from '../src/features/domain.ts';
import { hasActiveTrips } from '../src/features/account-deletion.ts';
import { calculateCouponResults, finishCoupons, placeCoupon } from '../src/features/coupons.ts';
import { calculateGrzybdex } from '../src/features/grzybdex-stats.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

const host = 'Kacper';
const participant = 'Kuba';
const now = Date.parse('2026-11-22T12:00:00.000Z');
const prediction = { winner: participant, own: 4, total: 24, species: 'Borowik' };

function room(overrides = {}) {
  return { id: 'lifecycle', name: 'Wyprawa testowa', code: 'LIFE22', date: '2026-11-22T08:00:00.000Z',
    limit: 4, host, members: [host, participant, 'Ola'], joined: true, closed: false,
    phase: 'lobby', scoringVersion: 2, tickets: {}, answers: {}, harvests: [], ...overrides };
}

function harvest(id, member, count, status = 'approved', kind = 'Borowik') {
  return { id, member, count, status, species: kind, photoUri: `file:///photos/${id}.jpg`,
    note: 'Przy ścieżce', createdAt: '2026-11-22T10:00:00.000Z',
    ...(status === 'rejected' ? { rejectionReason: 'Nieczytelne zdjęcie' } : {}) };
}

function tripAt(phase, mode = 'classic') {
  let state = room(mode === 'coupons' ? { gameMode: 'coupons', couponVersion: 2, couponBook: {}, readyIds: [] } : {});
  if (phase === 'lobby') return state;
  state = transitionRoom(state, 'begin', host, now - 7_200_000);
  if (mode === 'coupons') {
    state = placeCoupon(state, { id: 'host-slip', stake: 2, picks: { winner: host } }, host);
    state = placeCoupon(state, { id: 'guest-slip', stake: 3, picks: { own: 'over5' } }, participant);
  } else {
    for (const member of state.members) {
      for (const key of questionKeys) state = answerQuestion(state, key, prediction[key], member);
      state = saveTicket(state, prediction, member);
    }
  }
  if (phase === 'predicting') return state;
  if (mode === 'coupons') for (const member of state.members) state = finishCoupons(state, member);
  state = transitionRoom(state, 'start', host, now - 3_600_000);
  return { ...state, harvests: [harvest('own-approved', participant, 4), harvest('host-approved', host, 20),
    harvest('own-pending', participant, 99, 'pending'), harvest('own-rejected', participant, 88, 'rejected')] };
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('the host can cancel each live phase without changing saved predictions, coupons, harvests or the input', () => {
  for (const mode of ['classic', 'coupons']) for (const phase of ['lobby', 'predicting', 'collecting']) {
    const original = freeze(tripAt(phase, mode));
    const before = structuredClone(original);
    const cancelled = cancelRoom(original, host, now);
    assert.notEqual(cancelled, original);
    assert.equal(cancelled.phase, 'cancelled');
    assert.equal(cancelled.closed, true);
    assert.equal(cancelled.finishedAt, new Date(now).toISOString());
    const { phase: _phase, closed: _closed, finishedAt: _finishedAt, ...retained } = cancelled;
    const { phase: _oldPhase, closed: _oldClosed, ...oldData } = before;
    assert.deepEqual(retained, oldData, `${mode}/${phase} must retain the full trip payload`);
    assert.deepEqual(original, before);
  }
});

test('participants and outsiders cannot cancel and neither finished nor cancelled trips can be cancelled again', () => {
  const original = freeze(tripAt('collecting'));
  const before = structuredClone(original);
  assert.throws(() => cancelRoom(original, participant, now), /organizatora/);
  assert.throws(() => cancelRoom(original, 'Obcy', now), /należysz/);
  assert.deepEqual(original, before);
  for (const terminal of [cancelRoom(original, host, now),
    { ...original, phase: 'finished', finishedAt: new Date(now).toISOString(), harvests: original.harvests.filter(item => item.status !== 'pending') }]) {
    const snapshot = structuredClone(terminal);
    freeze(terminal);
    assert.throws(() => cancelRoom(terminal, host, now + 1000), /zakończona lub anulowana/);
    for (const action of ['begin', 'start', 'finish']) assert.throws(() => transitionRoom(terminal, action, host, now + 1000));
    assert.deepEqual(terminal, snapshot);
  }
});

test('leaving a lobby removes only that participant and their private/profile state, then rejoining starts clean', () => {
  const original = freeze(room({ names: { [host]: 'Organizator', [participant]: 'Gość', Ola: 'Ola' },
    answers: { [participant]: { winner: host }, Ola: { winner: participant } },
    progress: { [host]: 0, [participant]: 2, Ola: 1 }, readyIds: [participant, 'Ola'] }));
  const before = structuredClone(original);
  const left = leaveLobby(original, participant);
  assert.deepEqual(left.members, [host, 'Ola']);
  assert.equal(left.joined, false);
  for (const field of ['tickets', 'answers', 'names', 'progress']) assert.equal(Object.hasOwn(left[field], participant), false, field);
  assert.equal(left.readyIds.includes(participant), false);
  assert.equal(left.ticket, undefined);
  assert.deepEqual(left.answers.Ola, before.answers.Ola);
  assert.equal(left.names.Ola, before.names.Ola);
  assert.equal(left.progress.Ola, before.progress.Ola);
  assert.deepEqual(left.readyIds, ['Ola']);
  assert.deepEqual(original, before);

  const rejoined = joinRoom(left, participant);
  assert.equal(rejoined.joined, true);
  assert.equal(rejoined.members.filter(member => member === participant).length, 1);
  assert.equal(rejoined.answers[participant], undefined);
  assert.equal(rejoined.tickets[participant], undefined);
  assert.equal(rejoined.progress[participant], undefined);
  assert.equal(rejoined.readyIds.includes(participant), false);
  assert.equal(rejoined.names[participant], undefined);
});

test('leaving clears a stale local ticket alias but preserves remaining members data and other players leave does not clear it', () => {
  const original = freeze(room({ ticket: prediction, tickets: { [participant]: prediction },
    names: { [participant]: 'Kuba', Ola: 'Ola' }, answers: { Ola: { winner: host } } }));
  const before = structuredClone(original);
  const left = leaveLobby(original, participant);
  assert.equal(left.ticket, undefined);
  assert.equal(left.tickets[participant], undefined);
  assert.deepEqual(left.answers.Ola, before.answers.Ola);
  const otherLeft = leaveLobby(original, 'Ola');
  assert.equal(otherLeft.joined, true);
  assert.deepEqual(otherLeft.ticket, prediction);
  assert.deepEqual(otherLeft.tickets[participant], prediction);
  assert.deepEqual(original, before);
});

test('hosts and outsiders cannot leave, and participants cannot leave after the lobby closes', () => {
  const lobby = freeze(room());
  assert.throws(() => leaveLobby(lobby, host), /Organizator/);
  assert.throws(() => leaveLobby(lobby, 'Obcy'), /należysz/);
  for (const phase of ['predicting', 'collecting', 'finished', 'cancelled']) {
    const original = freeze({ ...room(), phase, closed: true });
    const before = structuredClone(original);
    assert.throws(() => leaveLobby(original, participant), /przed rozpoczęciem/);
    assert.deepEqual(original, before);
  }
});

test('cancelled classic and coupon trips round-trip through storage including pending and approved harvests', () => {
  for (const mode of ['classic', 'coupons']) for (const phase of ['lobby', 'predicting', 'collecting']) {
    const cancelled = freeze(cancelRoom(tripAt(phase, mode), host, now));
    const before = structuredClone(cancelled);
    const restored = decodeRooms(encodeRooms([cancelled]))[0];
    assert.deepEqual(restored, before, `${mode}/${phase}`);
    assert.deepEqual(cancelled, before);
    assert.notEqual(restored, cancelled);
    assert.deepEqual(restored.harvests, cancelled.harvests);
    if (mode === 'coupons') {
      assert.deepEqual(restored.couponBook, cancelled.couponBook);
      assert.deepEqual(calculateCouponResults(restored), [], 'cancellation must not settle coupons');
    }
  }
});

test('storage rejects an open cancellation, a missing cancellation timestamp and invalid timestamps', () => {
  const cancelled = cancelRoom(room(), host, now);
  for (const changes of [{ closed: false }, { finishedAt: undefined }, { finishedAt: 'not-a-date' }]) {
    const invalid = { ...cancelled, ...changes };
    assert.throws(() => encodeRooms([invalid]), /uszkodzone/);
    assert.throws(() => decodeRooms(JSON.stringify({ version: 2, rooms: [invalid] })), /uszkodzone/);
  }
});

test('cancellation releases the active-trip account block for every member, while another live trip still blocks', () => {
  const original = tripAt('collecting');
  const cancelled = cancelRoom(original, host, now);
  for (const member of original.members) {
    assert.equal(hasActiveTrips([original], member), true);
    assert.equal(hasActiveTrips([cancelled], member), false);
    assert.equal(hasActiveTrips([cancelled, { ...room(), members: [member] }], member), true);
  }
  const left = leaveLobby(room(), participant);
  assert.equal(hasActiveTrips([left], participant), false);
  assert.equal(hasActiveTrips([left], host), true);
});

test('cancelling preserves own approved Grzybedex progress and records through reload without counting pending or rejected harvests', () => {
  const collecting = tripAt('collecting');
  const before = calculateGrzybdex([collecting], participant, species);
  const cancelled = freeze(cancelRoom(collecting, host, now));
  const restored = decodeRooms(encodeRooms([cancelled]));
  assert.deepEqual(calculateGrzybdex([cancelled], participant, species), before);
  assert.deepEqual(calculateGrzybdex(restored, participant, species), before);
  assert.deepEqual(before.find(item => item.species === 'Borowik'), { species: 'Borowik', total: 4, bestTrip: 4, trips: 1 });
  assert.equal(before.reduce((sum, item) => sum + item.total, 0), 4);
  assert.equal(calculateGrzybdex([cancelled], host, species).find(item => item.species === 'Borowik').total, 20);
});
