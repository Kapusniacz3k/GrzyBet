import type { UploadPhoto } from './photo-upload';
import type { CachedPhoto } from './photo-cache.ts';

export async function photoForUpload(uri: string): Promise<UploadPhoto> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return { data: blob, type: blob.type || 'image/jpeg' };
}
export function cachedPhoto(_id: string, bytes: ArrayBuffer, type: string): CachedPhoto {
  const uri = URL.createObjectURL(new Blob([bytes], { type }));
  let released = false;
  return { uri, release: () => {
    if (released) return;
    released = true;
    URL.revokeObjectURL(uri);
  } };
}
