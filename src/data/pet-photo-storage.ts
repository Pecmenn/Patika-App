import { Directory, File, Paths } from 'expo-file-system';

function photosDirectory() {
  return new Directory(Paths.document, 'pet-photos');
}

// Seçilen fotoğraf geçici klasörde durur ve silinebilir, bu yüzden kalıcı klasöre kopyalanır.
// Tam yol uygulama güncellenince değişebildiği için yalnızca dosya adı saklanır.
export async function storePetPhoto(sourceUri: string): Promise<string> {
  const directory = photosDirectory();
  if (!directory.exists) {
    directory.create();
  }
  const fileName = `${Date.now()}.jpg`;
  await new File(sourceUri).copy(new File(directory, fileName));
  return fileName;
}

export function resolvePetPhotoUri(photo: string) {
  return new File(photosDirectory(), photo).uri;
}
