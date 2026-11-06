import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerQuestion, answeredCount, calculateResults, everyoneReady, isClosed, joinRoom,
  isReady, memberName, questionKeys, restartAnswers, reviewHarvest, saveTicket, statusLabel, submitHarvest, transitionRoom,
} from '../src/features/domain.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

const now = Date.parse('2026-10-31T12:00:00Z');
function room(overrides = {}) {
  return {
    id: 'test', name: 'Wyprawa', code: 'TEST01', date: '2026-11-01T12:00:00Z',
    limit: 4, members: ['Kuba', 'Kacper', 'Bartek'], host: 'Kuba', joined: true,
    closed: false, phase: 'lobby', tickets: {}, answers: {}, harvests: [], ...overrides,
  };
}
function harvest(overrides = {}) {
  return {
    id: 'h1', member: 'Kuba', species: 'Borowik', count: 10,
    photoUri: 'file:///harvest.jpg', note: '', createdAt: new Date(now).toISOString(),
    status: 'pending', ...overrides,
  };
}
const ticket = { winner: 'Kuba', own: 10, total: 10, species: 'Borowik' };
function fill(state, actor, values = ticket) {
  for (const key of questionKeys) state = answerQuestion(state, key, values[key], actor);
  return state;
}
function readyRoom() {
  let state = transitionRoom(room(), 'begin', 'Kuba', now);
  for (const member of state.members) state = saveTicket(fill(state, member), ticket, member);
  return state;
}

test('host starts questions, all participants finish, then host starts searches explicitly', () => {
  let state = room();
  assert.throws(() => saveTicket(state, ticket, 'Kuba'));
  assert.throws(() => answerQuestion(state, 'winner', 'Kuba', 'Kuba'));
  state = transitionRoom(state, 'begin', 'Kuba', now);
  assert.equal(state.phase, 'predicting');
  assert.throws(() => joinRoom(state, 'Ola'), /zamknięte/);
  for (const member of state.members) {
    assert.throws(() => transitionRoom(state, 'start', 'Kuba', now), /wszyscy/);
    state = saveTicket(fill(state, member), ticket, member);
  }
  assert.equal(state.phase, 'predicting');
  assert.equal(everyoneReady(state), true);
  assert.equal(statusLabel(state), 'Gotowi do poszukiwań');
  assert.throws(() => transitionRoom(state, 'start', 'Kacper', now), /organizatora/);
  state = transitionRoom(state, 'start', 'Kuba', now);
  assert.equal(state.phase, 'collecting');
  state = submitHarvest(state, harvest(), 'Kuba');
  assert.equal(calculateResults(state)[0].mushrooms, 0);
  assert.throws(() => transitionRoom(state, 'finish', 'Kuba', now), /oczekujące/);
  state = reviewHarvest(state, 'h1', 'approved', '', 'Kuba');
  state = transitionRoom(state, 'finish', 'Kuba', now);
  assert.equal(state.finishedAt, '2026-10-31T12:00:00.000Z');
  assert.equal(calculateResults(state).find(row => row.member === 'Kuba').points, 350);
  assert.throws(() => submitHarvest(state, harvest({ id: 'h2' }), 'Kuba'));
  assert.throws(() => saveTicket(state, ticket, 'Kuba'));
  assert.throws(() => transitionRoom(state, 'start', 'Kuba'));
});

test('only host controls stages, in the defined order', () => {
  assert.throws(() => transitionRoom(room(), 'begin', 'Kacper'), /organizatora/);
  assert.throws(() => transitionRoom(room(), 'start', 'Kuba'), /etapie/);
  assert.throws(() => transitionRoom(room(), 'finish', 'Kuba'), /etapie/);
  const started = transitionRoom(room(), 'begin', 'Kuba');
  assert.throws(() => transitionRoom(started, 'begin', 'Kuba'));
  assert.throws(() => transitionRoom(readyRoom(), 'begin', 'Kuba'));
});

