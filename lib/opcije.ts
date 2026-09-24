// Zajedničke opcije za leadove — labeli na srpskom, ključevi kao u bazi.

// Ishodi poziva (pipeline). Redosled = tok od novog leada do zatvaranja.
// Ishodi kako ih je Luka (vlasnik) zadao 23.09.2026.; ključevi zatvoren/propao ostali zbog baze.
export const STATUSI = [
  { v: "nov", l: "Novi", boja: "#2563eb" },
  { v: "nije_se_javio", l: "Nije se javio", boja: "#d97706" },
  { v: "zvati_kasnije", l: "Pozvati (datum)", boja: "#7c3aed" },
  { v: "dostaviti_ponudu", l: "Dostaviti ponudu", boja: "#0891b2" },
  { v: "ponuda", l: "Čeka odgovor na ponudu", boja: "#ca8a04" },
  { v: "zatvoren", l: "Kupio", boja: "#15a34a" },
  { v: "propao", l: "Odustao", boja: "#6b7280" },
] as const;

// Otvoreni statusi = lead je još „u igri" (za red za zvanje).
export const OTVORENI = new Set(["nov", "nije_se_javio", "zvati_kasnije", "dostaviti_ponudu", "ponuda"]);
export const ZATVORENI = new Set(["zatvoren", "propao"]);

// Po context/business details: modeli ograde (START/PLUS/PRIVAT), obuhvat (samo materijal,
// sa prevozom, ključ u ruke) i elementi. Poslednja opcija DRUGO = slobodan tekst.
export const DRUGO = "__drugo";
export const PROIZVODI = [
  { v: "start", l: "Ograda START (polje 0,8 m · stub 1,6 m)" },
  { v: "plus", l: "Ograda PLUS (polje 0,8 m · stub 1,6 m, stubni blok + kape)" },
  { v: "privat", l: "Ograda PRIVAT (polje 1,8 m · stub 2,0 m)" },
  { v: "po_meri", l: "Ograda po meri (drugačije mere)" },
  { v: "dekorativni_blok", l: "Samo blokovi (bez modela)" },
  { v: "zavrsni_elementi", l: "Stubni blok / kape / okapnice" },
  { v: "oblaganje", l: "Dekorativna obloga (fasada)" },
  { v: "potporni_zid", l: "Potporni zid" },
  { v: "ostalo", l: "Nije siguran / još ne zna" },
] as const;

// Obuhvat = šta kupac kupuje (business details, deo 5). Važi za svaki model.
export const OBUHVATI = [
  { v: "materijal", l: "Samo materijal (preuzima u Mladenovcu)", k: "Materijal" },
  { v: "materijal_prevoz", l: "Materijal sa prevozom i istovarom", k: "Sa prevozom" },
  { v: "kljuc_u_ruke", l: "Ključ u ruke (materijal + prevoz + ugradnja)", k: "Ključ u ruke" },
  { v: "nepoznato", l: "Još ne zna", k: "Obuhvat?" },
] as const;
export const obuhvatKratko = (v: string | null | undefined) => OBUHVATI.find((o) => o.v === v)?.k ?? null;

// Izvori za ručni unos. „sajt" ne nudimo u formi: lead sa sajta stiže sam preko /api/lead.
// Viber/WhatsApp su kanali za kontakt (dugmad na kartici), ne izvori (odluka Pavla, 24.09.2026.).
export const IZVORI = [
  { v: "instagram", l: "Instagram" },
  { v: "facebook", l: "Facebook" },
  { v: "kupujemprodajem", l: "KupujemProdajem" },
  { v: "preporuka", l: "Preporuka" },
  { v: "ostalo", l: "Ostalo" },
] as const;

// Svi poznati izvori (i stari / automatski) — samo za prikaz oznake na kartici i u analitici.
export const SVI_IZVORI = [
  ...IZVORI,
  { v: "sajt", l: "Sajt (forma)" },
  { v: "viber", l: "Viber" },
  { v: "whatsapp", l: "WhatsApp" },
] as const;

// Proizvod može biti i slobodan tekst: ako se poklapa sa ponuđenim (po ključu ili nazivu) čuva se ključ.
export const normalizujProizvod = (v: string | null | undefined): string | null => {
  const t = (v ?? "").trim(); if (!t) return null;
  const p = PROIZVODI.find((o) => o.v === t || o.l.toLowerCase() === t.toLowerCase());
  return p ? p.v : t;
};

export const label = (arr: readonly { v: string; l: string }[], v: string | null | undefined) =>
  arr.find((o) => o.v === v)?.l ?? v ?? "—";

// Osnovni podaci firme (za prikaz i poruke)
export const BIZNIS = {
  naziv: "Deko Pro",
  pun: "Dekorativni blok Deko Pro",
  telefon: "062 253 140",
};
