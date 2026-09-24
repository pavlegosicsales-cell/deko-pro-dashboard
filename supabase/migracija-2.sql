-- Migracija 2 (23.09.2026.): kad je lead prvi put pomeren iz „Novi" (= pozvan).
-- Pokreni u Supabase SQL editoru ako je schema.sql pokrenut pre ove kolone.
alter table leadovi add column if not exists pozvan_kad timestamptz;
-- Od kad je lead u trenutnom ishodu (menja se samo pri promeni ishoda, ne pri beleški).
alter table leadovi add column if not exists status_od timestamptz;
-- Zvezdica (prioritetan lead) i zarada kad je „Kupio".
alter table leadovi add column if not exists prioritet boolean default false;
alter table leadovi add column if not exists zarada_rsd numeric;
update leadovi set status_od = coalesce(status_od, updated_at);

-- Popuni za postojeće leadove koji su već pomereni iz „nov" (najbolja procena = updated_at).
update leadovi set pozvan_kad = updated_at where pozvan_kad is null and status <> 'nov';

create index if not exists idx_leadovi_pozvan on leadovi(pozvan_kad);

-- Ishod „zainteresovan" zamenjen sa „dostaviti_ponudu" (Lukin spisak ishoda).
update leadovi set status = 'dostaviti_ponudu' where status = 'zainteresovan';
