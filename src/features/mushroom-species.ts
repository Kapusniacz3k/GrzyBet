export const mushroomAtlasSource = 'https://www.lasy.gov.pl/pl/informacje/publikacje/do-poczytania/grzyby-polskich-lasow/grzyby-polskich-lasow_internet-1.pdf';

type MushroomSpecies = {
  id: string;
  /** The first four keys are kept for existing tickets and harvests. */
  name: string;
  label: string;
  scientificName: string;
  aliases: string[];
  note: string;
  noteSource?: { label: string; url: string };
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
  { id: 'boczniak-ostrygowaty', name: 'Boczniak ostrygowaty', label: 'Boczniak ostrygowaty', scientificName: 'Pleurotus ostreatus', aliases: ['boczniak', 'boczniaki'],
    note: 'Wyrasta kępami na drewnie drzew liściastych, często późną jesienią.' },
  { id: 'boczniak-lyzkowaty', name: 'Boczniak łyżkowaty', label: 'Boczniak łyżkowaty', scientificName: 'Pleurotus pulmonarius', aliases: ['boczniak płucny'],
    note: 'Rośnie na drewnie drzew liściastych, zwykle w cieplejszej porze roku.',
    noteSource: { label: 'MushroomExpert', url: 'https://www.mushroomexpert.com/pleurotus_pulmonarius.html' } },
  { id: 'borowik-sosnowy', name: 'Borowik sosnowy', label: 'Borowik sosnowy', scientificName: 'Boletus pinophilus', aliases: ['prawdziwek sosnowy', 'borowik borowy'],
    note: 'Tworzy mikoryzę głównie z sosnami na kwaśnych glebach.' },
  { id: 'kozlarek-grabowy', name: 'Koźlarek grabowy', label: 'Koźlarek grabowy', scientificName: 'Leccinellum pseudoscabrum', aliases: ['koźlarz grabowy', 'grabówka', 'Leccinum carpini', 'Leccinum pseudoscabrum'],
    note: 'Związany z grabami i leszczynami. Rośnie pojedynczo lub grupami.' },
  { id: 'kozlarz-topolowy', name: 'Koźlarz topolowy', label: 'Koźlarz topolowy', scientificName: 'Leccinum duriusculum', aliases: ['kozak topolowy', 'twardziak'],
    note: 'Koźlarz z wyraźnymi łuseczkami na trzonie.',
    noteSource: { label: 'Boletales', url: 'https://boletales.com/genera/leccinum/l-duriusculum/' } },
  { id: 'kozlarz-sosnowy', name: 'Koźlarz sosnowy', label: 'Koźlarz sosnowy', scientificName: 'Leccinum vulpinum', aliases: ['kozak sosnowy', 'koźlarz lisi'],
    note: 'Tworzy mikoryzę z sosnami.' },
  { id: 'podgrzybek-czerwonawy', name: 'Podgrzybek czerwonawy', label: 'Podgrzybek czerwonawy', scientificName: 'Hortiboletus rubellus', aliases: ['podgrzybek rubinowy', 'Xerocomellus rubellus', 'Xerocomus rubellus'],
    note: 'Współżyje z drzewami liściastymi; spotykany przede wszystkim lokalnie.' },
  { id: 'podgrzybek-obcietozarodnikowy', name: 'Podgrzybek obciętozarodnikowy', label: 'Podgrzybek obciętozarodnikowy', scientificName: 'Xerocomellus porosporus', aliases: ['suchogrzybek obciętozarodnikowy', 'Xerocomus porosporus'],
    note: 'Grzyb mikoryzowy spotykany zwłaszcza pod dębami.',
    noteSource: { label: 'First Nature', url: 'https://www.first-nature.com/fungi/xerocomellus-porosporus.php' } },
  { id: 'maslak-wejmutkowy', name: 'Maślak wejmutkowy', label: 'Maślak wejmutkowy', scientificName: 'Suillus placidus', aliases: ['maślak biały'],
    note: 'Związany z sosną wejmutką. Wyróżnia się jasnym kapeluszem.',
    noteSource: { label: 'MushroomExpert', url: 'https://www.mushroomexpert.com/suillus_placidus.html' } },
  { id: 'maslak-lepki', name: 'Maślak lepki', label: 'Maślak lepki', scientificName: 'Suillus viscidus', aliases: ['maślak szary'],
    note: 'Współżyje z modrzewiami; często rośnie na glebach wapiennych lub piaszczystych.',
    noteSource: { label: 'First Nature', url: 'https://www.first-nature.com/fungi/suillus-viscidus.php' } },
  { id: 'golabek-wyborny', name: 'Gołąbek wyborny', label: 'Gołąbek wyborny', scientificName: 'Russula vesca', aliases: ['gołąbek jadalny', 'surojadka'],
    note: 'W Polsce pospolity. Jego owocniki często wyrastają grupami.' },
  { id: 'golabek-zielonawy', name: 'Gołąbek zielonawy', label: 'Gołąbek zielonawy', scientificName: 'Russula virescens', aliases: ['surojadka zielona'],
    note: 'Tworzy mikoryzę m.in. z brzozami, bukami i dębami.' },
  { id: 'golabek-grynszpanowy', name: 'Gołąbek grynszpanowy', label: 'Gołąbek grynszpanowy', scientificName: 'Russula aeruginea', aliases: ['gołąbek białozielonawy'],
    note: 'Współżyje z drzewami liściastymi i iglastymi, często rosnąc grupami.' },
  { id: 'golabek-oliwkowozielony', name: 'Gołąbek oliwkowozielony', label: 'Gołąbek oliwkowozielony', scientificName: 'Russula heterophylla', aliases: ['surojadka oliwkowa'],
    note: 'Preferuje piaszczyste gleby. Przypomina gołąbka grynszpanowego.' },
  { id: 'mleczaj-swierkowy', name: 'Mleczaj świerkowy', label: 'Mleczaj świerkowy', scientificName: 'Lactarius deterrimus', aliases: ['rydz świerkowy'],
    note: 'Współżyje ze świerkami w lasach iglastych i mieszanych.' },
  { id: 'mleczaj-jodlowy', name: 'Mleczaj jodłowy', label: 'Mleczaj jodłowy', scientificName: 'Lactarius salmonicolor', aliases: ['rydz jodłowy', 'mleczaj późnojesienny'],
    note: 'Tworzy mikoryzę z jodłami i daglezjami.' },
  { id: 'mleczajowiec-smaczny', name: 'Mleczajowiec smaczny', label: 'Mleczajowiec smaczny', scientificName: 'Lactifluus volemus', aliases: ['mleczaj smaczny', 'mleczaj krasnawy', 'Lactarius volemus'],
    note: 'Najczęściej rośnie pod bukami i dębami, zwykle nielicznie.' },
  { id: 'pieczarka-polna', name: 'Pieczarka polna', label: 'Pieczarka polna', scientificName: 'Agaricus campestris', aliases: ['pieczarka łąkowa', 'pieczarka polowa'],
    note: 'Rośnie wśród traw na pastwiskach, łąkach i w parkach.',
    noteSource: { label: 'First Nature', url: 'https://www.first-nature.com/fungi/agaricus-campestris.php' } },
  { id: 'pieczarka-lesna', name: 'Pieczarka leśna', label: 'Pieczarka leśna', scientificName: 'Agaricus silvaticus', aliases: ['Agaricus sylvaticus'],
    note: 'Rozkłada materię organiczną. Spotykana głównie pod świerkami i jodłami.' },
  { id: 'pieczarka-bialawa', name: 'Pieczarka biaława', label: 'Pieczarka biaława', scientificName: 'Agaricus arvensis', aliases: ['pieczarka końska'],
    note: 'Rośnie na żyznych łąkach i pastwiskach; może tworzyć kręgi.',
    noteSource: { label: 'First Nature', url: 'https://www.first-nature.com/fungi/agaricus-arvensis.php' } },
  { id: 'twardzioszek-przydrozny', name: 'Twardzioszek przydrożny', label: 'Twardzioszek przydrożny', scientificName: 'Marasmius oreades', aliases: ['twardzioszek polny', 'tańcówka', 'podróżniczka'],
    note: 'Rośnie na trawiastych terenach, często tworząc kręgi.' },
  { id: 'plachetka-zwyczajna', name: 'Płachetka zwyczajna', label: 'Płachetka zwyczajna', scientificName: 'Cortinarius caperatus', aliases: ['płachetka kołpakowata', 'kołpak', 'niemka', 'Rozites caperatus'],
    note: 'Preferuje lasy sosnowe i świerkowe na kwaśnych, piaszczystych glebach.' },
  { id: 'kolczak-oblaczasty', name: 'Kolczak obłączasty', label: 'Kolczak obłączasty', scientificName: 'Hydnum repandum', aliases: ['kolczak', 'sarna'],
    note: 'Pod kapeluszem ma kolce. Często towarzyszy bukom i świerkom.' },
  { id: 'pieprznik-trabkowy', name: 'Pieprznik trąbkowy', label: 'Pieprznik trąbkowy', scientificName: 'Craterellus tubaeformis', aliases: ['kurka trąbkowa', 'lejkowiec trąbkowy', 'Cantharellus tubaeformis'],
    note: 'Rośnie w wilgotnych lasach iglastych. Ma lejkowaty kapelusz i pusty trzon.',
    noteSource: { label: 'First Nature', url: 'https://www.first-nature.com/fungi/cantharellus-tubaeformis.php' } },
  { id: 'purchawka-chropowata', name: 'Purchawka chropowata', label: 'Purchawka chropowata', scientificName: 'Lycoperdon perlatum', aliases: ['purchawka', 'purchawka perełkowata'],
    note: 'Rozkłada materię organiczną w glebie, czasem także butwiejące drewno.' },
  { id: 'siedzun-sosnowy', name: 'Siedzuń sosnowy', label: 'Siedzuń sosnowy', scientificName: 'Sparassis crispa', aliases: ['kozia broda', 'szmaciak gałęzisty', 'barania głowa'],
    note: 'Wyrasta u nasady starych sosen, często w tych samych miejscach.' },
  { id: 'czernidlak-kolpakowaty', name: 'Czernidłak kołpakowaty', label: 'Czernidłak kołpakowaty', scientificName: 'Coprinus comatus', aliases: ['czernidlak', 'czernidłak', 'kołpak'],
    note: 'Spotykany na łąkach, poboczach dróg i innych terenach trawiastych.' },
  { id: 'gaska-nieksztaltna', name: 'Gąska niekształtna', label: 'Gąska niekształtna', scientificName: 'Tricholoma portentosum', aliases: ['gąska siwa', 'siwka'],
    note: 'Rośnie gromadnie pod sosnami, zwykle na ubogich, piaszczystych glebach.' },
  { id: 'gesnica-wiosenna', name: 'Gęśnica wiosenna', label: 'Gęśnica wiosenna', scientificName: 'Calocybe gambosa', aliases: ['majówka', 'majówka wiosenna'],
    note: 'Pojawia się wiosną na żyznych glebach, na obrzeżach lasów i łąkach.' },
  { id: 'uszak-bzowy', name: 'Uszak bzowy', label: 'Uszak bzowy', scientificName: 'Auricularia auricula-judae', aliases: ['ucho bzowe', 'ucho judaszowe'],
    note: 'Wyrasta na drewnie drzew i krzewów liściastych, często czarnego bzu.' },
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
