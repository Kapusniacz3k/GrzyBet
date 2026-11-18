import assert from 'node:assert/strict';
import test from 'node:test';
import { homeSummary } from '../src/features/home-summary.ts';

const user = 'uid-first';
const other = 'uid-second';
const harvest = (member, count, status = 'approved') => ({ id: `${member}-${status}`, member, species: 'Borowik', count,
  status, photoUri: 'file:///harvest.jpg', note: '', createdAt: '2026-11-15T10:00:00Z' });
function room(overrides = {}) {
  return { id: 'trip', name: 'Wyprawa', code: 'TEST44', date: '2026-11-15T08:00:00Z', limit: 2,
    host: user, members: [user, other], joined: true, closed: false, phase: 'lobby',
    tickets: {}, answers: {}, harvests: [], ...overrides };
}

test('home selects the newest own active trip and last finished trip without changing the room order', () => {
  const activeOld = room({ id: 'old', date: '2026-11-12T08:00:00Z' });
  const activeNew = room({ id: 'new' });
  const finishedLate = room({ id: 'late', phase: 'finished', finishedAt: '2026-11-16T12:00:00Z' });
  const finishedEarly = room({ id: 'early', phase: 'finished', finishedAt: '2026-11-14T12:00:00Z' });
  const notJoined = room({ id: 'not-joined', joined: false, date: '2026-11-18T08:00:00Z' });
  const wrongAccount = room({ id: 'wrong-account', members: [other], date: '2026-11-19T08:00:00Z' });
  const rooms = [activeNew, finishedLate, wrongAccount, activeOld, finishedEarly, notJoined];
  const originalOrder = rooms.map(item => item.id);
  const summary = homeSummary(rooms, user);
  assert.equal(summary.active.id, 'new');
  assert.equal(summary.recent.room.id, 'late');
  assert.deepEqual(rooms.map(item => item.id), originalOrder);
  assert.deepEqual(homeSummary(rooms, 'another-account'), { active: undefined });
});

test('live rooms and an empty history cannot leak a premature result preview', () => {
  for (const phase of ['lobby', 'predicting', 'collecting']) {
    const live = room({ phase, harvests: [harvest(user, 25)] });
    assert.equal(homeSummary([live], user).recent, undefined);
  }
  assert.deepEqual(homeSummary([], user), { active: undefined });
});

test('classic history counts only the current account approved harvests and keeps prediction points', () => {
  const finished = room({ phase: 'finished', closed: true, scoringVersion: 2, finishedAt: '2026-11-15T12:00:00Z',
    tickets: { [user]: { winner: user, own: 4, total: 7, species: 'Borowik' } },
    harvests: [harvest(user, 4), harvest(other, 3), harvest(user, 99, 'pending'), harvest(user, 80, 'rejected')],
  });
  const summary = homeSummary([finished], user);
  assert.equal(summary.active, undefined);
  assert.equal(summary.recent.mushrooms, 4);
  assert.deepEqual(summary.recent.result, { kind: 'points', points: 350 });
});

test('coupon history uses the final balance in hundredths rather than classic points', () => {
  const finished = room({ phase: 'finished', closed: true, gameMode: 'coupons', couponVersion: 2,
    finishedAt: '2026-11-15T12:00:00Z', harvests: [harvest(user, 4), harvest(other, 3)],
    couponBook: { [user]: { spent: 2, slips: [{ id: 'slip0001', stake: 2, picks: { winner: user } }] } },
  });
  const summary = homeSummary([finished], user);
  assert.equal(summary.recent.mushrooms, 4);
  assert.deepEqual(summary.recent.result, { kind: 'balance', balanceCents: 1160 });
});
