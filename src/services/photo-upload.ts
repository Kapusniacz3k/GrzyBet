export type UploadPhoto = {
  data: Blob | Uint8Array;
  type: string;
  release?: () => void;
};
