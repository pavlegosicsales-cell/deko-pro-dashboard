/*
  Kalkulator materijala za Deko Pro ponude.

  Izvor pravila: „Deko Pro – pravila za računanje ograda, zidova i obloga" (Luka + Pavle, 27.09.2026.),
  kopija u ../Deko-Pro-Biznis/znanje/pravila-racunanja.md. Cene iz DEKO_PRO_Cenovnik_A4.pdf (sa PDV-om).

  Obavezna pravila:
  1. Računa se na TAČNU dužinu i visinu koju klijent da; polja se rasporede po celoj dužini,
     pa stvarni razmak može malo da odstupi od traženog.
  2. Na svaku stavku ide +5 % („bolje malo previše nego premalo").
  3. Konačna količina se zaokružuje na NAJBLIŽI ceo broj (92,4 → 92; 11,55 → 12).
  4. Visina mora biti ceo broj redova od 20 cm; ako nije, nude se dve najbliže opcije.

  Dimenzije sa fugom ~1 cm: zidni blok lice 20 × 40 cm (12,5 kom/m², 2,5 kom po dužnom metru reda),
  stubni blok stub širok 40 cm, red visok 20 cm; okapnica 50 cm (2 kom/m); kapa 1 po stubu.
*/

export type Boja =
  | "natur_siva" | "zuta" | "braon" | "oranz" | "crvena" | "zelena" | "crna"
  | "kapucino" | "multikolor_rok" | "multikolor_rast";
export type BojaZavrsnih = "siva" | "crna" | "bela";
export type Rezim = "ograda" | "zid" | "obloga";

// Cenovnik, RSD/kom, sa PDV-om (DEKO_PRO_Cenovnik_A4.pdf; Luka potvrdio PDV 26.09.2026.)
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
export const ZAVRSNE_BOJE: { v: BojaZavrsnih; l: string }[] = [
  { v: "siva", l: "Siva" }, { v: "crna", l: "Crna" }, { v: "bela", l: "Bela" },
];
export const bojaNaziv = (b: Boja) => CENOVNIK.find((c) => c.v === b)?.l ?? b;
export const zavrsnaNaziv = (b: BojaZavrsnih) => ZAVRSNE_BOJE.find((c) => c.v === b)?.l ?? b;

export type Podesavanja = {
  modulDuzina: number;    // m, lice bloka sa fugom (0,40)
  modulVisina: number;    // m, red sa fugom (0,20)
  modulStub: number;      // m, širina stuba sa fugom (0,40)
  okapnicaDuzina: number; // m, 0,50 → 2 kom/m
  cenaOkapnica: number;   // RSD
  cenaKapa: number;       // RSD
  cenaObloga: number | null; // RSD/m² sa PDV-om; potvrdio Luka 28.09.2026. (null = ne računaj cenu)
  tezinaZidni: number;    // kg (tehnički list: 18)
  tezinaStubni: number;   // kg [potvrditi]
  tezinaObloga: number;   // kg (procena ~8)
  paleta: number;         // kom zidnog po paleti (72)
  rezervaPct: number;     // OBAVEZNO 5 %
  partnerske: boolean;    // interne cene za saradnike (zidni −25, stubni −10)
};

export const PODRAZUMEVANO: Podesavanja = {
  modulDuzina: 0.40, modulVisina: 0.20, modulStub: 0.40, okapnicaDuzina: 0.50,
  cenaOkapnica: 680, cenaKapa: 1290, cenaObloga: 1174,
  tezinaZidni: 18, tezinaStubni: 36, tezinaObloga: 8, paleta: 72,
  rezervaPct: 5, partnerske: false,
};

export type Ulaz = {
  rezim: Rezim;
  // ograda i zid
  duzina: number;          // m, ukupna dužina (uključuje stubove)
  visinaPolja: number;     // m (kod zida: visina zida)
  visinaStuba: number;     // m (samo ograda)
  razmak: number;          // m, željeni svetli otvor između stubova (samo ograda)
  sirinaKapija: number;    // m, ukupna širina kapija i otvora; oduzima se od zidanog dela
  zatvoren: boolean;       // zatvoren obim: stubova koliko i polja
  spojena: boolean;        // nastavlja se na drugu ogradu: jedan stub manje (zajednički)
  saOkapnicama: boolean;   // kod punog zida okapnice nisu obavezne
  // obloga
  povrsina: number;        // m²
  // zajedničko
  boja: Boja;
  bojaZavrsnih: BojaZavrsnih;
  mesto: string;
};

