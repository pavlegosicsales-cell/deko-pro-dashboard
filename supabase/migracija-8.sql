-- Migracija 8 (01.10.2026.): tabela `tajne` za Higgsfield token koji se osvežava sa servera.
-- Pokreni u Supabase: Dashboard -> SQL Editor -> New query -> nalepi -> Run.
-- Bez nje vizuelizacija radi dok traje token iz env-a (24 h) i dok traje proces; sa njom novi token
-- (posle osvežavanja) preživi redeploy. Kolona `dvoriste` u dosijeu nije potrebna: ide u ugradnja jsonb.
create table if not exists tajne (
  kljuc     text primary key,
  vrednost  text,
  updated_at timestamptz not null default now()
);
