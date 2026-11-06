import { MAX_SOURCE_PHOTO_BYTES, MAX_WEB_PHOTO_BYTES, preparePhoto } from './prepare-photo';

export type PhotoSource = 'camera' | 'library';

/** A data URL is durable across reloads; a temporary blob URL would expire. */
export function pickPhoto(source: PhotoSource): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanUp = () => input.remove();
    input.addEventListener('cancel', () => { cleanUp(); resolve(null); }, { once: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanUp();
      if (!file) { resolve(null); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        reject(new Error('Wybierz zdjęcie JPG, PNG lub WebP.')); return;
      }
      if (file.size > MAX_SOURCE_PHOTO_BYTES) {
        reject(new Error('Zdjęcie jest zbyt duże. Wybierz plik mniejszy niż 20 MB.')); return;
      }
      const sourceUri = URL.createObjectURL(file);
      let preparedUri: string | undefined;
      try {
        const processed = await preparePhoto(sourceUri, true);
        preparedUri = processed.uri;
        if (!processed.base64) throw new Error('Nie udało się odczytać zdjęcia. Wybierz je ponownie.');
        const size = processed.base64.length * 3 / 4 - (processed.base64.endsWith('==') ? 2 : processed.base64.endsWith('=') ? 1 : 0);
        if (size > MAX_WEB_PHOTO_BYTES) throw new Error('Zdjęcie nadal jest zbyt duże. Wybierz mniejsze zdjęcie lub zrób je ponownie.');
        resolve('data:image/jpeg;base64,' + processed.base64);
      } catch (error) { reject(error); }
      finally {
        URL.revokeObjectURL(sourceUri);
        if (preparedUri?.startsWith('blob:')) URL.revokeObjectURL(preparedUri);
      }
    }, { once: true });
    // Keep the picker in the original button event for mobile browser permissions.
    input.click();
  });
}

export function discardPhoto(_uri: string) {
  // Unsubmitted data URLs are released when their form state is cleared.
}
