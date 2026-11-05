import { deleteHealthRecordsOfPet, listHealthRecords } from '@/data/health-records';
import { deletePetPhoto } from '@/data/pet-photo-storage';
import { deletePet, type Pet } from '@/data/pets';
import { deleteTasksOfPet, listTasks } from '@/data/tasks';
import { deleteVisitsOfPet, listVisits } from '@/data/visits';

export function removalWarning(counts: { records: number; visits: number; tasks: number }) {
  const parts = [
    counts.records > 0 && `${counts.records} sağlık kaydı`,
    counts.visits > 0 && `${counts.visits} ziyaret`,
    counts.tasks > 0 && `${counts.tasks} görev`,
  ].filter((part) => part !== false);

  if (parts.length === 0) {
    return 'Bu işlem geri alınamaz.';
  }
  const list =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} ve ${parts[parts.length - 1]}`;
  return `${list} de silinecek. Bu işlem geri alınamaz.`;
}

export async function countPetData(petId: string) {
  const [records, visits, tasks] = await Promise.all([
    listHealthRecords(),
    listVisits(),
    listTasks(),
  ]);
  return {
    records: records.filter((record) => record.petId === petId).length,
    visits: visits.filter((visit) => visit.petId === petId).length,
    tasks: tasks.filter((task) => task.petId === petId).length,
  };
}

// Önce hayvan silinir: sonraki adımlardan biri yarım kalırsa geriye yalnızca sahipsiz kayıt kalır,
// onlar da hiçbir ekranda ve bildirimde görünmez. Tersi olsaydı hayvan kayıtlarını kaybetmiş kalırdı.
export async function removePet(pet: Pet) {
  await deletePet(pet.id);
  await Promise.all([
    deleteHealthRecordsOfPet(pet.id),
    deleteVisitsOfPet(pet.id),
    deleteTasksOfPet(pet.id),
  ]);
  if (pet.photo) {
    deletePetPhoto(pet.photo);
  }
}
