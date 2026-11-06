export const mushroomAtlasSource = 'https://www.lasy.gov.pl/pl/informacje/publikacje/do-poczytania/grzyby-polskich-lasow/grzyby-polskich-lasow_internet-1.pdf';

type MushroomSpecies = {
  id: string;
  /** The first four keys are kept for existing tickets and harvests. */
  name: string;
  label: string;
  scientificName: string;
  aliases: string[];
  note: string;
};

export const mushroomSpecies: readonly MushroomSpecies[] = [
  { id: 'borowik', name: 'Borowik', label: 'Borowik szlachetny', scientificName: 'Boletus edulis', aliases: ['prawdziwek'],
    note: 'Współżyje z korzeniami drzew. Rośnie pojedynczo lub w niewielkich grupach.' },
  { id: 'podgrzybek', name: 'Podgrzybek', label: 'Podgrzybek brunatny', scientificName: 'Imleria badia', aliases: ['czarny łepek'],
    note: 'Częsty mieszkaniec lasów iglastych, spotykany pod sosnami i świerkami.' },
  { id: 'maslak', name: 'Maślak', label: 'Maślak zwyczajny', scientificName: 'Suillus luteus', aliases: ['maślak sosnowy'],
    note: 'Związany z sosnami. Często pojawia się w grupach.' },
  { id: 'kurka', name: 'Kurka', label: 'Pieprznik jadalny (kurka)', scientificName: 'Cantharellus cibarius', aliases: ['kurka', 'kurki', 'liszka'],
    note: 'Rośnie zarówno w lasach iglastych, jak i liściastych, często gromadnie.' },
  { id: 'borowik-usiatkowany', name: 'Borowik usiatkowany', label: 'Borowik usiatkowany', scientificName: 'Boletus reticulatus', aliases: ['borowik letni'],
    note: 'Rośnie głównie pod dębami i bukami, zwłaszcza w lasach nizinnych.' },
  { id: 'krasnoborowik-ceglastopory', name: 'Krasnoborowik ceglastopory', label: 'Krasnoborowik ceglastopory', scientificName: 'Neoboletus luridiformis', aliases: ['borowik ceglastopory', 'ceglak', 'ceglaczek'],
    note: 'Występuje w lasach iglastych i liściastych, szczególnie na kwaśnych glebach.' },
  { id: 'podgrzybek-zajaczek', name: 'Podgrzybek zajączek', label: 'Podgrzybek zajączek', scientificName: 'Xerocomus subtomentosus', aliases: ['zajączek', 'zajaczek'],
    note: 'Spotykany w różnych typach lasów, od lata do jesieni.' },
  { id: 'podgrzybek-zlotawy', name: 'Podgrzybek złotawy', label: 'Podgrzybek złotawy', scientificName: 'Xerocomellus chrysenteron', aliases: ['podgrzybek złotopory'],
    note: 'Pojawia się w lasach iglastych i liściastych, nieraz w grupach.' },
  { id: 'maslak-pstry', name: 'Maślak pstry', label: 'Maślak pstry', scientificName: 'Suillus variegatus', aliases: ['bagniak', 'miodówka'],
    note: 'Rośnie w borach sosnowych, na wrzosowiskach i skrajach lasów.' },
  { id: 'maslak-sitarz', name: 'Maślak sitarz', label: 'Maślak sitarz', scientificName: 'Suillus bovinus', aliases: ['sitarz', 'sitarek'],
    note: 'Rośnie pod sosnami, często w licznych grupach.' },
  { id: 'maslak-ziarnisty', name: 'Maślak ziarnisty', label: 'Maślak ziarnisty', scientificName: 'Suillus granulatus', aliases: ['ziarniak'],
    note: 'Występuje pod sosnami, także w młodych i widnych drzewostanach.' },
  { id: 'maslak-zolty', name: 'Maślak żółty', label: 'Maślak żółty', scientificName: 'Suillus grevillei', aliases: ['maślak modrzewiowy'],
    note: 'Współżyje z modrzewiami. Pojawia się również przy pojedynczych drzewach.' },
  { id: 'kozlarz-babka', name: 'Koźlarz babka', label: 'Koźlarz babka', scientificName: 'Leccinum scabrum', aliases: ['kozak', 'brzeziak'],
    note: 'Związany z brzozami, także poza zwartymi kompleksami leśnymi.' },
  { id: 'kozlarz-czerwony', name: 'Koźlarz czerwony', label: 'Koźlarz czerwony', scientificName: 'Leccinum aurantiacum', aliases: ['czerwoniak', 'kozak czerwony'],
    note: 'Współżyje przede wszystkim z osikami. Pojawia się latem i jesienią.' },
  { id: 'kozlarz-pomaranczowozolty', name: 'Koźlarz pomarańczowożółty', label: 'Koźlarz pomarańczowożółty', scientificName: 'Leccinum versipelle', aliases: ['kozak pomarańczowy', 'koźlarz pomarańczowy'],
    note: 'Rośnie wyłącznie pod brzozami; często spotykany na skrajach lasów.' },
  { id: 'mleczaj-rydz', name: 'Mleczaj rydz', label: 'Mleczaj rydz', scientificName: 'Lactarius deliciosus', aliases: ['rydz', 'rydze'],
    note: 'Towarzyszy sosnom. Najczęściej pojawia się późnym latem i jesienią.' },
  { id: 'czubajka-kania', name: 'Czubajka kania', label: 'Czubajka kania', scientificName: 'Macrolepiota procera', aliases: ['kania', 'sowa'],
    note: 'Zasiedla leśne polany, obrzeża lasów i inne trawiaste miejsca.' },
  { id: 'opienka-miodowa', name: 'Opieńka miodowa', label: 'Opieńka miodowa', scientificName: 'Armillaria mellea', aliases: ['opieńka', 'opieńki'],
    note: 'Wyrasta w kępach na drewnie oraz przy korzeniach drzew.' },
  { id: 'lejkowiec-dety', name: 'Lejkowiec dęty', label: 'Lejkowiec dęty', scientificName: 'Craterellus cornucopioides', aliases: ['czarne kurki', 'kominiarz', 'trąbki'],
    note: 'Często rośnie gromadnie, tworząc mikoryzę z bukami i dębami.' },
  { id: 'golabek-zielonawofioletowy', name: 'Gołąbek zielonawofioletowy', label: 'Gołąbek zielonawofioletowy', scientificName: 'Russula cyanoxantha', aliases: ['gołąbek modrożółty', 'modrożółty'],
    note: 'Pospolity w lasach liściastych, szczególnie pod dębami i bukami.' },
];

export const species: string[] = mushroomSpecies.map(item => item.name);
export function speciesLabel(name: string): string {
  return mushroomSpecies.find(item => item.name === name)?.label ?? name;
}

function normalized(value: string) {
  return value.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l').trim();
}

export function searchSpecies(query: string) {
  const words = normalized(query).split(/\s+/).filter(Boolean);
  return mushroomSpecies.filter(item => {
    const text = normalized([item.name, item.label, item.scientificName, ...item.aliases].join(' '));
    return words.every(word => text.includes(word));
  });
}
