import { Directory, File, Paths } from 'expo-file-system';
import { readNativeUploadPhoto } from './native-photo-upload';
import { writeCachedPhoto, type CachedPhoto } from './photo-cache.ts';
export function photoForUpload(uri: string) {
  const file = new File(uri);
  const extension = file.extension.toLowerCase();
  const type = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : extension === '.heic' ? 'image/heic' : 'image/jpeg';
  return readNativeUploadPhoto(uri, type);
}
export async function cachedPhoto(id: string, bytes: ArrayBuffer, type: string): Promise<CachedPhoto> {
  const directory = new Directory(Paths.cache, 'grzybet-online');
  directory.create({ idempotent: true, intermediates: true });
  return writeCachedPhoto(id, bytes, type, name => new File(directory, name));
}
