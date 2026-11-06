import assert from 'node:assert/strict';
import test from 'node:test';
import { canDeleteAccount, deletionSecondsRemaining } from '../src/features/account-deletion.ts';

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
