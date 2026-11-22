import { mushroomSpecies } from './mushroom-species.ts';
import { mushroomTraitSources as sources } from './mushroom-trait-sources.ts';

export const traitQuestions = [
  { key: 'color', label: 'Kolor', title: 'Jaki ma kolor?', hint: 'Patrz na kapelusz lub cały owocnik. Możesz wybrać kilka kolorów.', options: [
    { id: 'white', label: 'Biały / kremowy', swatch: '#E8E0D0' }, { id: 'yellow', label: 'Żółty', swatch: '#D5B34D' },
    { id: 'orange', label: 'Pomarańczowy', swatch: '#C77B3D' }, { id: 'red', label: 'Czerwony / różowy', swatch: '#AD6265' },
    { id: 'brown', label: 'Brązowy', swatch: '#85634A' }, { id: 'gray', label: 'Szary', swatch: '#90918F' },
    { id: 'green', label: 'Zielony / oliwkowy', swatch: '#7D895A' }, { id: 'violet', label: 'Fioletowy', swatch: '#8B749B' },
    { id: 'black', label: 'Czarny', swatch: '#343434' },
  ] },
  { key: 'underside', label: 'Spód', title: 'Co widać pod kapeluszem?', hint: 'Obejrzyj spód. Jeśli nie ma kapelusza lub nie jesteś pewien, możesz pominąć ten krok.', options: [
    { id: 'tubes', label: 'Rurki / gąbka', detail: 'Drobne otworki, jak gąbka.' },
    { id: 'gills', label: 'Blaszki', detail: 'Cienkie płytki biegnące od trzonu.' },
    { id: 'folds', label: 'Listewki / fałdy', detail: 'Grubsze, tępe i często rozgałęzione żyłki.' },
    { id: 'spines', label: 'Kolce', detail: 'Zwieszające się spod kapelusza igiełki.' },
    { id: 'smooth', label: 'Brak tych struktur', detail: 'Gładki spód lub owocnik bez wyraźnego kapelusza.' },
  ] },
  { key: 'shape', label: 'Kształt', title: 'Jaki ma ogólny kształt?', hint: 'Kształt zmienia się z wiekiem. Zaznacz pasujące formy albo pomiń.', options: [
    { id: 'cap', label: 'Kapelusz na trzonie', detail: 'Typowy grzyb z nóżką.' },
    { id: 'funnel', label: 'Lejek / trąbka', detail: 'Kapelusz wyraźnie zagłębiony pośrodku.' },
    { id: 'shelf', label: 'Wachlarz / ucho', detail: 'Bocznie przyrośnięty, muszlowaty lub uszowaty.' },
    { id: 'ball', label: 'Kula / gruszka', detail: 'Kulisty albo maczugowaty owocnik bez kapelusza.' },
    { id: 'branched', label: 'Pofałdowany / rozgałęziony', detail: 'Przypomina kalafior lub skupisko falistych listków.' },
  ] },
  { key: 'habitat', label: 'Miejsce', title: 'Gdzie rósł?', hint: 'Wybierz podłoże, z którego wyrastał. Drewno i szyszki mogą być częściowo ukryte w ziemi.', options: [
    { id: 'forest', label: 'Na ziemi przy drzewach', detail: 'Las, zadrzewienie lub skraj lasu.' },
    { id: 'grass', label: 'Łąka / trawnik', detail: 'Trawiasty teren, pastwisko, polana lub park.' },
    { id: 'wood', label: 'Na drewnie / pniu', detail: 'Pień, korzeń, gałąź lub butwiejące drewno.' },
    { id: 'cone', label: 'Na szyszce', detail: 'Także na szyszce zagłębionej w ściółce.' },
  ] },
] as const;

export type TraitKey = typeof traitQuestions[number]['key'];
export type TraitSelection = Record<TraitKey, string[]>;
export type MushroomTraits = Record<TraitKey, readonly string[]> & { source: { label: string; url: `https://${string}` } };
export const emptyTraitSelection = (): TraitSelection => ({ color: [], underside: [], shape: [], habitat: [] });
export const hasTraitFilters = (selection: TraitSelection) => traitQuestions.some(question => selection[question.key].length > 0);
export const selectedTraitCount = (selection: TraitSelection) => traitQuestions.reduce((sum, question) => sum + selection[question.key].length, 0);

