-- Migracija 5 (24.09.2026.): kvalifikacija i praćenje leadova (Lukin zahtev).
-- temperatura = vruc | topao | hladan; tip_kupca = Lukina podela; rok = željeni rok;
-- razlog_odustajanja = obavezan kad ishod postane „Odustao".
alter table leadovi add column if not exists temperatura text;
alter table leadovi add column if not exists tip_kupca text;
alter table leadovi add column if not exists rok text;
alter table leadovi add column if not exists razlog_odustajanja text;
create index if not exists idx_leadovi_temperatura on leadovi(temperatura);
create index if not exists idx_leadovi_tip on leadovi(tip_kupca);