export const POCETNI_ULAZ: Ulaz = {
  rezim: "ograda", duzina: 20, visinaPolja: 0.8, visinaStuba: 1.6, razmak: 2,
  sirinaKapija: 0, zatvoren: false, spojena: false, saOkapnicama: true,
  povrsina: 10, boja: "natur_siva", bojaZavrsnih: "siva", mesto: "",
};

export type Stavka = {
  naziv: string; opis: string; kom: number; jedinica: string;
  cena: number | null; ukupno: number | null;
  jedinicaCene?: string;  // podrazumevano „kom"; obloga se naplaćuje po m²
  dodatak?: string;       // uz količinu, npr. „8,16 m²"
};
export type Rezultat = {
  rezim: Rezim;
  polja: number; stubovi: number; stvarniRazmak: number;
  redovaPolja: number; redovaStuba: number;
  duzinaZida: number;      // m, zidani deo (bez stubova i kapija)
  m2: number;
  stavke: Stavka[]; ukupno: number; cenaNepotpuna: boolean;
  tezinaKg: number; palete: number;
  napomene: string[]; racun: string[];
};

const r2 = (x: number) => Math.round(x * 100) / 100;
const zaokruzi = (x: number) => Math.round(x - 1e-9);   // pravilo 3: na najbliži ceo broj
const rsdFmt = (n: number) => new Intl.NumberFormat("sr-RS").format(Math.round(n));

/** Visina u redovima od 20 cm. Ako nije ceo broj redova, vraća dve najbliže opcije. */
export function redoviZaVisinu(visina: number, modul = 0.20) {
  const tacno = visina / modul;
  const dole = Math.max(1, Math.floor(tacno + 1e-9));
  const gore = dole + 1;
  const jeCeo = Math.abs(tacno - Math.round(tacno)) < 1e-6;
  return {
    redova: jeCeo ? Math.max(1, Math.round(tacno)) : dole,
    jeCeo,
    opcije: jeCeo ? [] : [{ redova: dole, visina: r2(dole * modul) }, { redova: gore, visina: r2(gore * modul) }],
  };
}

/** Obim placa iz površine u arima (kvadratni plac). 1 ar = 100 m². */
export const obimPlaca = (ari: number) => r2(4 * Math.sqrt(Math.max(0, ari) * 100));

