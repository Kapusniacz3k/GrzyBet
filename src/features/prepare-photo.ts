import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';

export const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;
export const MAX_WEB_PHOTO_BYTES = 1024 * 1024;

/** Bound decoding memory and normalize camera formats before saving or uploading. */
export async function preparePhoto(uri: string, base64 = false) {
  const context = ImageManipulator.manipulate(uri, { maxWidth: 1600, maxHeight: 1600 });
  let image: ImageRef | undefined;
  try {
    image = await context.renderAsync();
    return await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.78, base64 });
  } catch {
    throw new Error('Nie udało się przygotować zdjęcia. Wybierz inny plik lub zrób zdjęcie ponownie.');
  } finally {
    image?.release();
    context.release();
  }
}
