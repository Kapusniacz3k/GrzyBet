import assert from 'node:assert/strict';
import test from 'node:test';
import { canDeleteAccount, deletionSecondsRemaining, hasActiveTrips } from '../src/features/account-deletion.ts';

test('confirmation never permits deleting before five complete seconds', () => {
  const openedAt = 10000;
  assert.equal(deletionSecondsRemaining(openedAt, openedAt), 5);
  assert.equal(deletionSecondsRemaining(openedAt, openedAt + 1000), 4);
  assert.equal(deletionSecondsRemaining(openedAt, openedAt + 4999), 1);
  assert.equal(canDeleteAccount(openedAt, openedAt + 4999, true, false), false);
  assert.equal(deletionSecondsRemaining(openedAt, openedAt + 5000), 0);
  assert.equal(canDeleteAccount(openedAt, openedAt + 5000, true, false), true);
});

test('waiting alone and confirmation alone cannot delete, and an in-flight deletion cannot repeat', () => {
  assert.equal(canDeleteAccount(1000, 9000, false, false), false);
  assert.equal(canDeleteAccount(1000, 2000, true, false), false);
  assert.equal(canDeleteAccount(1000, 9000, true, true), false);
  assert.equal(canDeleteAccount(1000, 9000, true, false), true);
  assert.equal(canDeleteAccount(1000, 9000, false, false), false);
  assert.equal(canDeleteAccount(NaN, 9000, true, false), false);
});

test('a reopened confirmation uses a fresh deadline', () => {
  assert.equal(canDeleteAccount(0, 9000, true, false), true);
  assert.equal(deletionSecondsRemaining(9000, 9000), 5);
  assert.equal(canDeleteAccount(9000, 9000, true, false), false);
  assert.equal(canDeleteAccount(9000, 14000, false, false), false);
});

test('every active phase blocks removal for both host and ordinary participant', () => {
  for (const phase of ['lobby', 'predicting', 'collecting']) {
    const room = { phase, members: ['host', 'guest'], host: 'host', joined: false };
    assert.equal(hasActiveTrips([room], 'host'), true, `host in ${phase}`);
    assert.equal(hasActiveTrips([room], 'guest'), true, `participant in ${phase}`);
  }
});

test('finished history and unrelated active trips do not block removal', () => {
  const history = { phase: 'finished', members: ['host', 'guest'], host: 'host', joined: true };
  const unrelated = { phase: 'lobby', members: ['someone-else'], host: 'someone-else', joined: true };
  assert.equal(hasActiveTrips([], 'guest'), false);
  assert.equal(hasActiveTrips([history, unrelated], 'host'), false);
  assert.equal(hasActiveTrips([history, unrelated], 'guest'), false);
  assert.equal(hasActiveTrips([history, unrelated, { phase: 'collecting', members: ['guest'] }], 'guest'), true);
});