export function izracunaj(u: Ulaz, p: Podesavanja = PODRAZUMEVANO): Rezultat {
  const rez = 1 + Math.max(0, p.rezervaPct) / 100;
  const c = CENOVNIK.find((x) => x.v === u.boja) ?? CENOVNIK[0];
  const cenaZidni = c.zidni - (p.partnerske ? 25 : 0);
  const cenaStubni = c.stubni - (p.partnerske ? 10 : 0);
  const napomene: string[] = [];
  const racun: string[] = [];
  const stavke: Stavka[] = [];

  // ---------- OBLOGA ----------
  if (u.rezim === "obloga") {
    const m2 = Math.max(0, u.povrsina);
    const kom = zaokruzi(m2 * 12.5 * rez);
    const m2Naplata = r2(kom / 12.5);   // naplaćuje se kvadratura koja se stvarno dostavlja, sa rezervom
    racun.push(`${m2} m² × 12,5 kom/m² × ${1 + p.rezervaPct / 100} = ${kom} kom (${m2Naplata} m²)`);
    if (p.cenaObloga != null) racun.push(`${m2Naplata} m² × ${p.cenaObloga} din/m² = ${Math.round(m2Naplata * p.cenaObloga)} din`);
    else napomene.push("Cena obloge nije upisana. Po cenovniku je 1.174 din/m² sa PDV-om.");
    stavke.push({
      naziv: "Dekorativna obloga", opis: "5 × 19 × 39 cm", kom, jedinica: "obloga",
      cena: p.cenaObloga, jedinicaCene: "m²", dodatak: `${m2Naplata} m²`,
      ukupno: p.cenaObloga != null ? Math.round(m2Naplata * p.cenaObloga) : null,
    });
    const ukupno = stavke.reduce((s, x) => s + (x.ukupno ?? 0), 0);
    return {
      rezim: "obloga", polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja: 0, redovaStuba: 0,
      duzinaZida: 0, m2: r2(m2), stavke, ukupno, cenaNepotpuna: p.cenaObloga == null,
      tezinaKg: Math.round(kom * p.tezinaObloga), palete: 0, napomene, racun,
    };
  }

  // ---------- redovi ----------
  const rp = redoviZaVisinu(u.visinaPolja, p.modulVisina);
  if (!rp.jeCeo) napomene.push(`Visina ${u.visinaPolja} m nije ceo broj redova. Ponudi ${rp.opcije[0].redova} redova (${rp.opcije[0].visina} m) ili ${rp.opcije[1].redova} redova (${rp.opcije[1].visina} m). Uz okapnicu polje dobije još nekoliko cm.`);
  const redovaPolja = rp.redova;

  // ---------- PUN ZID ----------
  if (u.rezim === "zid") {
    const L = Math.max(0, u.duzina);
    const zidni = zaokruzi((L / p.modulDuzina) * redovaPolja * rez);
    racun.push(`Zidni: (${L} / ${p.modulDuzina}) × ${redovaPolja} redova × ${rez} = ${zidni} kom`);
    stavke.push({ naziv: `Zidni blok ${bojaNaziv(u.boja)}`, opis: "19 × 19 × 39 cm", kom: zidni, jedinica: "blokova", cena: cenaZidni, ukupno: zidni * cenaZidni });
    if (u.saOkapnicama) {
      const okapnice = zaokruzi((L / p.okapnicaDuzina) * rez);
      racun.push(`Okapnice: (${L} / ${p.okapnicaDuzina}) × ${rez} = ${okapnice} kom`);
      stavke.push({ naziv: `Okapnica ${zavrsnaNaziv(u.bojaZavrsnih)}`, opis: "50 × 30 cm", kom: okapnice, jedinica: "okapnica", cena: p.cenaOkapnica, ukupno: okapnice * p.cenaOkapnica });
    } else {
      napomene.push("Okapnice nisu uračunate. Nisu obavezne, ali se preporučuju: štite šupljine bloka od vode i mraza i daju završni izgled.");
    }
    const ukupno = stavke.reduce((s, x) => s + (x.ukupno ?? 0), 0);
    return {
      rezim: "zid", polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja, redovaStuba: 0,
      duzinaZida: r2(L), m2: r2(L * redovaPolja * p.modulVisina), stavke, ukupno, cenaNepotpuna: false,
      tezinaKg: Math.round(zidni * p.tezinaZidni), palete: Math.ceil(zidni / p.paleta), napomene, racun,
    };
  }

  // ---------- OGRADA ----------
  const L = Math.max(0, u.duzina);
  const R = Math.max(0.1, u.razmak);
  const rs = redoviZaVisinu(u.visinaStuba, p.modulVisina);
  if (!rs.jeCeo) napomene.push(`Visina stuba ${u.visinaStuba} m nije ceo broj redova. Ponudi ${rs.opcije[0].redova} redova (${rs.opcije[0].visina} m) ili ${rs.opcije[1].redova} redova (${rs.opcije[1].visina} m).`);
  const redovaStuba = rs.redova;
  if (redovaStuba < redovaPolja) napomene.push("Stub je niži od polja. Proveri visine.");

  // polja i stubovi
  const polja = Math.max(1, zaokruzi((L - p.modulStub) / (R + p.modulStub)));
  let stubovi = u.zatvoren ? polja : polja + 1;
  if (u.spojena && !u.zatvoren) { stubovi -= 1; napomene.push("Ograda se nastavlja na drugu: stub na spoju je zajednički, pa je oduzet jedan stub i jedna kapa."); }
  const duzinaBezStubova = Math.max(0, L - stubovi * p.modulStub);
  const stvarniRazmak = duzinaBezStubova / polja;
  racun.push(`Polja: zaokruži((${L} − ${p.modulStub}) / (${R} + ${p.modulStub})) = ${polja}; stubova ${stubovi}`);
  if (Math.abs(stvarniRazmak - R) > 0.02) napomene.push(`Sa ${polja} polja stvarni razmak je ${r2(stvarniRazmak)} m umesto ${R} m (polja se rasporede po celoj dužini).`);

  // kapije zauzimaju mesto polja: njihova širina se ne zida
  const kapije = Math.max(0, u.sirinaKapija);
  const Lz = Math.max(0, duzinaBezStubova - kapije);
  if (kapije > 0) racun.push(`Zidani deo: ${r2(duzinaBezStubova)} − ${kapije} m kapija = ${r2(Lz)} m`);
  else racun.push(`Zidani deo: ${L} − ${stubovi} × ${p.modulStub} = ${r2(Lz)} m`);

  const stubni = zaokruzi(stubovi * redovaStuba * rez);
  const zidni = zaokruzi((Lz / p.modulDuzina) * redovaPolja * rez);
  const kape = zaokruzi(stubovi * rez);
  const okapnice = zaokruzi((Lz / p.okapnicaDuzina) * rez);
  racun.push(`Stubni: ${stubovi} × ${redovaStuba} × ${rez} = ${stubni} kom`);
  racun.push(`Zidni: (${r2(Lz)} / ${p.modulDuzina}) × ${redovaPolja} × ${rez} = ${zidni} kom`);
  racun.push(`Kape: ${stubovi} × ${rez} = ${kape} kom`);
  racun.push(`Okapnice: (${r2(Lz)} / ${p.okapnicaDuzina}) × ${rez} = ${okapnice} kom`);

  stavke.push(
    { naziv: `Stubni blok ${bojaNaziv(u.boja)}`, opis: "19 × 39 × 39 cm", kom: stubni, jedinica: "blokova", cena: cenaStubni, ukupno: stubni * cenaStubni },
    { naziv: `Zidni blok ${bojaNaziv(u.boja)}`, opis: "19 × 19 × 39 cm", kom: zidni, jedinica: "blokova", cena: cenaZidni, ukupno: zidni * cenaZidni },
    { naziv: `Kapa ${zavrsnaNaziv(u.bojaZavrsnih)}`, opis: "50 × 50 cm", kom: kape, jedinica: "kapa", cena: p.cenaKapa, ukupno: kape * p.cenaKapa },
    { naziv: `Okapnica ${zavrsnaNaziv(u.bojaZavrsnih)}`, opis: "50 × 30 cm", kom: okapnice, jedinica: "okapnica", cena: p.cenaOkapnica, ukupno: okapnice * p.cenaOkapnica },
  );
  if (kapije > 0) napomene.push(`Kapije (${kapije} m) su oduzete od zidanog dela. Same kapije, ispune i rasveta se ugovaraju posebno.`);
  else napomene.push("Kapije nisu oduzete. Ako klijent ima kapiju, upiši njenu širinu.");

  const ukupno = stavke.reduce((s, x) => s + (x.ukupno ?? 0), 0);
  return {
    rezim: "ograda", polja, stubovi, stvarniRazmak: r2(stvarniRazmak), redovaPolja, redovaStuba,
    duzinaZida: r2(Lz), m2: r2(Lz * redovaPolja * p.modulVisina), stavke, ukupno, cenaNepotpuna: false,
    tezinaKg: Math.round(zidni * p.tezinaZidni + stubni * p.tezinaStubni),
    palete: Math.ceil(zidni / p.paleta), napomene, racun,
  };
}

