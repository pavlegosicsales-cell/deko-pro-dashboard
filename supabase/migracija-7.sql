-- Migracija 7 (01.10.2026.): DOSIJE PO KUPCU + ponuda za ugradnju.
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> nalepi -> Run.
--
-- Svaki kupac (lead) dobija svoj dosije: ceo unos kalkulatora (da se ponuda napravi kad stigne cena
-- prevoza, a kalkulator ostane slobodan za sledećeg), da li je poruka poslata prevozniku i Paji,
-- cena prevoza, i ponuda za ugradnju (Pajin odgovor prepisan u PDF u dizajnu Gradi Lako).
-- Ponude za materijal (tabela ponude) se vezuju za dosije preko dosije_id.
create table if not exists dosijei (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid references leadovi(id) on delete set null,
  kupac              text not null,
  telefon            text,
  mesto              text,
  opis               text,                -- „Ograda 36 m · Kapućino"
  ukupno_rsd         numeric,             -- materijal sa PDV-om, za pregled
  palete             integer,
  kg                 integer,
  stanje             jsonb,               -- ceo unos kalkulatora (delovi, pretpostavke, polja ponude, Paja, telefon)
  prevoznik          text,                -- kome je poslata poruka: Rocko / Miloš / Marko
  prevoz_poslato_kad timestamptz,         -- kad je kliknuto „Pošalji na WhatsApp" ili „Kopiraj" za prevoznika
  transport_eur      numeric,             -- cena prevoza kad stigne (null = još se čeka)
  sa_istovarom       boolean default true,
  paja_poslato_kad   timestamptz,         -- kad je specifikacija poslata Paji
  ugradnja           jsonb,               -- ponuda za ugradnju (Pajin odgovor, parsiran i doteran)
  ugradnja_kad       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists idx_dosijei_lead on dosijei(lead_id) where lead_id is not null;
create index if not exists idx_dosijei_updated on dosijei(updated_at desc);

alter table dosijei enable row level security;
drop policy if exists "auth_all_dosijei" on dosijei;
create policy "auth_all_dosijei" on dosijei for all to authenticated using (true) with check (true);

alter table ponude add column if not exists dosije_id uuid references dosijei(id) on delete set null;
create index if not exists idx_ponude_dosije on ponude(dosije_id);
