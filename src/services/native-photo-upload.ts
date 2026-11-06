import type { UploadPhoto } from './photo-upload';

type NativeBlob = Blob & { close?: () => void };

/** RN can send native blobs, but cannot construct Blob([Uint8Array]). */
export function readNativeUploadPhoto(uri: string, type: string): Promise<UploadPhoto> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const clear = () => {
      request.onload = null; request.onerror = null; request.ontimeout = null; request.onabort = null;
    };
    const fail = () => {
      clear();
      reject(new Error('Nie udało się odczytać zdjęcia z urządzenia. Wybierz je ponownie.'));
    };
    request.onload = () => {
      clear();
      const blob = request.response as NativeBlob | null;
      const validStatus = request.status === 0 || (request.status >= 200 && request.status < 300);
      if (!validStatus || !(blob instanceof Blob) || !blob.size) {
        blob?.close?.();
        reject(new Error('Nie udało się odczytać zdjęcia z urządzenia. Wybierz je ponownie.'));
        return;
      }
      if (blob.size > 5 * 1024 * 1024) {
        blob.close?.();
        reject(new Error('Wybierz zdjęcie o rozmiarze do 5 MB.'));
        return;
      }
      let released = false;
      resolve({ data: blob, type, release: () => { if (!released) { released = true; blob.close?.(); } } });
    };
    request.onerror = fail;
    request.ontimeout = fail;
    request.onabort = fail;
    try {
      request.open('GET', uri, true);
      request.responseType = 'blob';
      request.timeout = 15000;
      request.send(null);
    } catch { fail(); }
  });
}