// Broad visible categories, including colour/age variants. These are atlas filters,
// not a diagnostic key. Each species has an explicit profile and a source link.
const profiles: Record<string, readonly [string, string, string, string]> = {
  'borowik': ['white yellow brown red', 'tubes', 'cap', 'forest'],
  'podgrzybek': ['brown red', 'tubes', 'cap', 'forest'],
  'maslak': ['brown orange', 'tubes', 'cap', 'forest'],
  'kurka': ['white yellow orange', 'folds', 'cap funnel', 'forest'],
  'borowik-usiatkowany': ['brown', 'tubes', 'cap', 'forest'],
  'krasnoborowik-ceglastopory': ['brown', 'tubes', 'cap', 'forest'],
  'podgrzybek-zajaczek': ['brown green yellow', 'tubes', 'cap', 'forest'],
  'podgrzybek-zlotawy': ['brown gray yellow red', 'tubes', 'cap', 'forest'],
  'maslak-pstry': ['yellow brown', 'tubes', 'cap', 'forest'],
  'maslak-sitarz': ['yellow orange brown', 'tubes', 'cap', 'forest'],
  'maslak-ziarnisty': ['yellow orange brown', 'tubes', 'cap', 'forest'],
  'maslak-zolty': ['yellow orange brown', 'tubes', 'cap', 'forest'],
  'kozlarz-babka': ['white brown gray black red', 'tubes', 'cap', 'forest grass'],
  'kozlarz-czerwony': ['orange red brown', 'tubes', 'cap', 'forest'],
  'kozlarz-pomaranczowozolty': ['white yellow orange brown', 'tubes', 'cap', 'forest'],
  'mleczaj-rydz': ['orange red green', 'gills', 'cap funnel', 'forest'],
  'czubajka-kania': ['white brown', 'gills', 'cap', 'forest grass'],
  'opienka-miodowa': ['yellow orange brown', 'gills', 'cap', 'forest wood'],
  'lejkowiec-dety': ['gray brown black', 'smooth', 'funnel', 'forest'],
  'golabek-zielonawofioletowy': ['violet green gray brown yellow red', 'gills', 'cap funnel', 'forest'],
  'boczniak-ostrygowaty': ['white brown gray', 'gills', 'shelf cap', 'wood'],
  'boczniak-lyzkowaty': ['white gray brown', 'gills', 'shelf cap', 'wood'],
  'borowik-sosnowy': ['red brown violet', 'tubes', 'cap', 'forest'],
  'kozlarek-grabowy': ['gray brown yellow', 'tubes', 'cap', 'forest'],
  'kozlarz-topolowy': ['gray brown', 'tubes', 'cap', 'forest'],
  'kozlarz-sosnowy': ['red orange brown', 'tubes', 'cap', 'forest'],
  'podgrzybek-czerwonawy': ['red brown green', 'tubes', 'cap', 'forest grass'],
  'podgrzybek-obcietozarodnikowy': ['brown gray green', 'tubes', 'cap', 'forest'],
  'maslak-wejmutkowy': ['white yellow brown', 'tubes', 'cap', 'forest'],
  'maslak-lepki': ['white gray brown yellow', 'tubes', 'cap', 'forest'],
  'golabek-wyborny': ['red brown yellow green violet', 'gills', 'cap funnel', 'forest'],
  'golabek-zielonawy': ['white green brown yellow', 'gills', 'cap funnel', 'forest'],
  'golabek-grynszpanowy': ['white green gray', 'gills', 'cap funnel', 'forest'],
  'golabek-oliwkowozielony': ['green yellow brown', 'gills', 'cap funnel', 'forest'],
  'mleczaj-swierkowy': ['orange yellow green', 'gills', 'cap funnel', 'forest'],
  'mleczaj-jodlowy': ['orange yellow red', 'gills', 'cap funnel', 'forest'],
  'mleczajowiec-smaczny': ['orange brown red', 'gills', 'cap funnel', 'forest'],
  'pieczarka-polna': ['white brown', 'gills', 'cap', 'grass'],
  'pieczarka-lesna': ['white brown red', 'gills', 'cap', 'forest'],
  'pieczarka-bialawa': ['white yellow brown', 'gills', 'cap', 'grass forest'],
  'twardzioszek-przydrozny': ['white yellow orange brown', 'gills', 'cap', 'grass forest'],
  'plachetka-zwyczajna': ['white yellow brown', 'gills', 'cap', 'forest'],
  'kolczak-oblaczasty': ['white yellow orange', 'spines', 'cap', 'forest'],
  'pieprznik-trabkowy': ['brown gray yellow', 'folds', 'cap funnel', 'forest'],
  'purchawka-chropowata': ['white yellow brown', 'smooth', 'ball', 'forest grass wood'],
  'siedzun-sosnowy': ['white yellow brown', 'smooth', 'branched', 'forest wood'],
  'czernidlak-kolpakowaty': ['white brown black', 'gills', 'cap', 'grass forest'],
  'gaska-nieksztaltna': ['gray brown yellow green violet', 'gills', 'cap', 'forest'],
  'gesnica-wiosenna': ['white yellow brown', 'gills', 'cap', 'grass forest'],
  'uszak-bzowy': ['brown red violet gray', 'smooth', 'shelf', 'wood'],
  'piaskowiec-kasztanowaty': ['brown orange', 'tubes', 'cap', 'forest'],
  'piaskowiec-modrzak': ['white yellow brown', 'tubes', 'cap', 'forest'],
  'borowik-ciemnobrazowy': ['brown black red', 'tubes', 'cap', 'forest'],
  'maslak-rdzawobrazowy': ['yellow brown orange', 'tubes', 'cap', 'forest'],
  'kozlarz-roznobarwny': ['white gray brown black yellow', 'tubes', 'cap', 'forest'],
  'kozlarz-swierkowy': ['red brown orange', 'tubes', 'cap', 'forest'],
  'kozlarz-bialotrzonowy': ['orange red brown', 'tubes', 'cap', 'forest'],
  'kozlarz-czarny': ['brown black', 'tubes', 'cap', 'forest'],
  'suchogrzybek-oproszony': ['brown violet', 'tubes', 'cap', 'forest'],
  'suchogrzybek-zmienny': ['brown gray yellow red', 'tubes', 'cap', 'forest'],
  'pieprznik-ametystowy': ['yellow orange violet', 'folds', 'cap funnel', 'forest'],
  'pieprznik-blady': ['white yellow', 'folds', 'cap funnel', 'forest'],
  'kolczak-rudawy': ['orange red brown', 'spines', 'cap', 'forest'],
  'opienka-ciemna': ['brown red yellow', 'gills', 'cap', 'forest wood'],
  'opienka-polnocna': ['orange brown yellow green', 'gills', 'cap', 'forest wood'],
  'opienka-cebulotrzonowa': ['brown yellow', 'gills', 'cap', 'forest wood'],
  'pieczarka-dwuzarodnikowa': ['white brown', 'gills', 'cap', 'grass'],
  'pieczarka-krwawiaca': ['brown red white', 'gills', 'cap', 'forest'],
  'pieczarka-miejska': ['white brown', 'gills', 'cap', 'grass'],
  'pieczarka-okazala': ['white brown yellow red', 'gills', 'cap', 'forest grass'],
  'pieczarka-drobnoluskowa': ['white brown', 'gills', 'cap', 'forest grass'],
  'golabek-blotny': ['red brown yellow violet', 'gills', 'cap funnel', 'forest'],
  'golabek-jasnozolty': ['yellow', 'gills', 'cap funnel', 'forest'],
  'golabek-slodkawy': ['brown red yellow violet green', 'gills', 'cap funnel', 'forest'],
  'golabek-sledziowy': ['red violet brown yellow', 'gills', 'cap funnel', 'forest'],
  'golabek-zlotawy': ['yellow orange red', 'gills', 'cap funnel', 'forest'],
  'golabek-zmiennobarwny': ['yellow orange red brown', 'gills', 'cap funnel', 'forest'],
  'golabek-brunatnofioletowy': ['brown violet green', 'gills', 'cap funnel', 'forest'],
  'golabek-ametystowy': ['violet brown red', 'gills', 'cap funnel', 'forest'],
  'golabek-fiolkowozielony': ['violet green yellow red brown', 'gills', 'cap funnel', 'forest'],
  'golabek-kunowy': ['brown yellow', 'gills', 'cap', 'forest'],
  'plomiennica-zimowa': ['yellow orange brown', 'gills', 'cap', 'wood'],
  'luskwiak-zmienny': ['yellow brown orange', 'gills', 'cap', 'wood'],
  'lakowka-ametystowa': ['violet white brown', 'gills', 'cap funnel', 'forest'],
  'lakowka-pospolita': ['brown orange red white yellow', 'gills', 'cap funnel', 'forest'],
  'klejek-czerwonawy': ['brown red orange', 'gills', 'cap funnel', 'forest'],
  'klejowka-swierkowa': ['gray violet brown', 'gills', 'cap funnel', 'forest'],
  'klejowka-rozowa': ['red orange', 'gills', 'cap', 'forest'],
  'maslanka-lagodna': ['yellow orange brown', 'gills', 'cap', 'forest wood'],
  'gasowka-fioletowawa': ['violet brown white', 'gills', 'cap funnel', 'forest grass'],
  'gasowka-dwubarwna': ['white brown', 'gills', 'cap funnel', 'grass forest'],
  'gaska-topolowa': ['brown red', 'gills', 'cap', 'forest grass'],
  'gaska-golebia': ['white', 'gills', 'cap', 'forest'],
  'kepkowiec-jasnobrazowy': ['gray brown', 'gills', 'cap', 'forest grass'],
  'czasznica-olbrzymia': ['white yellow brown', 'smooth', 'ball', 'grass forest'],
  'purchawka-workowata': ['white yellow brown gray', 'smooth', 'ball', 'forest grass'],
  'purchawka-oczkowana': ['white gray brown', 'smooth', 'ball', 'grass forest'],
  'purchawka-miekka': ['white brown yellow', 'smooth', 'ball', 'forest grass'],
  'wodnicha-pozna': ['brown green yellow', 'gills', 'cap funnel', 'forest'],
  'szyszkowka-swierkowa': ['white gray yellow brown', 'gills', 'cap', 'cone forest'],
};

