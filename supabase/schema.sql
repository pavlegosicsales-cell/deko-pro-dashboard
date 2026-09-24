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
  proizvod       text,                 -- start | plus | privat | po_meri | dekorativni_blok | zavrsni_elementi | oblaganje | potporni_zid | ostalo | slobodan tekst
  obuhvat        text,                 -- materijal | materijal_prevoz | kljuc_u_ruke | nepoznato
  lokacija       text,                 -- mesto gde se radi ograda (obavezno za Luku)
  duzina_m       numeric,              -- ukupna dužina ograde u metrima (obavezno)
  ispuna         text,                 -- samo_blokovi | blokovi_paneli (model po Luki, obavezno)
  detalji        jsonb,                -- poželjno: boja, visine, razmak, broj blokova/kapa/okapnica, spec, budžet
  temperatura    text,                 -- vruc | topao | hladan (kvalitet leada)
  tip_kupca      text,                 -- srednja_klasa | dijaspora | bogatas | preporuka | status_selo | materijal
  rok            text,                 -- odmah | 1_3_meseca | prolece | ne_zna
  razlog_odustajanja text,             -- cena | izabrao_drugog | odlozio | komsija_pravila | ne_javlja_se | van_zone | samo_istrazivao | drugo
  izvor          text,                 -- instagram | facebook | viber | whatsapp | sajt | preporuka | ostalo
  info           text,                 -- kontekst za vlasnika (dužina ograde, lokacija, boja, budžet, kad zvati...)
  status         text default 'nov',   -- nov | nije_se_javio | zvati_kasnije | dostaviti_ponudu | ponuda (čeka odgovor) | zatvoren (kupio) | propao (odustao)
  podseti_kad    date,                 -- kad ga treba ponovo zvati (za „zvati kasnije")
  ishod_beleska  text,                 -- napomena posle poziva
  dodao          text,                 -- email osobe koja je unela lead (setter)
  pozvan_kad     timestamptz,          -- kad je prvi put pomeren iz „nov" (= pozvan)
  status_od      timestamptz,          -- od kad je u trenutnom ishodu
  prioritet      boolean default false, -- zvezdica: hitan lead (preporuka, premium…)
  zarada_rsd     numeric,               -- upisuje se kad ishod postane „Kupio"
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