/** Ponuda u formatu za DM / WhatsApp / Viber (pravila, deo 8). */
export function ponudaTekst(u: Ulaz, r: Rezultat): string {
  const boja = bojaNaziv(u.boja).toLowerCase();
  const mesto = u.mesto.trim();
  const red: string[] = [];

  if (r.rezim === "obloga") {
    red.push(`Ponuda – dekorativna obloga ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    red.push(`Obloga ${r.m2} m²`, "");
  } else if (r.rezim === "zid") {
    red.push(`Ponuda – zid ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    red.push(`Zid ${u.duzina}m (visina ${r2(r.redovaPolja * 0.2)}m, ${r.redovaPolja} redova)`, "");
  } else {
    red.push(`Ponuda – ograda ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    red.push(`Ograda ${u.duzina}m (stubovi ${r2(r.redovaStuba * 0.2)}m, polja ${r2(r.redovaPolja * 0.2)}m, razmak između stubova ${r.stvarniRazmak}m)`, "");
  }

  for (const s of r.stavke) {
    const cena = s.cena != null ? `${rsdFmt(s.cena)}din/${s.jedinicaCene ?? "kom"}` : "[cena – proveriti]";
    red.push(`${s.naziv} (${cena}) (${s.opis})`);
    red.push(`${s.kom} ${s.jedinica}${s.dodatak ? ` (${s.dodatak})` : ""} = ${s.ukupno != null ? rsdFmt(s.ukupno) + "din" : "[___]"}`);
  }
  red.push("", `UKUPNO: ${rsdFmt(r.ukupno)}din${r.cenaNepotpuna ? " (bez stavki kojima cena nije potvrđena)" : ""}`);
  return red.join("\n");
}

/** Beleška za nas, ne za klijenta (pravila, deo 8). */
export function internaBeleska(u: Ulaz, r: Rezultat): string {
  const red: string[] = ["Kako je računato:"];
  red.push(...r.racun.map((x) => "  " + x));
  red.push(`  Rezerva +5 % na svaku stavku, količine zaokružene na najbliži ceo broj.`);
  if (r.rezim === "ograda") red.push(`  Težina ≈ ${rsdFmt(r.tezinaKg)} kg, zidni blok ${r.palete} paleta (72/paleta).`);
  red.push("", "Nije uključeno: temelj, prevoz, ugradnja, alu paneli i ispune, kapije. To dodaje Luka.");
  if (r.napomene.length) { red.push("", "Proveriti:"); red.push(...r.napomene.map((x) => "  " + x)); }
  return red.join("\n");
}

// Zadržano zbog starijih poziva (procena vrednosti leada).
export const specifikacijaTekst = ponudaTekst;
