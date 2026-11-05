// Tarayıcı önizlemesi için: tarayıcıda dosya sistemi yok, fotoğraf olduğu gibi saklanır.
export async function storePetPhoto(sourceUri: string): Promise<string> {
  return sourceUri;
}

export function deletePetPhoto(_photo: string) {}

export function deleteAllPetPhotos() {}

export function petPhotoExists(_photo: string) {
  return true;
}

export async function readPetPhotoBytes(_photo: string): Promise<ArrayBuffer> {
  return new ArrayBuffer(0);
}

export async function downloadPetPhoto(_url: string, _photo: string) {}

export function resolvePetPhotoUri(photo: string) {
  return photo;
}
