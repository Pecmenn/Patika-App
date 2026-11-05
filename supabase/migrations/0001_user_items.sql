-- Patika: kullanıcı verisi ve hayvan fotoğrafları.
-- Supabase panelinde SQL Editor'a yapıştırıp bir kez çalıştırılır.

-- Her kullanıcının kayıtları tek tabloda durur, her satır bir kayıttır (hayvan, aşı, görev...).
create table public.user_items (
  owner_id uuid not null references auth.users (id) on delete cascade,
  collection text not null check (
    collection in ('pets', 'health_records', 'visits', 'tasks', 'weights', 'weight_ranges')
  ),
  id text not null check (char_length(id) between 1 and 100),
  data jsonb check (data is null or pg_column_size(data) <= 20000),
  deleted boolean not null default false,
  -- Kaydın telefonda değiştiği an. Çakışmada son değişiklik kazanır.
  updated_at timestamptz not null,
  -- Satırın sunucuya ulaştığı an. Telefonların saatine güvenmemek için sunucu belirler.
  synced_at timestamptz not null default clock_timestamp(),
  primary key (owner_id, collection, id)
);

create index user_items_owner_synced_idx on public.user_items (owner_id, synced_at);

create function public.set_user_item_synced_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

create trigger user_items_set_synced_at
before insert or update on public.user_items
for each row execute function public.set_user_item_synced_at();

-- Erişim kuralı: herkes yalnızca kendi satırlarını görür ve değiştirir.
alter table public.user_items enable row level security;

revoke all on table public.user_items from anon, authenticated;
grant select, insert, update, delete on table public.user_items to authenticated;

create policy "Kullanıcı kendi kayıtlarını okur"
on public.user_items for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi kayıtlarını ekler"
on public.user_items for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi kayıtlarını günceller"
on public.user_items for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi kayıtlarını siler"
on public.user_items for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- Hayvan fotoğrafları. Herkese kapalı, en fazla 5 MB, yalnızca JPEG.
-- Her kullanıcının dosyaları kendi kimliğiyle adlandırılmış klasörde durur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', false, 5242880, array['image/jpeg']);

create policy "Kullanıcı kendi fotoğraflarını okur"
on storage.objects for select
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Kullanıcı kendi fotoğraflarını ekler"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Kullanıcı kendi fotoğraflarını günceller"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
)
with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Kullanıcı kendi fotoğraflarını siler"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
