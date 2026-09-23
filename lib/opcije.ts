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

export const PROIZVODI = [
  { v: "start", l: "Ograda START" },
  { v: "plus", l: "Ograda PLUS" },
  { v: "privat", l: "Ograda PRIVAT" },
  { v: "potporni_zid", l: "Potporni zid" },
  { v: "oblaganje", l: "Oblaganje / fasada" },
  { v: "dekorativni_blok", l: "Dekorativni blok" },
  { v: "ostalo", l: "Ostalo / nije sigurno" },
] as const;

export const IZVORI = [
  { v: "instagram", l: "Instagram" },
  { v: "facebook", l: "Facebook" },
  { v: "viber", l: "Viber" },
  { v: "whatsapp", l: "WhatsApp" },
  { v: "sajt", l: "Sajt (forma)" },
  { v: "preporuka", l: "Preporuka" },
  { v: "ostalo", l: "Ostalo" },
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
