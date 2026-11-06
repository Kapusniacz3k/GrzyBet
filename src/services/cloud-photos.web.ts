import type { UploadPhoto } from './photo-upload';

export async function photoForUpload(uri: string): Promise<UploadPhoto> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return { data: blob, type: blob.type || 'image/jpeg' };
}
export function cachedPhoto(_id: string, bytes: ArrayBuffer, type: string): { uri: string; release: () => void } {
  const uri = URL.createObjectURL(new Blob([bytes], { type }));
  return { uri, release: () => URL.revokeObjectURL(uri) };
}
