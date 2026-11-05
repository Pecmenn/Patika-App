import { Directory, File, Paths } from 'expo-file-system';

function photosDirectory() {
  return new Directory(Paths.document, 'pet-photos');
}

function ensurePhotosDirectory() {
  const directory = photosDirectory();
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

// Seçilen fotoğraf geçici klasörde durur ve silinebilir, bu yüzden kalıcı klasöre kopyalanır.
// Tam yol uygulama güncellenince değişebildiği için yalnızca dosya adı saklanır.
export async function storePetPhoto(sourceUri: string): Promise<string> {
  const fileName = `${Date.now()}.jpg`;
  await new File(sourceUri).copy(new File(ensurePhotosDirectory(), fileName));
  return fileName;
}

export function deletePetPhoto(photo: string) {
  const file = new File(photosDirectory(), photo);
  if (file.exists) {
    file.delete();
  }
}

export function deleteAllPetPhotos() {
  const directory = photosDirectory();
  if (directory.exists) {
    directory.delete();
  }
}

export function petPhotoExists(photo: string) {
  return new File(photosDirectory(), photo).exists;
}

export function readPetPhotoBytes(photo: string) {
  return new File(photosDirectory(), photo).arrayBuffer();
}

export async function downloadPetPhoto(
  url: string,
  photo: string,
  headers: Record<string, string>,
) {
  await File.downloadFileAsync(url, new File(ensurePhotosDirectory(), photo), { headers });
}

export function resolvePetPhotoUri(photo: string) {
  return new File(photosDirectory(), photo).uri;
}
