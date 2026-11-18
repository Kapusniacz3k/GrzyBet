import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mushroomSpecies, searchSpecies, species, speciesLabel } from '../src/features/mushroom-species.ts';
import { calculateResults } from '../src/features/domain.ts';
import { decodeRooms, encodeRooms } from '../src/features/storage-format.ts';
import { calculateGrzybdex } from '../src/features/grzybdex-stats.ts';

test('exactly fifty unique species share the same cloud validation and local photo catalog', () => {
  assert.equal(species.length, 50);
  assert.equal(new Set(species).size, 50);
  assert.equal(new Set(mushroomSpecies.map(item => item.id)).size, 50);
  assert.deepEqual(species.slice(0, 4), ['Borowik', 'Podgrzybek', 'Maślak', 'Kurka']);
  const rules = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');
  const values = [...rules.match(/function species\(s\) \{([\s\S]+?)\}/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(values, species);
  const credits = JSON.parse(readFileSync(new URL('../assets/images/grzybdex/photos.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(credits), mushroomSpecies.map(item => item.id));
  const catalog = readFileSync(new URL('../src/features/grzybdex-catalog.ts', import.meta.url), 'utf8');
  const bundledPhotos = [...catalog.matchAll(/require\('\.\.\/\.\.\/assets\/images\/grzybdex\/([^']+)\.jpg'\)/g)].map(match => match[1]);
  assert.deepEqual(bundledPhotos, mushroomSpecies.map(item => item.id));
  for (const item of mushroomSpecies) {
    const photo = readFileSync(new URL(`../assets/images/grzybdex/${item.id}.jpg`, import.meta.url));
    assert.equal(photo.readUInt16BE(0), 0xffd8, item.id);
    assert.ok(credits[item.id].author && credits[item.id].license && credits[item.id].licenseUrl && item.note);
    assert.ok(credits[item.id].source.startsWith('https://') && credits[item.id].licenseUrl.startsWith('https://'));
    if (item.noteSource) assert.ok(item.noteSource.label && item.noteSource.url.startsWith('https://'));
  }
});

test('search accepts Polish accents, their unaccented forms, common names and scientific names', () => {
  for (const query of ['koźlarz', 'kozlarz', ' KOZLARZ ']) assert.equal(searchSpecies(query).length, 6);
  for (const query of ['prawdziwek', 'borowik szlachetny', 'Boletus edulis']) assert.equal(searchSpecies(query)[0].name, 'Borowik');
  assert.equal(searchSpecies('kurka')[0].name, 'Kurka');
  assert.equal(searchSpecies('maslak modrzewiowy')[0].name, 'Maślak żółty');
  assert.equal(searchSpecies('kozlarz pomaranczowozolty')[0].name, 'Koźlarz pomarańczowożółty');
  assert.equal(searchSpecies('golabek modrozolty')[0].name, 'Gołąbek zielonawofioletowy');
  for (const [query, name] of [
    ['kozia broda', 'Siedzuń sosnowy'], ['ucho judaszowe', 'Uszak bzowy'],
    ['PLEUROTUS PULMONARIUS', 'Boczniak łyżkowaty'], ['golabek zielonawy', 'Gołąbek zielonawy'],
    ['podgrzybek obcietozarodnikowy', 'Podgrzybek obciętozarodnikowy'], ['majowka', 'Gęśnica wiosenna'],
  ]) assert.equal(searchSpecies(query)[0].name, name);
  assert.equal(searchSpecies('').length, 50);
  assert.deepEqual(searchSpecies('nieistniejący grzyb'), []);
  assert.equal(speciesLabel('Borowik'), 'Borowik szlachetny');
  assert.equal(speciesLabel('Nieznany'), 'Nieznany');
});

test('all species survive persistence and participate in scoring, including tied most-common species', () => {
  const ticket = { winner: 'Kuba', own: species.length, total: species.length, species: species.at(-1) };
  const room = { id: 'catalog', name: 'Pełny koszyk', code: 'ABC123', date: '2026-11-05T08:00:00Z', limit: 2,
    host: 'Kuba', members: ['Kuba'], joined: true, closed: true, phase: 'finished',
    finishedAt: '2026-11-05T12:00:00Z', ticket, tickets: { Kuba: ticket }, answers: {},
    harvests: species.map((name, index) => ({ id: `h${index}`, species: name, member: 'Kuba', count: 1,
      status: 'approved', photoUri: 'file:///mushroom.jpg', createdAt: '2026-11-05T10:00:00Z', note: '' })),
  };
  const restored = decodeRooms(encodeRooms([room]))[0];
  assert.deepEqual(restored.harvests.map(item => item.species), species);
  assert.equal(calculateResults(restored)[0].points, 350);
  assert.deepEqual(calculateGrzybdex([restored], 'Kuba', species), species.map(name => ({
    species: name, total: 1, bestTrip: 1, trips: 1,
  })));
});
