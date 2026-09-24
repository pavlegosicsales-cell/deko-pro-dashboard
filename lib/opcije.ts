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
// ŠTA GRADI (grana wizarda). Ograda otvara dužinu, ispunu i model; ostalo traži količinu i opis.
export const PROIZVODI = [
  { v: "ograda", l: "Ograda", opis: "Dužina, samo blokovi ili sa panelima, model" },
  { v: "potporni_zid", l: "Potporni zid", opis: "Dužina i visina zida" },
  { v: "oblaganje", l: "Oblaganje / fasada", opis: "Kvadratura" },
] as const;
// Stare vrednosti proizvoda (pre wizarda) — samo za prikaz oznake.
export const SVI_PROIZVODI = [
  ...PROIZVODI,
  { v: "start", l: "Ograda START" }, { v: "plus", l: "Ograda PLUS" }, { v: "privat", l: "Ograda PRIVAT" }, { v: "po_meri", l: "Ograda po meri" },
  { v: "dekorativni_blok", l: "Blokovi" }, { v: "zavrsni_elementi", l: "Stubni blok / kape / okapnice" }, { v: "ostalo", l: "Nije siguran" },
] as const;

// MODEL ograde po sajtu (mere). Poželjno; pola kupaca ne zna.
export const MODELI = [
  { v: "start", l: "START (polje 0,8 · stub 1,6)" },
  { v: "plus", l: "PLUS (0,8 · 1,6, stubni blok)" },
  { v: "privat", l: "PRIVAT (1,8 · 2,0)" },
  { v: "po_meri", l: "Po meri" },
] as const;
export const modelLabel = (v: string | null | undefined) => MODELI.find((o) => o.v === v)?.l.replace(/\s*\(.*\)$/, "") ?? null;

// Obuhvat = šta kupac kupuje (business details, deo 5). Važi za svaki model.
export const OBUHVATI = [
  { v: "materijal", l: "Samo materijal (preuzima u Mladenovcu)", k: "Materijal" },
  { v: "materijal_prevoz", l: "Materijal sa prevozom i istovarom", k: "Sa prevozom" },
  { v: "kljuc_u_ruke", l: "Ključ u ruke (materijal + prevoz + ugradnja)", k: "Ključ u ruke" },
  { v: "nepoznato", l: "Još ne zna", k: "Obuhvat?" },
] as const;
// Model ograde po Luki: samo od blokova, ili blokovi + paneli (ispune).
export const MODELI_OGRADE = [
  { v: "samo_blokovi", l: "Samo od blokova", k: "samo blokovi" },
  { v: "blokovi_paneli", l: "Blokovi + paneli", k: "blokovi + paneli" },
] as const;
export const modelKratko = (v: string | null | undefined) => MODELI_OGRADE.find((o) => o.v === v)?.k ?? null;

// Boje bloka iz cenovnika (business details, deo 4).
export const BOJE = ["Natur siva", "Žuta", "Braon", "Oranž", "Crvena", "Zelena", "Crna", "Kapučino", "Multikolor Rok", "Multikolor Rast"] as const;

// Poželjni detalji za ponudu (JSON kolona `detalji`). Redosled = redosled u formi i na kartici.
export const DETALJI = [
  { k: "model", l: "Model", tip: "tekst" },
  { k: "boja", l: "Boja bloka", tip: "boja" },
  { k: "kolicina", l: "Količina", tip: "tekst" },
  { k: "visina_stuba", l: "Visina stuba", tip: "m" },
  { k: "visina_polja", l: "Visina polja", tip: "m" },
  { k: "razmak_stubova", l: "Razmak stubova", tip: "m" },
  { k: "br_blokova", l: "Zidnih blokova", tip: "kom" },
  { k: "br_stubnih", l: "Stubnih blokova", tip: "kom" },
  { k: "br_kapa", l: "Kapa", tip: "kom" },
  { k: "br_okapnica", l: "Okapnica", tip: "kom" },
  { k: "spec_materijala", l: "Specifikacija materijala", tip: "tekst" },
  { k: "budzet", l: "Okvirni budžet", tip: "tekst" },
  { k: "pristup", l: "Pristup za kamion / istovar", tip: "tekst" },
] as const;
export type Detalji = Partial<Record<(typeof DETALJI)[number]["k"], string>>;

