-- Migracija 4 (24.09.2026.): Lukin spisak informacija pred poziv.
-- Obavezno: lokacija, dužina ograde, model (samo blokovi / blokovi + paneli).
-- Poželjno (JSON): boja, visina stuba/polja, razmak stubova, broj blokova/stubnih/kapa/okapnica, spec, budžet.
alter table leadovi add column if not exists lokacija text;
alter table leadovi add column if not exists duzina_m numeric;
alter table leadovi add column if not exists ispuna text;
alter table leadovi add column if not exists detalji jsonb;

-- Stare vrednosti „proizvod" (pre wizarda): model ograde ide u detalji.model, proizvod postaje „ograda".
update leadovi set detalji = coalesce(detalji, '{}'::jsonb) || jsonb_build_object('model', proizvod), proizvod = 'ograda'
  where proizvod in ('start', 'plus', 'privat', 'po_meri');
update leadovi set proizvod = 'Blokovi' where proizvod = 'dekorativni_blok';
update leadovi set proizvod = 'Stubni blok / kape / okapnice' where proizvod = 'zavrsni_elementi';
update leadovi set proizvod = null where proizvod = 'ostalo';
