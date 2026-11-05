-- Patika: kayıp modu. Supabase panelinde SQL Editor'a yapıştırıp bir kez çalıştırılır.

-- Her hayvanın değişmeyen kodu. QR ve ilan bağlantısı bunu kullanır, tahmin edilemez.
create table public.pet_tags (
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id text not null check (char_length(pet_id) between 1 and 100),
  public_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_at timestamptz not null default now(),
  primary key (owner_id, pet_id)
);

alter table public.pet_tags enable row level security;
revoke all on table public.pet_tags from anon, authenticated;
grant select, insert, delete on table public.pet_tags to authenticated;

create policy "Kullanıcı kendi kodlarını okur"
on public.pet_tags for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi kodunu ekler"
on public.pet_tags for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi kodunu siler"
on public.pet_tags for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- Kayıp ilanı. Tablo herkese kapalıdır, herkese açık sayfa yalnızca aşağıdaki işlevden geçer.
create table public.lost_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  pet_id text not null check (char_length(pet_id) between 1 and 100),
  pet_name text not null check (char_length(pet_name) between 1 and 30),
  species text not null check (species in ('cat', 'dog', 'rabbit', 'bird')),
  breed text check (char_length(breed) <= 40),
  description text check (char_length(description) <= 300),
  photo_path text check (char_length(photo_path) <= 200),
  -- Herkese görünen semt yazısı.
  last_seen_area text not null check (char_length(last_seen_area) between 1 and 80),
  -- Tam nokta: yalnızca hayvanın sahibi görür, evin yakını olabilir.
  last_seen_lat double precision not null check (last_seen_lat between -90 and 90),
  last_seen_lng double precision not null check (last_seen_lng between -180 and 180),
  last_seen_at timestamptz not null,
  started_at timestamptz not null default now(),
  found_at timestamptz
);

-- Bir hayvanın aynı anda tek açık ilanı olur.
create unique index lost_reports_one_active_idx
on public.lost_reports (owner_id, pet_id)
where found_at is null;

alter table public.lost_reports enable row level security;
revoke all on table public.lost_reports from anon, authenticated;
grant select, insert, update, delete on table public.lost_reports to authenticated;

create policy "Kullanıcı kendi ilanlarını okur"
on public.lost_reports for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi ilanını açar"
on public.lost_reports for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi ilanını günceller"
on public.lost_reports for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi ilanını siler"
on public.lost_reports for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- İhbarlar. Yalnızca ilanın sahibi okur. Ekleme yalnızca add_sighting işleviyle yapılır.
create table public.sightings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.lost_reports (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  place text check (char_length(place) <= 80),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  message text check (char_length(message) <= 500),
  contact text check (char_length(contact) <= 80),
  created_at timestamptz not null default now()
);

create index sightings_report_created_idx on public.sightings (report_id, created_at desc);

alter table public.sightings enable row level security;
revoke all on table public.sightings from anon, authenticated;
grant select, delete on table public.sightings to authenticated;

create policy "Kullanıcı kendi ilanının ihbarlarını okur"
on public.sightings for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Kullanıcı kendi ilanının ihbarlarını siler"
on public.sightings for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- Yeni ihbar uygulamaya anında ulaşsın diye. Erişim kuralları burada da geçerlidir.
alter publication supabase_realtime add table public.sightings;

-- Herkese açık sayfanın göreceği alanlar. Tam konum, sahip ve ihbarlar burada yoktur.
-- Bulunan ilanda yalnızca ad ve durum döner.
create function public.get_lost_report(code text)
returns table (
  status text,
  pet_name text,
  species text,
  breed text,
  description text,
  photo_path text,
  last_seen_area text,
  last_seen_at timestamptz,
  started_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when r.found_at is null then 'lost' else 'found' end,
    r.pet_name,
    case when r.found_at is null then r.species end,
    case when r.found_at is null then r.breed end,
    case when r.found_at is null then r.description end,
    case when r.found_at is null then r.photo_path end,
    case when r.found_at is null then r.last_seen_area end,
    case when r.found_at is null then r.last_seen_at end,
    case when r.found_at is null then r.started_at end
  from public.pet_tags t
  join public.lost_reports r on r.owner_id = t.owner_id and r.pet_id = t.pet_id
  where t.public_code = code
  order by r.started_at desc
  limit 1;
$$;

-- Giriş yapmayan biri de ihbar gönderebilir. Her şey burada denetlenir.
create function public.add_sighting(
  code text,
  sighting_place text default null,
  sighting_lat double precision default null,
  sighting_lng double precision default null,
  sighting_message text default null,
  sighting_contact text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_place text := nullif(btrim(sighting_place), '');
  clean_message text := nullif(btrim(sighting_message), '');
  clean_contact text := nullif(btrim(sighting_contact), '');
  report public.lost_reports%rowtype;
begin
  if (sighting_lat is null) <> (sighting_lng is null) then
    raise exception 'invalid_location' using errcode = '22023';
  end if;
  if clean_place is null and clean_message is null and sighting_lat is null then
    raise exception 'empty_sighting' using errcode = '22023';
  end if;

  select r.* into report
  from public.pet_tags t
  join public.lost_reports r on r.owner_id = t.owner_id and r.pet_id = t.pet_id
  where t.public_code = code and r.found_at is null
  limit 1;

  if not found then
    raise exception 'report_not_active' using errcode = 'P0002';
  end if;

  -- Sayfayı kötüye kullanmaya karşı basit sınır.
  if (
    select count(*) from public.sightings s
    where s.report_id = report.id and s.created_at > now() - interval '1 hour'
  ) >= 30 or (
    select count(*) from public.sightings s where s.report_id = report.id
  ) >= 500 then
    raise exception 'too_many_sightings' using errcode = 'P0001';
  end if;

  insert into public.sightings (report_id, owner_id, place, lat, lng, message, contact)
  values (
    report.id, report.owner_id, clean_place, sighting_lat, sighting_lng,
    clean_message, clean_contact
  );
end;
$$;

revoke all on function public.get_lost_report(text) from public;
revoke all on function public.add_sighting(text, text, double precision, double precision, text, text) from public;
grant execute on function public.get_lost_report(text) to anon, authenticated;
grant execute on function public.add_sighting(text, text, double precision, double precision, text, text) to anon, authenticated;

-- İlan fotoğrafları herkese açıktır, çünkü ilan sayfasında görünür. Bulununca silinir.
-- Hayvanın diğer fotoğrafları kapalı depoda kalır.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lost-photos', 'lost-photos', true, 5242880, array['image/jpeg']);

create policy "Kullanıcı kendi ilan fotoğraflarını görür"
on storage.objects for select
to authenticated
using (
  bucket_id = 'lost-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Kullanıcı kendi ilan fotoğrafını ekler"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'lost-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

create policy "Kullanıcı kendi ilan fotoğrafını siler"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'lost-photos'
  and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);