// Šta Luka traži kao obavezno pre poziva (Lukina poruka 24.09.2026.). Dužina i
// „samo blokovi / sa panelima" važe samo kad gradi ogradu.
export function staFali(l: { ime?: string | null; prezime?: string | null; telefon?: string | null; lokacija?: string | null; obuhvat?: string | null; proizvod?: string | null; duzina_m?: number | null; ispuna?: string | null }): string[] {
  const f: string[] = [];
  if (!l.ime && !l.prezime) f.push("ime");
  if (!l.telefon) f.push("telefon");
  if (!l.lokacija) f.push("lokacija");
  if (!l.obuhvat || l.obuhvat === "nepoznato") f.push("obuhvat");
  if (!l.proizvod) f.push("šta gradi");
  if (l.proizvod === "ograda") {
    if (l.duzina_m == null) f.push("dužina");
    if (!l.ispuna) f.push("samo blokovi / sa panelima");
  }
  return f;
}

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

// ===== Kvalifikacija (Lukin zahtev 24.09.2026.): temperatura, tip kupca, rok, razlog odustajanja =====

// Kvalitet leada = „dobar / loš / sranje", pristojno nazvano. Pavle daje prvu ocenu, Luka menja posle poziva.
export const TEMPERATURE = [
  { v: "vruc", l: "Vruć", boja: "#B3261E", opis: "Rok do mesec dana, ima mere, zna šta hoće" },
  { v: "topao", l: "Topao", boja: "#A8823A", opis: "1–3 meseca, ozbiljan, skuplja podatke" },
  { v: "hladan", l: "Hladan", boja: "#5A7096", opis: "Samo pita cenu, istražuje" },
] as const;
export const temperatura = (v: string | null | undefined) => TEMPERATURE.find((t) => t.v === v) ?? null;

// Tip kupca po Lukinoj podeli (Pavlovi nazivi, 24.09.2026.). Interno, kupac ovo ne vidi.
export const TIPOVI_KUPCA = [
  { v: "srednja_klasa", l: "Srednja klasa", opis: "Predgrađe, pita cenu po metru, poredi, pominje suprugu" },
  { v: "dijaspora", l: "Dijaspora", opis: "Broj iz DE/AT/CH, „biću dole za Božić“" },
  { v: "bogatas", l: "Bogataš", opis: "Elitna lokacija, kratke poruke, pita termin a ne cenu" },
  { v: "preporuka", l: "Preporuka", opis: "„Jel si ti Luka?“, „kum mi je rekao“" },
  { v: "status_selo", l: "Seljak (status)", opis: "Selo, „hoću najveću ogradu“, ne pita cenu" },
  { v: "materijal", l: "Kupac materijala", opis: "Pita težinu, lepljenje, cenu po komadu, „imam majstora“" },
] as const;

// Željeni rok. Od novembra ugradnja ide na prolećne termine (zidanje staje ispod ~5 °C).
export const ROKOVI = [
  { v: "odmah", l: "Odmah" },
  { v: "1_3_meseca", l: "1–3 meseca" },
  { v: "prolece", l: "Proleće" },
  { v: "ne_zna", l: "Ne zna" },
] as const;

// Razlog odustajanja, obavezan kad ishod postane „Odustao".
export const RAZLOZI = [
  { v: "cena", l: "Cena" },
  { v: "izabrao_drugog", l: "Izabrao drugog" },
  { v: "odlozio", l: "Odložio" },
  { v: "komsija_pravila", l: "Komšija / pravila" },
  { v: "ne_javlja_se", l: "Ne javlja se" },
  { v: "van_zone", l: "Van zone" },
  { v: "samo_istrazivao", l: "Samo istraživao" },
  { v: "drugo", l: "Drugo" },
] as const;

// Predlog temperature iz podataka koje Pavle već unese (može da se pregazi ručno).
export function predloziTemperaturu(x: { rok?: string | null; duzina_m?: number | null; lokacija?: string | null; obuhvat?: string | null }): "vruc" | "topao" | "hladan" {
  const imaPodatke = x.duzina_m != null && !!x.lokacija;
  if (x.rok === "odmah") return imaPodatke ? "vruc" : "topao";
  if (x.rok === "1_3_meseca") return "topao";
  if (x.rok === "prolece") return imaPodatke ? "topao" : "hladan";
  return imaPodatke || x.obuhvat === "kljuc_u_ruke" ? "topao" : "hladan";
}
