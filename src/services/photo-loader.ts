import type { CachedPhoto } from './photo-cache.ts';

/** Session-owned, on-demand cache. Never download a room's whole photo history. */
export function createPhotoLoader(download: (path: string) => Promise<CachedPhoto>, concurrency = 2) {
  const entries = new Map<string, Promise<CachedPhoto>>();
  const resources = new Map<string, CachedPhoto>();
  const queue: (() => void)[] = [];
  let running = 0;
  let disposed = false;
  function pump() {
    while (running < concurrency && queue.length) queue.shift()!();
  }
  function load(path: string, refresh = false): Promise<string> {
    if (disposed) return Promise.reject(new Error('Sesja zdjęć została zakończona. Otwórz wyprawę ponownie.'));
    if (refresh && resources.has(path)) {
      resources.get(path)!.release(); resources.delete(path); entries.delete(path);
    }
    let entry = entries.get(path);
    if (!entry) {
      entry = new Promise<CachedPhoto>((resolve, reject) => {
        queue.push(() => {
          running++;
          void Promise.resolve().then(() => {
            if (disposed) throw new Error('Konto się zmieniło. Otwórz wyprawę ponownie.');
            return download(path);
          }).then(photo => {
            if (disposed) { photo.release(); throw new Error('Konto się zmieniło.'); }
            resources.set(path, photo); resolve(photo);
          }).catch(error => { entries.delete(path); reject(error); })
            .finally(() => { running--; pump(); });
        });
      });
      entries.set(path, entry);
      pump();
    }
    return entry.then(photo => photo.uri);
  }
  return { load, dispose() {
    if (disposed) return;
    disposed = true;
    resources.forEach(photo => photo.release()); resources.clear(); entries.clear();
    pump();
  } };
}
