import photoCredits from '../../assets/images/grzybdex/photos.json';
import { mushroomAtlasSource, mushroomSpecies } from './mushroom-species';

export const mushroomNoteSource = mushroomAtlasSource;
function httpsUrl(value: string): `https://${string}` {
  if (!value.startsWith('https://')) throw new Error('Nieprawidłowy adres źródła zdjęcia.');
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
};

export const mushroomCatalog = mushroomSpecies.map(item => {
  const credit = photoCredits[item.id as keyof typeof photoCredits];
  return { ...item, photo: photos[item.id], ...credit,
    source: httpsUrl(credit.source), licenseUrl: httpsUrl(credit.licenseUrl) };
});