export const mushroomTraits: Readonly<Record<string, MushroomTraits>> = Object.fromEntries(mushroomSpecies.map(species => {
  const row = profiles[species.id];
  const url = sources[species.id as keyof typeof sources];
  if (!row || !url) throw new Error(`Brak opisu cech: ${species.id}`);
  return [species.id, { color: row[0].split(' '), underside: row[1].split(' '), shape: row[2].split(' '), habitat: row[3].split(' '),
    source: { url, label: url.includes('first-nature.com') ? 'First Nature' : url.includes('mushroomexpert.com') ? 'MushroomExpert' : url.includes('boletales.com') ? 'Boletales' : 'Wikipedia' } }];
}));

/** OR within a feature, AND between features. Skipped features never exclude a species. */
export function matchesMushroomTraits(id: string, selection: TraitSelection): boolean {
  const traits = mushroomTraits[id];
  if (!traits) return false;
  return traitQuestions.every(question => !selection[question.key].length || selection[question.key].some(value => traits[question.key].includes(value)));
}

export function toggleTrait(selection: TraitSelection, key: TraitKey, value: string): TraitSelection {
  const question = traitQuestions.find(question => question.key === key)!;
  if (!question.options.some(option => option.id === value)) throw new Error('Nieznana cecha grzyba.');
  return { ...selection, [key]: selection[key].includes(value) ? selection[key].filter(item => item !== value) : [...selection[key], value] };
}

export function traitSelectionLabels(selection: TraitSelection): string[] {
  return traitQuestions.flatMap(question => question.options.filter(option => selection[question.key].includes(option.id)).map(option => option.label));
}

export const identificationNotice = 'To podpowiedzi z katalogu 100 gatunków. Wynik nie potwierdza jadalności; katalog nie obejmuje wszystkich grzybów ani trujących sobowtórów. Nie jedz grzyba na tej podstawie — pokaż go grzyboznawcy.';
export const identificationSafetySource = 'https://www.gov.pl/web/psse-tczew/grzyby-bez-ryzyka---najwazniejsze-zasady-bezpiecznego-grzybobrania';
