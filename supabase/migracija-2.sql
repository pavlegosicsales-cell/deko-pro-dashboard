-- Migracija 2 (23.09.2026.): kad je lead prvi put pomeren iz „Novi" (= pozvan).
-- Pokreni u Supabase SQL editoru ako je schema.sql pokrenut pre ove kolone.
alter table leadovi add column if not exists pozvan_kad timestamptz;

-- Popuni za postojeće leadove koji su već pomereni iz „nov" (najbolja procena = updated_at).
update leadovi set pozvan_kad = updated_at where pozvan_kad is null and status <> 'nov';

create index if not exists idx_leadovi_pozvan on leadovi(pozvan_kad);
