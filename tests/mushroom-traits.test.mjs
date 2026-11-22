import assert from 'node:assert/strict';
import test from 'node:test';
import { mushroomSpecies, searchSpecies } from '../src/features/mushroom-species.ts';
import { emptyTraitSelection, hasTraitFilters, matchesMushroomTraits, mushroomTraits, selectedTraitCount, toggleTrait, traitQuestions, traitSelectionLabels } from '../src/features/mushroom-traits.ts';

const matches = selection => mushroomSpecies.filter(species => matchesMushroomTraits(species.id, { ...emptyTraitSelection(), ...selection })).map(species => species.id);

test('every catalog species has a complete sourced trait profile using only supported options', () => {
  assert.equal(Object.keys(mushroomTraits).length, 100);
  assert.deepEqual(Object.keys(mushroomTraits).sort(), mushroomSpecies.map(item => item.id).sort());
  for (const species of mushroomSpecies) {
    const traits = mushroomTraits[species.id];
    assert.ok(traits.source.label); assert.ok(traits.source.url.startsWith('https://'));
    for (const question of traitQuestions) {
      const values = traits[question.key]; assert.ok(values.length, `${species.id}: ${question.key}`);
      assert.equal(new Set(values).size, values.length);
      assert.ok(values.every(value => question.options.some(option => option.id === value)), `${species.id}: invalid ${question.key}`);
    }
  }
});

test('skipping all steps returns all hundred species, including undiscovered ones, without changing their collection stats', () => {
  const empty = emptyTraitSelection();
  assert.equal(hasTraitFilters(empty), false); assert.equal(selectedTraitCount(empty), 0);
  assert.equal(matches(empty).length, 100);
  assert.equal(matchesMushroomTraits('unknown-species', empty), false);
  assert.deepEqual(traitSelectionLabels(empty), []);
});

test('feature combinations narrow chanterelles, spine mushrooms, puffballs and wood-growing shelves correctly', () => {
  assert.deepEqual(matches({ color: ['orange'], underside: ['folds'], shape: ['funnel'], habitat: ['forest'] }), ['kurka', 'pieprznik-ametystowy']);
  assert.deepEqual(matches({ underside: ['spines'] }), ['kolczak-oblaczasty', 'kolczak-rudawy']);
  assert.deepEqual(matches({ color: ['white'], shape: ['ball'] }), ['purchawka-chropowata', 'czasznica-olbrzymia', 'purchawka-workowata', 'purchawka-oczkowana', 'purchawka-miekka']);
  assert.deepEqual(matches({ underside: ['gills'], shape: ['shelf'], habitat: ['wood'] }), ['boczniak-ostrygowaty', 'boczniak-lyzkowaty']);
  assert.deepEqual(matches({ shape: ['branched'] }), ['siedzun-sosnowy']);
  assert.deepEqual(matches({ habitat: ['cone'] }), ['szyszkowka-swierkowa']);
});

test('multiple colours are alternatives while different features intersect, and impossible observations return no forced answer', () => {
  const brown = matches({ color: ['brown'] }); const violet = matches({ color: ['violet'] });
  assert.deepEqual(matches({ color: ['brown', 'violet'] }).sort(), [...new Set([...brown, ...violet])].sort());
  assert.ok(matches({ color: ['brown'], underside: ['tubes'] }).includes('borowik'));
  assert.ok(!matches({ color: ['brown'], underside: ['tubes'] }).includes('pieczarka-lesna'));
  assert.deepEqual(matches({ underside: ['tubes'], shape: ['ball'] }), []);
  assert.deepEqual(matches({ color: ['violet'], underside: ['spines'] }), []);
});

test('toggle, back/edit and reset operate on isolated selections and preserve the previous applied filter', () => {
  const initial = emptyTraitSelection(); Object.values(initial).forEach(Object.freeze); Object.freeze(initial);
  const first = toggleTrait(initial, 'color', 'brown'); const second = toggleTrait(first, 'underside', 'tubes');
  assert.equal(selectedTraitCount(second), 2); assert.equal(hasTraitFilters(second), true);
  assert.deepEqual(initial, emptyTraitSelection()); assert.deepEqual(first.underside, []);
  const third = toggleTrait(second, 'color', 'brown'); assert.deepEqual(third.color, []); assert.deepEqual(third.underside, ['tubes']);
  assert.deepEqual(traitSelectionLabels(second), ['Brązowy', 'Rurki / gąbka']);
  assert.throws(() => toggleTrait(initial, 'color', 'nonexistent'), /Nieznana/);
  assert.equal(matches(emptyTraitSelection()).length, 100);
});

test('traits combine with name and alias search without changing search data or awarding discovery', () => {
  const selection = { ...emptyTraitSelection(), color: ['brown'], underside: ['tubes'] };
  assert.deepEqual(searchSpecies('prawdziwek').filter(item => matchesMushroomTraits(item.id, selection)).map(item => item.id), ['borowik', 'borowik-sosnowy']);
  assert.deepEqual(searchSpecies('kania').filter(item => matchesMushroomTraits(item.id, selection)), []);
  assert.ok(matchesMushroomTraits('lakowka-ametystowa', { ...emptyTraitSelection(), color: ['white'] }), 'allow faded caps as well as violet caps');
  assert.ok(matchesMushroomTraits('golabek-zielonawofioletowy', { ...emptyTraitSelection(), color: ['green', 'violet'] }));
});
