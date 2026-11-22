import assert from 'node:assert/strict';
import test from 'node:test';
import { mushroomSpecies } from '../src/features/mushroom-species.ts';
import { edibilityLabels, edibilityNotice, mushroomEdibility } from '../src/features/mushroom-edibility.ts';

test('all hundred species have an explicit, sourced edibility classification', () => {
  assert.equal(mushroomSpecies.length, 100);
  assert.deepEqual(Object.keys(mushroomEdibility).sort(), mushroomSpecies.map(item => item.id).sort());
  for (const species of mushroomSpecies) {
    const entry = mushroomEdibility[species.id];
    assert.ok(Object.hasOwn(edibilityLabels, entry.status), species.id);
    assert.ok(entry.source.label.trim(), species.id);
    assert.equal(new URL(entry.source.url).protocol, 'https:', species.id);
    if (entry.status !== 'edible') assert.ok(entry.note?.trim(), species.id);
  }
});

test('honey fungi and other cooking-dependent species cannot be presented as unconditionally edible', () => {
  for (const id of ['opienka-miodowa', 'opienka-ciemna', 'opienka-polnocna', 'opienka-cebulotrzonowa']) {
    assert.equal(mushroomEdibility[id].status, 'conditional');
    assert.match(mushroomEdibility[id].note, /Surowe.*trujące/);
    assert.match(mushroomEdibility[id].note, /odlania wody/);
  }
  for (const id of ['krasnoborowik-ceglastopory', 'gasowka-fioletowawa', 'gasowka-dwubarwna', 'plomiennica-zimowa']) {
    assert.equal(mushroomEdibility[id].status, 'conditional');
    assert.match(mushroomEdibility[id].note, /obrób/);
  }
});

test('puffballs and inkcaps retain the maturity restriction rather than receiving a plain edible badge', () => {
  for (const id of ['purchawka-chropowata', 'czasznica-olbrzymia', 'purchawka-workowata', 'purchawka-oczkowana', 'purchawka-miekka']) {
    assert.equal(mushroomEdibility[id].status, 'conditional');
    assert.match(mushroomEdibility[id].note, /młode.*białym wnętrzem/);
  }
  assert.equal(mushroomEdibility['czernidlak-kolpakowaty'].status, 'conditional');
  assert.match(mushroomEdibility['czernidlak-kolpakowaty'].note, /blaszki.*ciemnieć/);
});

test('disputed or missing information never defaults to edible or claims to identify a found specimen', () => {
  assert.equal(mushroomEdibility['golabek-grynszpanowy'].status, 'uncertain');
  assert.match(mushroomEdibility['golabek-grynszpanowy'].note, /Nie zaleca się/);
  assert.equal(mushroomEdibility['unknown-species'], undefined);
  assert.equal(mushroomEdibility['borowik'].status, 'edible');
  assert.equal(edibilityLabels.inedible, 'Niejadalny');
  assert.equal(edibilityLabels.poisonous, 'Trujący');
  assert.match(edibilityNotice, /nie potwierdzenie rozpoznania/);
  assert.match(edibilityNotice, /grzyboznawcy/);
});
