-- Migracija 3 (24.09.2026.): obuhvat ponude (samo materijal / sa prevozom / ključ u ruke),
-- zasebno od modela ograde. Pokreni u Supabase SQL editoru.
alter table leadovi add column if not exists obuhvat text;

-- Stare vrednosti proizvoda koje su zapravo bile obuhvat:
update leadovi set obuhvat = 'kljuc_u_ruke', proizvod = 'po_meri' where proizvod = 'kljuc_u_ruke';
update leadovi set obuhvat = 'materijal_prevoz', proizvod = 'dekorativni_blok' where proizvod = 'materijal_prevoz';
