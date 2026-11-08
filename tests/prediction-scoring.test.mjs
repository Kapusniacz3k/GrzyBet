import assert from 'node:assert/strict';
import test from 'node:test';
import { answerQuestion, calculateResults, questionKeys, saveTicket } from '../src/features/domain.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';

const ticket = { winner: 'Kuba', own: 12, total: 20, species: 'Borowik' };
function room(ownTicket = ticket) {
  return { id: 'score', name: 'Nowa punktacja', code: 'SCORE1', date: '2026-11-08T09:00:00.000Z', scoringVersion: 2,
    limit: 2, members: ['Kuba', 'Kacper'], host: 'Kuba', joined: true, closed: true, phase: 'finished',
    finishedAt: '2026-11-08T12:00:00.000Z', answers: {}, ticket: ownTicket, tickets: { Kuba: ownTicket },
    harvests: [
      { id: 'one', member: 'Kuba', species: 'Borowik', count: 12, status: 'approved', photoUri: 'file:///one.jpg', note: '', createdAt: '2026-11-08T10:00:00.000Z' },
      { id: 'two', member: 'Kacper', species: 'Kurka', count: 8, status: 'approved', photoUri: 'file:///two.jpg', note: '', createdAt: '2026-11-08T10:00:00.000Z' },
    ] };
}
const ownResult = state => calculateResults(state).find(row => row.member === 'Kuba');

test('own count stops scoring beyond five while team count still scores up to ten in either direction', () => {
  const ownScale = [100, 80, 60, 40, 30, 20, 0, 0, 0, 0, 0, 0];
  const teamScale = [100, 80, 60, 40, 30, 20, 10, 10, 10, 10, 10, 0];
  for (const [difference, expected] of ownScale.entries()) {
    for (const sign of [-1, 1]) {
      assert.equal(ownResult(room({ ...ticket, own: 12 + sign * difference, total: 100 })).breakdown.own, expected);
      assert.equal(ownResult(room({ ...ticket, own: 0, total: 20 + sign * difference })).breakdown.total, teamScale[difference]);
    }
  }
});

test('one boost doubles only the selected answer, including partial points and a failed prediction', () => {
  for (const key of questionKeys) {
    const result = ownResult(room({ ...ticket, boost: key }));
    assert.equal(result.points, key === 'species' ? 400 : 450);
    assert.equal(result.predictions.filter(item => item.multiplier === 2).length, 1);
    assert.equal(result.predictions.find(item => item.key === key).points, key === 'species' ? 100 : 200);
    assert.equal(result.points, Object.values(result.breakdown).reduce((sum, points) => sum + points, 0));
  }
  const result = ownResult(room({ ...ticket, total: 25, boost: 'total' }));
  assert.equal(result.breakdown.total, 40);
  assert.deepEqual(result.predictions.find(item => item.key === 'total'), { key: 'total', predicted: 25, actual: 20, difference: 5, basePoints: 20, multiplier: 2, points: 40 });
  assert.equal(ownResult(room({ ...ticket, total: 1000, boost: 'total' })).breakdown.total, 0);
  for (const sign of [-1, 1]) {
    const close = ownResult(room({ ...ticket, own: 12 + sign * 5, boost: 'own' }));
    assert.equal(close.breakdown.own, 40);
    const distant = ownResult(room({ ...ticket, own: 12 + sign * 6, boost: 'own' }));
    assert.deepEqual(distant.predictions.find(item => item.key === 'own'), { key: 'own', predicted: 12 + sign * 6, actual: 12, difference: 6, basePoints: 0, multiplier: 2, points: 0 });
    assert.equal(ownResult(room({ ...ticket, total: 20 + sign * 6, boost: 'total' })).breakdown.total, 20);
  }
});

test('zero harvests do not invent a winner or species, and ties appear in the receipt', () => {
  const empty = { ...room({ ...ticket, own: 0, total: 0, boost: 'winner' }), harvests: [] };
  assert.equal(ownResult(empty).points, 200);
  assert.deepEqual(ownResult(empty).predictions.find(item => item.key === 'winner').actual, []);
  const tied = room();
  tied.harvests[1].count = 12;
  const result = ownResult(tied);
  assert.deepEqual(result.predictions.find(item => item.key === 'winner').actual, ['Kuba', 'Kacper']);
  assert.deepEqual(result.predictions.find(item => item.key === 'species').actual, ['Borowik', 'Kurka']);
});

test('a boost is validated, stored once and immutable together with the four answers', () => {
  let state = { ...room(), phase: 'predicting', tickets: {}, ticket: undefined, answers: {}, harvests: [], finishedAt: undefined };
  for (const key of questionKeys) state = answerQuestion(state, key, ticket[key], 'Kuba');
  for (const boost of ['unknown', ['own', 'total'], 2, null]) assert.throws(() => saveTicket(state, { ...ticket, boost }, 'Kuba'), /pewniaka/);
  assert.throws(() => saveTicket(state, { ...ticket, boost: 'total', multiplier: 9 }, 'Kuba'), /nieznane pola/);
  const saved = saveTicket(state, { ...ticket, boost: 'total' }, 'Kuba');
  assert.equal(saved.tickets.Kuba.boost, 'total');
  assert.throws(() => saveTicket(saved, { ...ticket, boost: 'own' }, 'Kuba'), /zatwierdzone/);
  assert.equal(state.tickets.Kuba, undefined);
});

test('saved boosts survive restoration while older trips retain their original scoring', () => {
  const modern = room({ ...ticket, own: 9, total: 23, boost: 'own' });
  const restored = decodeRooms(encodeRooms([modern]))[0];
  assert.equal(restored.scoringVersion, 2);
  assert.equal(restored.ticket.boost, 'own');
  assert.deepEqual(calculateResults(restored), calculateResults(modern));
  assert.equal(ownResult(restored).points, 270);
  const legacy = room({ ...ticket, own: 9, total: 23 });
  delete legacy.scoringVersion;
  assert.equal(ownResult(decodeRooms(encodeRooms([legacy]))[0]).points, 220);
  assert.throws(() => encodeRooms([{ ...modern, scoringVersion: 3 }]));
  assert.throws(() => encodeRooms([{ ...modern, scoringVersion: undefined }]));
});
