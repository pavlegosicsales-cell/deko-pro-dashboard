-- Migracija 6 (30.09.2026.): tab „Ponude" — sve napravljene ponude na jednom mestu.
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> nalepi -> Run.
-- Redovi ponude se čuvaju onako kako su poslati (redovi jsonb), pa kasnija promena
-- cenovnika ne menja ono što kupac već ima. „adresa" je upit kalkulatora, da se
-- ponuda može ponovo otvoriti i preračunati ako treba.
create table if not exists ponude (
  id             uuid primary key default gen_random_uuid(),
  broj           text not null,          -- „185/26", upisuje se ručno
  datum          text not null,          -- „28.09.2026."
  kupac          text not null,
  mesto          text,
  rezim          text,                   -- ograda | zid | obloga | rucno
  ukupno_rsd     numeric not null,
  transport_eur  numeric,                -- null = bez transporta
  sa_istovarom   boolean default true,
  sastavio       text,
  redovi         jsonb not null,         -- [{naziv, jedinica, cena, kolicina, ukupno}]
  adresa         text,                   -- upit /ponuda?... iz koga je ponuda napravljena
  lead_id        uuid references leadovi(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ponude_created on ponude(created_at desc);
create index if not exists idx_ponude_broj on ponude(broj);

alter table ponude enable row level security;
drop policy if exists "auth_all_ponude" on ponude;
create policy "auth_all_ponude" on ponude for all to authenticated using (true) with check (true);
