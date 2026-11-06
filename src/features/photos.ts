import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { MAX_SOURCE_PHOTO_BYTES, preparePhoto } from './prepare-photo';

export type PhotoSource = 'camera' | 'library';

function photoDirectory() {
  return new Directory(Paths.document, 'grzybet-photos');
}

/** Copy out of the picker cache so saved submissions survive cache cleanup. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error(permission.canAskAgain
        ? 'Zezwól na dostęp do aparatu, aby zrobić zdjęcie. Możesz też wybrać zdjęcie z galerii.'
        : 'Aparat jest zablokowany. Włącz dostęp do aparatu w ustawieniach telefonu lub wybierz zdjęcie z galerii.');
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection: false,
  };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri) throw new Error('Nie udało się odczytać zdjęcia. Wybierz je ponownie.');
  if (asset.fileSize && asset.fileSize > MAX_SOURCE_PHOTO_BYTES) {
    throw new Error('Zdjęcie jest zbyt duże. Wybierz plik mniejszy niż 20 MB.');
  }
  const processed = await preparePhoto(asset.uri);
  const prepared = new File(processed.uri);
  const directory = photoDirectory();
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  try {
    directory.create({ idempotent: true, intermediates: true });
    await prepared.copy(destination);
    return destination.uri;
  } catch {
    if (destination.exists) destination.delete();
    throw new Error('Nie udało się zapisać zdjęcia na urządzeniu. Sprawdź wolne miejsce i spróbuj ponownie.');
  } finally {
    try { if (prepared.exists) prepared.delete(); } catch { /* Only remove the generated cache copy. */ }
  }
}

/** Only delete unsubmitted copies owned by this feature, never gallery originals. */
export function discardPhoto(uri: string) {
  try {
    const file = new File(uri);
    if (file.parentDirectory.uri === photoDirectory().uri && file.exists) file.delete();
  } catch {
    // A missing file during best-effort draft cleanup must not block the form.
  }
}
