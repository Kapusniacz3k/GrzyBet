export type CachedPhoto = { uri: string; release: () => void };

/** The small part of Expo File used here also permits delayed-I/O regression tests. */
export type PhotoCacheFile = {
  readonly uri: string;
  readonly exists: boolean;
  write: (bytes: Uint8Array) => Promise<void>;
  delete: () => void;
};

const instance = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let sequence = 0;

function cacheName(id: string, type: string) {
  const mime = type.toLowerCase();
  const extension = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : mime.includes('heic') ? '.heic' : '.jpg';
  const label = id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return `${label}-${instance}-${++sequence}${extension}`;
}

function deleteCacheFile(file: PhotoCacheFile) {
  try { if (file.exists) file.delete(); } catch { /* Cache cleanup is best effort. */ }
}

/** Publish the URI only after the SDK finishes writing this cache entry. */
export async function writeCachedPhoto(id: string, bytes: ArrayBuffer, type: string,
  createFile: (name: string) => PhotoCacheFile): Promise<CachedPhoto> {
  const file = createFile(cacheName(id, type));
  try {
    await file.write(new Uint8Array(bytes));
    const uri = file.uri;
    let released = false;
    return { uri, release: () => {
      if (released) return;
      released = true;
      deleteCacheFile(file);
    } };
  } catch (error) {
    deleteCacheFile(file);
    throw error;
  }
}