test('room creation date does not start or close questions: organizer controls the flow', () => {
  const state = room({ date: new Date(now - 86400000).toISOString() });
  assert.equal(joinRoom(state, 'Mateusz').members.length, 4);
  assert.equal(isClosed(state), true);
  const started = transitionRoom(state, 'begin', 'Kuba');
  assert.equal(isClosed(started), false);
  assert.equal(answerQuestion(started, 'winner', 'Kuba', 'Kuba').answers.Kuba.winner, 'Kuba');
});

test('starting predictions records the host action time once and preserves the creation date and start time through storage and later stages', () => {
  const createdAt = new Date(now - 86400000).toISOString();
  const beganAt = new Date(now).toISOString();
  let state = room({ date: createdAt, members: ['Kuba'] });
  assert.equal(state.predictionStartedAt, undefined);
  state = transitionRoom(state, 'begin', 'Kuba', now);
  assert.equal(state.date, createdAt);
  assert.equal(state.predictionStartedAt, beganAt);
  assert.throws(() => transitionRoom(state, 'begin', 'Kuba', now + 60000));
  state = saveTicket(fill(state, 'Kuba'), ticket, 'Kuba');
  state = transitionRoom(state, 'start', 'Kuba', now + 60000);
  assert.equal(state.predictionStartedAt, beganAt);
  state = transitionRoom(state, 'finish', 'Kuba', now + 120000);
  const restored = decodeRooms(encodeRooms([state]))[0];
  assert.equal(restored.date, createdAt);
  assert.equal(restored.predictionStartedAt, beganAt);
  assert.equal(restored.finishedAt, new Date(now + 120000).toISOString());
});

test('join respects capacity and does not duplicate existing membership', () => {
  const state = joinRoom(room(), 'Mateusz');
  assert.equal(state.members.length, 4);
  assert.equal(joinRoom(state, 'Mateusz').members.length, 4);
  assert.throws(() => joinRoom(state, 'Ola'), /wolnych miejsc/);
});

test('questions follow a sequence, progress belongs to each participant and is immutable', () => {
  const original = transitionRoom(room(), 'begin', 'Kuba');
  assert.throws(() => answerQuestion(original, 'own', 10, 'Kuba'), /kolejności/);
  assert.throws(() => answerQuestion(original, 'winner', 'Kuba', 'Obcy'), /należysz/);
  const state = answerQuestion(original, 'winner', 'Kuba', 'Kuba');
  assert.deepEqual(original.answers, {});
  assert.equal(answeredCount(state, 'Kuba'), 1);
  assert.equal(answeredCount(state, 'Kacper'), 0);
  assert.throws(() => saveTicket(state, ticket, 'Kuba'), /cztery/);
  const finishedDraft = fill(original, 'Kuba');
  assert.equal(everyoneReady(finishedDraft), false); // summary is not confirmation
  const confirmed = saveTicket(finishedDraft, ticket, 'Kuba');
  assert.equal(confirmed.ticket, confirmed.tickets.Kuba);
  assert.equal(confirmed.answers.Kuba, undefined);
  assert.equal(answeredCount(confirmed, 'Kuba'), 4);
  assert.throws(() => answerQuestion(confirmed, 'winner', 'Kuba', 'Kuba'), /zatwierdzone/);
  assert.throws(() => saveTicket(confirmed, ticket, 'Kuba'), /zatwierdzone/);
  assert.throws(() => restartAnswers(confirmed, 'Kuba'), /zatwierdzone/);
});

test('draft can be restarted before confirmation and invalid answers do not advance', () => {
  const started = transitionRoom(room(), 'begin', 'Kuba');
  assert.throws(() => answerQuestion(started, 'winner', 'Obcy', 'Kuba'));
  let state = answerQuestion(started, 'winner', 'Kuba', 'Kuba');
  for (const value of [-1, 1.5, NaN, Infinity, 1000000, '10']) assert.throws(() => answerQuestion(state, 'own', value, 'Kuba'));
  state = answerQuestion(state, 'own', 10, 'Kuba');
  assert.throws(() => answerQuestion(state, 'total', 9, 'Kuba'));
  const reset = restartAnswers(state, 'Kuba');
  assert.equal(answeredCount(reset, 'Kuba'), 0);
  assert.equal(answeredCount(state, 'Kuba'), 2);
  state = answerQuestion(state, 'total', 10, 'Kuba');
  assert.throws(() => answerQuestion(state, 'species', 'Nieznany', 'Kuba'));
});

