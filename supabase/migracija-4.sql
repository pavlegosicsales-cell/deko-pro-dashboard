-- Migracija 4 (24.09.2026.): Lukin spisak informacija pred poziv.
-- Obavezno: lokacija, dužina ograde, model (samo blokovi / blokovi + paneli).
-- Poželjno (JSON): boja, visina stuba/polja, razmak stubova, broj blokova/stubnih/kapa/okapnica, spec, budžet.
alter table leadovi add column if not exists lokacija text;
alter table leadovi add column if not exists duzina_m numeric;
alter table leadovi add column if not exists ispuna text;
alter table leadovi add column if not exists detalji jsonb;
