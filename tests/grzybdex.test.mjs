import assert from 'node:assert/strict';
import test from 'node:test';
import { badgeProgress, calculateGrzybdex, mushroomBadges } from '../src/features/grzybdex-stats.ts';
import { species } from '../src/features/domain.ts';

function harvest(overrides = {}) {
  return { id: 'h1', member: 'uid-kuba', species: 'Borowik', count: 8, photoUri: 'file:///test.jpg', note: '',
    createdAt: '2026-11-05T09:00:00Z', status: 'approved', ...overrides };
}
function room(overrides = {}) {
  return { id: 'r1', name: 'Wyprawa', code: 'TEST01', date: '2026-11-05T08:00:00Z', limit: 4,
    host: 'uid-kuba', members: ['uid-kuba', 'uid-ola'], joined: true, phase: 'finished', closed: true,
    tickets: {}, answers: {}, harvests: [], ...overrides };
}

test('grzybdex starts with one empty entry per available species and no badge', () => {
  assert.deepEqual(calculateGrzybdex([], 'uid-kuba', species), species.map(name => ({ species: name, total: 0, bestTrip: 0, trips: 0 })));
  assert.equal(badgeProgress(0).current, undefined);
  assert.equal(badgeProgress(0).next.name, 'Drewno');
  assert.equal(badgeProgress(0).remaining, 1);
  assert.equal(badgeProgress(0).percent, 0);
});

test('quantities add across trips and all same-species submissions count toward the trip record', () => {
  const rooms = [room({ harvests: [harvest(), harvest({ id: 'h2', count: 12 }), harvest({ id: 'h3', species: 'Kurka', count: 4 })] }),
    room({ id: 'r2', phase: 'collecting', harvests: [harvest({ count: 5 }), harvest({ id: 'h4', species: 'Kurka', count: 30 })] })];
  const before = structuredClone(rooms);
  const stats = calculateGrzybdex(rooms, 'uid-kuba', species);
  assert.deepEqual(stats.find(entry => entry.species === 'Borowik'), { species: 'Borowik', total: 25, bestTrip: 20, trips: 2 });
  assert.deepEqual(stats.find(entry => entry.species === 'Kurka'), { species: 'Kurka', total: 34, bestTrip: 30, trips: 2 });
  assert.deepEqual(calculateGrzybdex(rooms, 'uid-kuba', species), stats);
  assert.deepEqual(rooms, before);
});

test('only own approved quantities in joined collecting or finished rooms count', () => {
  const valid = room({ names: { 'uid-kuba': 'Ten sam nick', 'uid-ola': 'Ten sam nick' }, harvests: [
    harvest(), harvest({ member: 'uid-ola', count: 1000 }), harvest({ status: 'pending', count: 1000 }),
    harvest({ status: 'rejected', count: 1000 }), harvest({ species: 'Nieznany', count: 1000 }),
    harvest({ count: -1 }), harvest({ count: 0 }), harvest({ count: 1.5 }),
  ] });
  const ignored = [room({ id: 'unjoined', joined: false, harvests: [harvest({ count: 1000 })] }),
    room({ id: 'outsider', members: ['uid-ola'], harvests: [harvest({ count: 1000 })] }),
    ...['lobby', 'predicting'].map(phase => room({ id: phase, phase, harvests: [harvest({ count: 1000 })] }))];
  const stats = calculateGrzybdex([valid, ...ignored], 'uid-kuba', species);
  assert.deepEqual(stats[0], { species: 'Borowik', total: 8, bestTrip: 8, trips: 1 });
  assert.equal(stats.reduce((sum, item) => sum + item.total, 0), 8);
});

test('every badge unlocks exactly at its specified boundary, including the final title', () => {
  assert.deepEqual(mushroomBadges.map(badge => badge.threshold), [1, 10, 50, 100, 250, 1000]);
  for (const [index, badge] of mushroomBadges.entries()) {
    const before = badgeProgress(badge.threshold - 1);
    assert.equal(before.earned, index);
    assert.equal(before.next.id, badge.id);
    assert.equal(before.remaining, 1);
    for (const total of [badge.threshold, badge.threshold + 1]) {
      const after = badgeProgress(total);
      assert.equal(after.current.id, badge.id);
      assert.equal(after.earned, index + 1);
    }
  }
  assert.equal(badgeProgress(1000).current.name, 'Grzybiarz');
  assert.equal(badgeProgress(1000).next, undefined);
  assert.equal(badgeProgress(2000).remaining, 0);
  assert.equal(badgeProgress(2000).percent, 100);
});

test('review changes recompute totals, trip records and badges without retaining stale awards', () => {
  const state = room({ phase: 'collecting', harvests: [harvest({ count: 10, status: 'pending' })] });
  const stats = () => calculateGrzybdex([state], 'uid-kuba', species)[0];
  assert.equal(stats().total, 0);
  state.harvests[0].status = 'approved';
  assert.equal(stats().total, 10);
  assert.equal(badgeProgress(stats().total).current.name, 'Brąz');
  state.harvests[0].status = 'rejected';
  assert.deepEqual(stats(), { species: 'Borowik', total: 0, bestTrip: 0, trips: 0 });
  assert.equal(badgeProgress(stats().total).current, undefined);
});
