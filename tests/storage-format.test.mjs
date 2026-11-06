import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

function sample() {
  const ticket = { winner: 'Kuba', own: 12, total: 12, species: 'Borowik' };
  return {
    id: 'room-1', name: 'Wyprawa testowa', code: 'TEST01',
    date: '2026-10-31T08:00', limit: 8, members: ['Kuba', 'Kacper'], host: 'Kuba',
    joined: true, closed: true, phase: 'finished', ticket, tickets: { Kuba: ticket }, answers: {},
    finishedAt: '2026-10-31T14:00:00.000Z',
    harvests: [{
      id: 'harvest-1', member: 'Kuba', species: 'Borowik', count: 12,
      photoUri: 'file:///documents/grzybet/harvest-1.jpg', note: 'Przy ścieżce',
      createdAt: '2026-10-31T11:30:00.000Z', status: 'approved',
    }],
  };
}

function raw(rooms) { return JSON.stringify({ version: 2, rooms }); }

test('completed room and saved photo survive serialization without changing the input', () => {
  const original = sample();
  const before = structuredClone(original);
  const encoded = encodeRooms([original]);
  assert.equal(JSON.parse(encoded).version, 2);
  const restored = decodeRooms(encoded);
  assert.deepEqual(restored, [original]);
  assert.deepEqual(original, before);
  assert.notEqual(restored[0], original);
  assert.notEqual(restored[0].tickets, original.tickets);
});

test('empty list and web image data are valid saved states', () => {
  assert.deepEqual(decodeRooms(encodeRooms([])), []);
  const state = sample();
  state.harvests[0].photoUri = 'data:image/jpeg;base64,AA==';
  assert.deepEqual(decodeRooms(encodeRooms([state])), [state]);
});

test('prediction start time is optional for old trips and validated when recorded', () => {
  const old = sample();
  assert.equal(decodeRooms(encodeRooms([old]))[0].predictionStartedAt, undefined);
  const recorded = { ...old, predictionStartedAt: '2026-10-31T09:30:00.000Z' };
  assert.deepEqual(decodeRooms(encodeRooms([recorded])), [recorded]);
  assert.throws(() => decodeRooms(raw([{ ...old, predictionStartedAt: 'not-a-date' }])));
  assert.throws(() => decodeRooms(raw([{ ...recorded, phase: 'lobby', closed: false, ticket: undefined, tickets: {}, harvests: [], finishedAt: undefined }])));
});

test('broken JSON, missing schema and unknown versions report errors without recovery/reset', () => {
  for (const value of ['{', '', 'null', '[]', '{"version":1}', '{"version":3,"rooms":[]}']) {
    assert.throws(() => decodeRooms(value), /zapis|dane/i);
  }
});

test('room identity, membership, state and date invariants are checked', () => {
  const badValues = [
    { id: '' }, { name: '' }, { code: '' }, { host: 'Obcy' },
    { members: ['Kuba', 'Kuba'] }, { members: [] }, { joined: false },
    { limit: 1 }, { limit: 31 }, { closed: false }, { phase: 'unknown' },
    { date: '2026-02-30T08:00' }, { date: '2026-13-01T08:00' },
    { date: '2026-10-31T25:00' }, { finishedAt: undefined },
  ];
  for (const overrides of badValues) {
    assert.throws(() => decodeRooms(raw([{ ...sample(), ...overrides }])), undefined, JSON.stringify(overrides));
  }
  assert.throws(() => decodeRooms(raw([sample(), { ...sample(), code: 'TEST02' }])));
  assert.throws(() => decodeRooms(raw([sample(), { ...sample(), id: 'room-2' }])));
});

test('ticket numbers, members, species and compatibility alias cannot diverge', () => {
  const state = sample();
  for (const overrides of [{ own: -1 }, { own: 0.5 }, { total: 11 }, { total: 1_000_000 }, { winner: 'Obcy' }, { species: 'Nieznany' }]) {
    const changed = { ...state.ticket, ...overrides };
    assert.throws(() => decodeRooms(raw([{ ...state, ticket: changed, tickets: { Kuba: changed } }])));
  }
  assert.throws(() => decodeRooms(raw([{ ...state, ticket: { ...state.ticket, own: 10 } }])));
  assert.throws(() => decodeRooms(raw([{ ...state, tickets: { Kuba: state.ticket, Obcy: state.ticket } }])));
});

test('invalid harvests and unresolved finished rooms cannot be restored', () => {
  const state = sample();
  for (const overrides of [
    { id: '' }, { member: 'Obcy' }, { count: 0 }, { count: 1.5 },
    { count: 1_000_000 }, { species: 'Nieznany' }, { status: 'unknown' },
    { status: 'pending' }, { status: 'rejected' }, { photoUri: '' },
    { photoUri: 'blob:temporary' }, { photoUri: 'https://example.com/photo.jpg' },
    { note: 'a'.repeat(301) }, { createdAt: 'not-a-date' },
  ]) {
    assert.throws(() => decodeRooms(raw([{ ...state, harvests: [{ ...state.harvests[0], ...overrides }] }])));
  }
  assert.throws(() => decodeRooms(raw([{ ...state, harvests: [...state.harvests, ...state.harvests] }])));
  const rejected = { ...state.harvests[0], status: 'rejected', rejectionReason: 'Nieczytelne zdjęcie' };
  assert.equal(decodeRooms(raw([{ ...state, harvests: [rejected] }]))[0].harvests[0].rejectionReason, 'Nieczytelne zdjęcie');
});

test('encoder refuses an invalid state instead of replacing a good saved record with it', () => {
  const invalid = sample();
  invalid.harvests[0].count = NaN;
  assert.throws(() => encodeRooms([invalid]), /count/);
});


test('version one lobby tickets become drafts, locked rooms resume questions, history survives', () => {
  const old = sample();
  delete old.answers;
  const legacy = rooms => JSON.stringify({ version: 1, rooms });
  const done = decodeRooms(legacy([old]))[0];
  assert.deepEqual(done.harvests, old.harvests);
  assert.deepEqual(done.tickets, old.tickets);
  assert.deepEqual(done.answers, {});
  const base = { ...old, harvests: [], finishedAt: undefined };
  const locked = decodeRooms(legacy([{ ...base, phase: 'locked' }]))[0];
  assert.equal(locked.phase, 'predicting');
  assert.deepEqual(locked.tickets, old.tickets);
  const lobby = decodeRooms(legacy([{ ...base, phase: 'lobby', closed: false }]))[0];
  assert.deepEqual(lobby.tickets, {});
  assert.equal(lobby.ticket, undefined);
  assert.deepEqual(lobby.answers.Kuba, old.ticket);
  assert.deepEqual(decodeRooms(encodeRooms([lobby]))[0], lobby);
});

test('drafts must be sequential valid answers from room participants', () => {
  const base = { ...sample(), phase: 'predicting', harvests: [], finishedAt: undefined, tickets: {}, ticket: undefined };
  for (const answers of [
    { Kuba: { own: 5 } }, { Kuba: { winner: 'Kuba', species: 'Borowik' } },
    { Kuba: { winner: 'Obcy' } }, { Obcy: { winner: 'Kuba' } },
    { Kuba: { winner: 'Kuba', own: -1 } },
    { Kuba: { winner: 'Kuba', own: 12, total: 11 } },
    { Kuba: { winner: 'Kuba', extra: 1 } },
  ]) assert.throws(() => decodeRooms(raw([{ ...base, answers }])));
  const answers = { Kuba: { winner: 'Kuba', own: 12 } };
  assert.deepEqual(decodeRooms(raw([{ ...base, answers }]))[0].answers, answers);
});
