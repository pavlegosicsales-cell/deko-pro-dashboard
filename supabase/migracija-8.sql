-- Migracija 8 (02.10.2026.): tab „Paja" + obaveštenja na telefon.
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> nalepi -> Run.
--
-- 1) dosijei.paja: šablon poruka za Paju po kupcu i njegov tekstualni odgovor (ponuda za ugradnju).
--    { poruka, poruka_kad, odgovor, odgovor_kad }  — kupac ne mora da bude lead (dosije bez lead_id).
alter table dosijei add column if not exists paja jsonb;

-- 2) pretplate: Web Push pretplate uređaja (Pavle, Luka, Paja). Jedna po uređaju/pregledaču.
create table if not exists pretplate (
  id          uuid primary key default gen_random_uuid(),
  ko          text not null,                 -- pavle | luka | paja
  endpoint    text not null unique,
  pretplata   jsonb not null,                -- ceo PushSubscription JSON
  created_at  timestamptz not null default now()
);
