-- Deko Pro Dashboard — šema baze (Supabase / Postgres)
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> nalepi -> Run.

create extension if not exists "pgcrypto";

-- ========================= LEADOVI =========================
-- Lead = potencijalni kupac koji je stigao kroz Instagram/Facebook/Viber poruke
-- (call setter ga upiše), pa ga vlasnik zove i beleži ishod.
create table if not exists leadovi (
  id             uuid primary key default gen_random_uuid(),
  ime            text,
  prezime        text,
  telefon        text,                 -- normalizovan (0XXXXXXXX)
  proizvod       text,                 -- start | plus | privat | potporni_zid | oblaganje | ostalo
  izvor          text,                 -- instagram | facebook | viber | whatsapp | sajt | preporuka | ostalo
  info           text,                 -- kontekst za vlasnika (dužina ograde, lokacija, boja, budžet, kad zvati...)
  status         text default 'nov',   -- nov | nije_se_javio | zvati_kasnije | zainteresovan | ponuda | zatvoren | propao
  podseti_kad    date,                 -- kad ga treba ponovo zvati (za „zvati kasnije")
  ishod_beleska  text,                 -- napomena posle poziva
  dodao          text,                 -- email osobe koja je unela lead (setter)
  pozvan_kad     timestamptz,          -- kad je prvi put pomeren iz „nov" (= pozvan)
  status_od      timestamptz,          -- od kad je u trenutnom ishodu
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_leadovi_status on leadovi(status);
create index if not exists idx_leadovi_created on leadovi(created_at desc);

-- ========================= RLS =========================
-- Panel je privatan: anon nema pristup; ulogovan (authenticated) sme sve.
-- Upis sa servera ide preko service_role ključa koji zaobilazi RLS.
alter table leadovi enable row level security;
drop policy if exists "auth_all_leadovi" on leadovi;
create policy "auth_all_leadovi" on leadovi for all to authenticated using (true) with check (true);