test('confirmation cannot substitute answers or bypass validation', () => {
  const draft = fill(transitionRoom(room(), 'begin', 'Kuba'), 'Kuba');
  assert.throws(() => saveTicket(draft, { ...ticket, own: 9 }, 'Kuba'), /cztery/);
  assert.throws(() => saveTicket(draft, ticket, 'Obcy'), /należysz/);
  const state = readyRoom();
  assert.equal(everyoneReady({ ...state, tickets: {} }), false);
  assert.equal(everyoneReady({ ...state, members: [] }), false);
});

test('harvest requires an open collection stage, membership and a photo', () => {
  assert.throws(() => submitHarvest(room(), harvest(), 'Kuba'));
  const state = room({ phase: 'collecting' });
  assert.throws(() => submitHarvest(state, harvest(), 'Ola'));
  assert.throws(() => submitHarvest(state, harvest({ member: 'Kacper' }), 'Kuba'));
  for (const bad of [
    { photoUri: ' ' }, { count: 0 }, { count: -3 }, { count: 1.5 },
    { count: 1000000 }, { species: 'Nieznany' }, { note: 'a'.repeat(301) },
    { createdAt: 'broken' }, { id: '' },
  ]) assert.throws(() => submitHarvest(state, harvest(bad), 'Kuba'));
});

test('submission always enters pending and duplicate identifiers cannot be reused', () => {
  const original = room({ phase: 'collecting' });
  const state = submitHarvest(original, harvest({ status: 'approved', rejectionReason: 'old' }), 'Kuba');
  assert.equal(original.harvests.length, 0);
  assert.equal(state.harvests[0].status, 'pending');
  assert.equal(state.harvests[0].rejectionReason, undefined);
  assert.throws(() => submitHarvest(state, harvest(), 'Kuba'));
});

test('review is host-only and each pending submission gets one decision', () => {
  const state = room({ phase: 'collecting', harvests: [harvest()] });
  assert.throws(() => reviewHarvest(state, 'h1', 'approved', '', 'Kacper'));
  assert.throws(() => reviewHarvest(state, 'h1', 'rejected', '   ', 'Kuba'), /powód/);
  const rejected = reviewHarvest(state, 'h1', 'rejected', '  Nieczytelne zdjęcie  ', 'Kuba');
  assert.equal(state.harvests[0].status, 'pending');
  assert.equal(rejected.harvests[0].rejectionReason, 'Nieczytelne zdjęcie');
  assert.throws(() => reviewHarvest(rejected, 'h1', 'approved', '', 'Kuba'));
  assert.throws(() => reviewHarvest(state, 'missing', 'approved', '', 'Kuba'));
});

test('pending and rejected harvests do not affect totals, winner or common species', () => {
  const state = room({
    tickets: { Kuba: ticket },
    harvests: [harvest({ status: 'approved' }),
      harvest({ id: 'h2', member: 'Kacper', count: 100, species: 'Kurka' }),
      harvest({ id: 'h3', member: 'Bartek', count: 100, species: 'Kurka', status: 'rejected' })],
  });
  assert.equal(calculateResults(state)[0].points, 350);
  assert.equal(calculateResults(state).find(row => row.member === 'Kacper')?.mushrooms, 0);
});

test('own-count scoring covers exact, 3, 5 and 6 mushroom differences', () => {
  for (const [own, expected] of [[10, 100], [7, 70], [13, 70], [5, 40], [15, 40], [4, 0], [16, 0]]) {
    const state = room({ tickets: { Kuba: { ...ticket, own, total: 20 } }, harvests: [harvest({ status: 'approved' })] });
    assert.equal(calculateResults(state).find(row => row.member === 'Kuba')?.breakdown.own, expected);
  }
});

