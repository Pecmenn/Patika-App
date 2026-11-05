// Tarayıcı önizlemesi için: tarayıcıda dosya sistemi yok, fotoğraf olduğu gibi saklanır.
export async function storePetPhoto(sourceUri: string): Promise<string> {
  return sourceUri;
}

export function deletePetPhoto(_photo: string) {}

export function resolvePetPhotoUri(photo: string) {
  return photo;
}
