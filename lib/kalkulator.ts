/*
  Kalkulator materijala za ogradu od dekorativnog bloka (Lukin zahtev, 26.09.2026.).

  Izvori: DEKO_PRO_Cenovnik_A4.pdf (cene), tehnički list (19×19×39, 18 kg, 72/paleta,
  12,5 kom/m²), priručnik („ranije kalkulacije koriste modul 20 × 40 cm" = blok + fuga).

  Pravilo mere (Luka): RAZMAK IZMEĐU STUBOVA se meri od kraja do kraja stubnog bloka
  (čisto polje), NE od ose stuba.

  Geometrija (prav potez):
    stubovi = polja + 1 (+ po jedan dodatni stub za svaki otvor / kapiju)
    dužina zidanog dela L = stubovi × modulStub + Σ polja
    zidni blok u redu = polje / modulDužina (0,40 m); redova = visina / modulVisina (0,20 m)
    stubni blok = po jedan po redu stuba; redova = visinaStuba / 0,20
    okapnica 50 cm = 2 kom po metru zida (preko polja); kapa = 1 po stubu

  Sve pretpostavke su u PODRAZUMEVANO i mogu se menjati u UI (Luka potvrđuje).
*/

export type Boja = "natur_siva" | "zuta" | "braon" | "oranz" | "crvena" | "zelena" | "crna" | "kapucino" | "multikolor_rok" | "multikolor_rast";

// Cenovnik, RSD/kom (DEKO_PRO_Cenovnik_A4.pdf). Partnerske: zidni -25, stubni -10 (INTERNO).
export const CENOVNIK: { v: Boja; l: string; zidni: number; stubni: number }[] = [
  { v: "natur_siva", l: "Natur siva", zidni: 420, stubni: 520 },
  { v: "zuta", l: "Žuta", zidni: 460, stubni: 560 },
  { v: "braon", l: "Braon", zidni: 460, stubni: 560 },
  { v: "oranz", l: "Oranž", zidni: 460, stubni: 560 },
  { v: "crvena", l: "Crvena", zidni: 460, stubni: 560 },
  { v: "zelena", l: "Zelena", zidni: 460, stubni: 560 },
  { v: "crna", l: "Crna", zidni: 460, stubni: 560 },
  { v: "kapucino", l: "Kapućino", zidni: 560, stubni: 720 },
  { v: "multikolor_rok", l: "Multikolor Rok", zidni: 580, stubni: 780 },
  { v: "multikolor_rast", l: "Multikolor Rast", zidni: 580, stubni: 780 },
];

export type Podesavanja = {
  modulDuzina: number;   // m, zidni blok + fuga (0,39 + 0,01)
  modulVisina: number;   // m, red bloka + fuga (0,19 + 0,01)
  modulStub: number;     // m, širina stubnog bloka + fuga (0,39 + 0,01)
  okapnicaDuzina: number; // m, 0,50 → 2 kom/m
  cenaOkapnica: number;  // RSD
  cenaKapa: number;      // RSD
  tezinaZidni: number;   // kg (tehnički list: 18)
  tezinaStubni: number;  // kg [potvrditi] — procena, stubni je ~2× zapremine zidnog
  paleta: number;        // kom zidnog po paleti (tehnički list: 72)
  rezervaPct: number;    // % rezerve za lom i sečenje (0 = bez)
  partnerske: boolean;   // interne cene za saradnike
};

export const PODRAZUMEVANO: Podesavanja = {
  modulDuzina: 0.40, modulVisina: 0.20, modulStub: 0.40, okapnicaDuzina: 0.50,
  cenaOkapnica: 680, cenaKapa: 1290,
  tezinaZidni: 18, tezinaStubni: 36, paleta: 72,
  rezervaPct: 0, partnerske: false,
};

export type Ulaz = {
  duzina: number;        // m, ukupna dužina ZIDANOG dela (bez širine kapija/otvora)
  razmak: number;        // m, čisto polje između stubova (kraj do kraja stubnog bloka)
  visinaPolja: number;   // m
  visinaStuba: number;   // m (bez kape)
  otvori: number;        // broj kapija/otvora u potezu (svaki dodaje jedan stub)
  zatvoren: boolean;     // zatvoren obim (npr. oko placa): stubovi = polja
  boja: Boja;
};

export type Stavka = { naziv: string; kom: number; cena: number; ukupno: number };
export type Rezultat = {
  polja: number; stubovi: number;
  stvarniRazmak: number;        // m, kad se dužina ne deli tačno, polja se ravnomerno prilagode
  redovaPolja: number; redovaStuba: number;
  stvarnaVisinaPolja: number; stvarnaVisinaStuba: number;
  duzinaZida: number;           // m, zbir polja
  zidni: number; stubni: number; okapnice: number; kape: number;
  zidniBezRezerve: number; stubniBezRezerve: number;
  stavke: Stavka[]; ukupno: number;
  tezinaKg: number; paleteZidni: number; m2Zida: number;
  napomene: string[];
};

const r2 = (x: number) => Math.round(x * 100) / 100;