test('tied winners and species are all eligible; ranking shares equal places', () => {
  const state = room({
    tickets: { Kuba: { ...ticket, total: 20 }, Kacper: { ...ticket, winner: 'Kacper', total: 20, species: 'Kurka' } },
    harvests: [harvest({ status: 'approved' }), harvest({ id: 'h2', member: 'Kacper', species: 'Kurka', status: 'approved' })],
  });
  assert.deepEqual(calculateResults(state).map(row => [row.member, row.points, row.place]), [
    ['Kuba', 350, 1], ['Kacper', 350, 1], ['Bartek', 0, 3],
  ]);
});

test('no harvest gives no winner or species points; zero numerical predictions still score', () => {
  const state = room({ tickets: { Kuba: { ...ticket, own: 0, total: 0 } } });
  assert.deepEqual(calculateResults(state)[0].breakdown, { winner: 0, own: 100, total: 100, species: 0 });
  assert.equal(calculateResults(room()).every(row => row.points === 0 && row.place === 1), true);
});

test('individual progress and complete lifecycle survive persistence', () => {
  const reload = state => decodeRooms(encodeRooms([state]))[0];
  let state = reload(room());
  state = reload(joinRoom(state, 'Ola'));
  state = reload(transitionRoom(state, 'begin', 'Kuba', now));
  for (const member of state.members) {
    for (const key of questionKeys) {
      state = reload(answerQuestion(state, key, ticket[key], member));
      assert.equal(answeredCount(state, member), questionKeys.indexOf(key) + 1);
    }
    assert.equal(state.phase, 'predicting');
    state = reload(saveTicket(state, ticket, member));
  }
  assert.equal(everyoneReady(state), true);
  state = reload(transitionRoom(state, 'start', 'Kuba', now));
  state = reload(submitHarvest(state, harvest(), 'Kuba'));
  state = reload(submitHarvest(state, harvest({ id: 'rejected' }), 'Kuba'));
  state = reload(reviewHarvest(state, 'h1', 'approved', '', 'Kuba'));
  state = reload(reviewHarvest(state, 'rejected', 'rejected', 'Nieczytelne zdjęcie', 'Kuba'));
  const beforeFinish = calculateResults(state);
  state = reload(transitionRoom(state, 'finish', 'Kuba', now));
  assert.deepEqual(calculateResults(state), beforeFinish);
  assert.equal(state.harvests[0].photoUri, 'file:///harvest.jpg');
  assert.equal(state.harvests[1].rejectionReason, 'Nieczytelne zdjęcie');
  assert.throws(() => submitHarvest(state, harvest({ id: 'h3' }), 'Kuba'));
});

test('public online readiness does not require reading private tickets', () => {
  const state = room({ readyIds: ['Kuba', 'Kacper', 'Bartek'], tickets: {} });
  assert.equal(everyoneReady(state), true);
  assert.equal(isReady(state, 'Kacper'), true);
  assert.equal(answeredCount(state, 'Kacper'), 4);
});

test('private answers take precedence over delayed public progress', () => {
  const state = room({ progress: { Kuba: 3, Kacper: 2 }, answers: { Kuba: { winner: 'Kuba' } } });
  assert.equal(answeredCount(state, 'Kuba'), 1);
  assert.equal(answeredCount(state, 'Kacper'), 2);
});

test('duplicate online nicknames remain distinguishable without changing participant identity', () => {
  const state = room({ members: ['uid-1111', 'uid-2222'], names: { 'uid-1111': 'Kuba', 'uid-2222': 'Kuba' } });
  assert.equal(memberName(state, 'uid-1111'), 'Kuba · 1111');
  assert.equal(memberName(state, 'uid-2222'), 'Kuba · 2222');
  assert.equal(memberName(room(), 'Kuba'), 'Kuba');
});
