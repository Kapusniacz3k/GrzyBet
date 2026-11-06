import { Directory, File, Paths } from 'expo-file-system';
import { readNativeUploadPhoto } from './native-photo-upload';
export function photoForUpload(uri: string) {
  const file = new File(uri);
  const extension = file.extension.toLowerCase();
  const type = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : extension === '.heic' ? 'image/heic' : 'image/jpeg';
  return readNativeUploadPhoto(uri, type);
}
export function cachedPhoto(id: string, bytes: ArrayBuffer, type: string): { uri: string; release: () => void } {
  const directory = new Directory(Paths.cache, 'grzybet-online');
  directory.create({ idempotent: true, intermediates: true });
  const extension = type.includes('png') ? '.png' : type.includes('webp') ? '.webp' : type.includes('heic') ? '.heic' : '.jpg';
  const file = new File(directory, id + extension);
  file.write(new Uint8Array(bytes));
  return { uri: file.uri, release: () => { try { if (file.exists) file.delete(); } catch { /* Cache cleanup is best effort. */ } } };
}