export function izracunaj(u: Ulaz, p: Podesavanja = PODRAZUMEVANO): Rezultat {
  const napomene: string[] = [];
  const L = Math.max(0, u.duzina), R = Math.max(0.1, u.razmak);

  // 1) raspored stubova i polja duž poteza
  // prav potez: L = (polja + 1 + otvori) × modulStub + polja × R  →  polja = (L − (1 + otvori) × modulStub) / (R + modulStub)
  // zatvoren obim: L = polja × modulStub + polja × R
  const fiksniStubovi = u.zatvoren ? 0 : 1 + Math.max(0, u.otvori);
  const poljaTacno = (L - fiksniStubovi * p.modulStub) / (R + p.modulStub);
  const polja = Math.max(1, Math.round(poljaTacno));
  const stubovi = u.zatvoren ? polja + Math.max(0, u.otvori) : polja + 1 + Math.max(0, u.otvori);
  const duzinaZida = Math.max(0, L - stubovi * p.modulStub);
  const stvarniRazmak = duzinaZida / polja;
  if (Math.abs(stvarniRazmak - R) > 0.02) napomene.push(`Dužina se ne deli tačno na polja od ${R} m: sa ${polja} polja stvarni razmak je ${r2(stvarniRazmak)} m (raspodeljeno ravnomerno).`);

  // 2) visine u redovima (modul 20 cm)
  const redovaPolja = Math.max(1, Math.ceil(u.visinaPolja / p.modulVisina - 1e-9));
  const redovaStuba = Math.max(1, Math.ceil(u.visinaStuba / p.modulVisina - 1e-9));
  const stvarnaVisinaPolja = redovaPolja * p.modulVisina, stvarnaVisinaStuba = redovaStuba * p.modulVisina;
  if (Math.abs(stvarnaVisinaPolja - u.visinaPolja) > 0.005) napomene.push(`Visina polja zaokružena na ${r2(stvarnaVisinaPolja)} m (${redovaPolja} redova po 20 cm).`);
  if (Math.abs(stvarnaVisinaStuba - u.visinaStuba) > 0.005) napomene.push(`Visina stuba zaokružena na ${r2(stvarnaVisinaStuba)} m (${redovaStuba} redova po 20 cm).`);
  if (stvarnaVisinaStuba < stvarnaVisinaPolja) napomene.push("Stub je niži od polja — proveri visine.");

  // 3) količine
  const zidniPoRedu = duzinaZida / p.modulDuzina;                 // može biti razlomak (sečeni blokovi)
  const zidniBezRezerve = Math.ceil(zidniPoRedu * redovaPolja - 1e-9);
  const stubniBezRezerve = stubovi * redovaStuba;
  const rez = 1 + Math.max(0, p.rezervaPct) / 100;
  const zidni = Math.ceil(zidniBezRezerve * rez - 1e-9);
  const stubni = Math.ceil(stubniBezRezerve * rez - 1e-9);
  const okapnice = Math.ceil(duzinaZida / p.okapnicaDuzina - 1e-9);
  const kape = stubovi;
  const m2Zida = duzinaZida * stvarnaVisinaPolja;

  // 4) cene
  const c = CENOVNIK.find((x) => x.v === u.boja) ?? CENOVNIK[0];
  const cenaZidni = c.zidni - (p.partnerske ? 25 : 0), cenaStubni = c.stubni - (p.partnerske ? 10 : 0);
  const stavke: Stavka[] = [
    { naziv: `Dekorativni blok ${c.l} 19×19×39 cm`, kom: zidni, cena: cenaZidni, ukupno: zidni * cenaZidni },
    { naziv: `Dekorativni stubni blok ${c.l} 19×39×39 cm`, kom: stubni, cena: cenaStubni, ukupno: stubni * cenaStubni },
    { naziv: "Betonska okapnica 50×30 cm", kom: okapnice, cena: p.cenaOkapnica, ukupno: okapnice * p.cenaOkapnica },
    { naziv: "Betonska kapa 50×50 cm", kom: kape, cena: p.cenaKapa, ukupno: kape * p.cenaKapa },
  ];
  const ukupno = stavke.reduce((s, x) => s + x.ukupno, 0);

  return {
    polja, stubovi, stvarniRazmak: r2(stvarniRazmak), redovaPolja, redovaStuba,
    stvarnaVisinaPolja: r2(stvarnaVisinaPolja), stvarnaVisinaStuba: r2(stvarnaVisinaStuba),
    duzinaZida: r2(duzinaZida), zidni, stubni, okapnice, kape, zidniBezRezerve, stubniBezRezerve,
    stavke, ukupno, tezinaKg: Math.round(zidni * p.tezinaZidni + stubni * p.tezinaStubni),
    paleteZidni: Math.ceil(zidni / p.paleta), m2Zida: r2(m2Zida), napomene,
  };
}

// Tekst specifikacije za ponudu / poruku (bez dizajna, čisto za kopiranje).
export function specifikacijaTekst(u: Ulaz, r: Rezultat): string {
  const rsd = (n: number) => new Intl.NumberFormat("sr-RS").format(n) + " RSD";
  return [
    `Ograda: ${u.duzina} m zidanog dela, polje ${r.stvarnaVisinaPolja} m, stub ${r.stvarnaVisinaStuba} m, razmak ${r.stvarniRazmak} m (kraj do kraja stuba)`,
    `Raspored: ${r.polja} polja, ${r.stubovi} stubova${u.otvori ? `, ${u.otvori} otvor(a)` : ""}${u.zatvoren ? ", zatvoren obim" : ""}`,
    "",
    ...r.stavke.map((s) => `${s.naziv}: ${s.kom} kom × ${rsd(s.cena)} = ${rsd(s.ukupno)}`),
    "",
    `Ukupno materijal: ${rsd(r.ukupno)}`,
    `Težina ≈ ${r.tezinaKg} kg · zidni blok ${r.paleteZidni} paleta (72/paleta)`,
  ].join("\n");
}
