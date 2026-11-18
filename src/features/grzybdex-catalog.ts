import photoCredits from '../../assets/images/grzybdex/photos.json';
import { mushroomAtlasSource, mushroomSpecies } from './mushroom-species';

export const mushroomNoteSource = mushroomAtlasSource;
function httpsUrl(value: string): `https://${string}` {
  if (!value.startsWith('https://')) throw new Error('Nieprawidłowy adres źródła.');
  return value as `https://${string}`;
}
const photos: Record<string, number> = {
  'borowik': require('../../assets/images/grzybdex/borowik.jpg'),
  'podgrzybek': require('../../assets/images/grzybdex/podgrzybek.jpg'),
  'maslak': require('../../assets/images/grzybdex/maslak.jpg'),
  'kurka': require('../../assets/images/grzybdex/kurka.jpg'),
  'borowik-usiatkowany': require('../../assets/images/grzybdex/borowik-usiatkowany.jpg'),
  'krasnoborowik-ceglastopory': require('../../assets/images/grzybdex/krasnoborowik-ceglastopory.jpg'),
  'podgrzybek-zajaczek': require('../../assets/images/grzybdex/podgrzybek-zajaczek.jpg'),
  'podgrzybek-zlotawy': require('../../assets/images/grzybdex/podgrzybek-zlotawy.jpg'),
  'maslak-pstry': require('../../assets/images/grzybdex/maslak-pstry.jpg'),
  'maslak-sitarz': require('../../assets/images/grzybdex/maslak-sitarz.jpg'),
  'maslak-ziarnisty': require('../../assets/images/grzybdex/maslak-ziarnisty.jpg'),
  'maslak-zolty': require('../../assets/images/grzybdex/maslak-zolty.jpg'),
  'kozlarz-babka': require('../../assets/images/grzybdex/kozlarz-babka.jpg'),
  'kozlarz-czerwony': require('../../assets/images/grzybdex/kozlarz-czerwony.jpg'),
  'kozlarz-pomaranczowozolty': require('../../assets/images/grzybdex/kozlarz-pomaranczowozolty.jpg'),
  'mleczaj-rydz': require('../../assets/images/grzybdex/mleczaj-rydz.jpg'),
  'czubajka-kania': require('../../assets/images/grzybdex/czubajka-kania.jpg'),
  'opienka-miodowa': require('../../assets/images/grzybdex/opienka-miodowa.jpg'),
  'lejkowiec-dety': require('../../assets/images/grzybdex/lejkowiec-dety.jpg'),
  'golabek-zielonawofioletowy': require('../../assets/images/grzybdex/golabek-zielonawofioletowy.jpg'),
  'boczniak-ostrygowaty': require('../../assets/images/grzybdex/boczniak-ostrygowaty.jpg'),
  'boczniak-lyzkowaty': require('../../assets/images/grzybdex/boczniak-lyzkowaty.jpg'),
  'borowik-sosnowy': require('../../assets/images/grzybdex/borowik-sosnowy.jpg'),
  'kozlarek-grabowy': require('../../assets/images/grzybdex/kozlarek-grabowy.jpg'),
  'kozlarz-topolowy': require('../../assets/images/grzybdex/kozlarz-topolowy.jpg'),
  'kozlarz-sosnowy': require('../../assets/images/grzybdex/kozlarz-sosnowy.jpg'),
  'podgrzybek-czerwonawy': require('../../assets/images/grzybdex/podgrzybek-czerwonawy.jpg'),
  'podgrzybek-obcietozarodnikowy': require('../../assets/images/grzybdex/podgrzybek-obcietozarodnikowy.jpg'),
  'maslak-wejmutkowy': require('../../assets/images/grzybdex/maslak-wejmutkowy.jpg'),
  'maslak-lepki': require('../../assets/images/grzybdex/maslak-lepki.jpg'),
  'golabek-wyborny': require('../../assets/images/grzybdex/golabek-wyborny.jpg'),
  'golabek-zielonawy': require('../../assets/images/grzybdex/golabek-zielonawy.jpg'),
  'golabek-grynszpanowy': require('../../assets/images/grzybdex/golabek-grynszpanowy.jpg'),
  'golabek-oliwkowozielony': require('../../assets/images/grzybdex/golabek-oliwkowozielony.jpg'),
  'mleczaj-swierkowy': require('../../assets/images/grzybdex/mleczaj-swierkowy.jpg'),
  'mleczaj-jodlowy': require('../../assets/images/grzybdex/mleczaj-jodlowy.jpg'),
  'mleczajowiec-smaczny': require('../../assets/images/grzybdex/mleczajowiec-smaczny.jpg'),
  'pieczarka-polna': require('../../assets/images/grzybdex/pieczarka-polna.jpg'),
  'pieczarka-lesna': require('../../assets/images/grzybdex/pieczarka-lesna.jpg'),
  'pieczarka-bialawa': require('../../assets/images/grzybdex/pieczarka-bialawa.jpg'),
  'twardzioszek-przydrozny': require('../../assets/images/grzybdex/twardzioszek-przydrozny.jpg'),
  'plachetka-zwyczajna': require('../../assets/images/grzybdex/plachetka-zwyczajna.jpg'),
  'kolczak-oblaczasty': require('../../assets/images/grzybdex/kolczak-oblaczasty.jpg'),
  'pieprznik-trabkowy': require('../../assets/images/grzybdex/pieprznik-trabkowy.jpg'),
  'purchawka-chropowata': require('../../assets/images/grzybdex/purchawka-chropowata.jpg'),
  'siedzun-sosnowy': require('../../assets/images/grzybdex/siedzun-sosnowy.jpg'),
  'czernidlak-kolpakowaty': require('../../assets/images/grzybdex/czernidlak-kolpakowaty.jpg'),
  'gaska-nieksztaltna': require('../../assets/images/grzybdex/gaska-nieksztaltna.jpg'),
  'gesnica-wiosenna': require('../../assets/images/grzybdex/gesnica-wiosenna.jpg'),
  'uszak-bzowy': require('../../assets/images/grzybdex/uszak-bzowy.jpg'),
};

export const mushroomCatalog = mushroomSpecies.map(item => {
  const credit = photoCredits[item.id as keyof typeof photoCredits];
  return { ...item, photo: photos[item.id], ...credit,
    noteSource: { label: item.noteSource?.label ?? 'Lasy Państwowe', url: httpsUrl(item.noteSource?.url ?? mushroomNoteSource) },
    source: httpsUrl(credit.source), licenseUrl: httpsUrl(credit.licenseUrl),
  };
});
