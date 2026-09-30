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
export type Rezim = "ograda" | "zid" | "obloga" | "rucno";

// Cenovnik, RSD/kom, sa PDV-om. Luka potvrdio PDV 26.09.2026.; od 28.09.2026. svaka stavka +25 din.
// Obloga se NE menja: 10 EUR/m² = 1.174 din.
export const CENOVNIK: { v: Boja; l: string; zidni: number; stubni: number }[] = [
  { v: "natur_siva", l: "Natur siva", zidni: 445, stubni: 545 },
  { v: "zuta", l: "Žuta", zidni: 485, stubni: 585 },
  { v: "braon", l: "Braon", zidni: 485, stubni: 585 },
  { v: "oranz", l: "Oranž", zidni: 485, stubni: 585 },
  { v: "crvena", l: "Crvena", zidni: 485, stubni: 585 },
  { v: "zelena", l: "Zelena", zidni: 485, stubni: 585 },
  { v: "crna", l: "Crna", zidni: 485, stubni: 585 },
  { v: "kapucino", l: "Kapućino", zidni: 585, stubni: 745 },
  { v: "multikolor_rok", l: "Multikolor Rock", zidni: 605, stubni: 805 },   // katalog piše Rock
  { v: "multikolor_rast", l: "Multikolor Rast", zidni: 605, stubni: 805 },
];
export const ZAVRSNE_BOJE: { v: BojaZavrsnih; l: string }[] = [
  { v: "siva", l: "Siva" }, { v: "crna", l: "Crna" }, { v: "bela", l: "Bela" },
];
export const bojaNaziv = (b: Boja) => CENOVNIK.find((c) => c.v === b)?.l ?? b;
export const zavrsnaNaziv = (b: BojaZavrsnih) => ZAVRSNE_BOJE.find((c) => c.v === b)?.l ?? b;

/* Ručni unos: kad Luka ili Pavle sami znaju količine, bez merenja ograde.
   Količine se NE uvećavaju za 5 %, upisuje se tačno ono što ide u ponudu. */
export type VrstaStavke = "zidni" | "stubni" | "kapa" | "okapnica" | "obloga";
export type RucnaStavka = { vrsta: VrstaStavke; kolicina: number; cena: number | null };  // cena null = iz cenovnika

export const VRSTE: { v: VrstaStavke; l: string; jedinica: string; opis: string }[] = [
  { v: "zidni", l: "Zidni blok", jedinica: "kom", opis: "19 × 19 × 39 cm" },
  { v: "stubni", l: "Stubni blok", jedinica: "kom", opis: "19 × 39 × 39 cm" },
  { v: "kapa", l: "Betonska kapa", jedinica: "kom", opis: "50 × 50 cm" },
  { v: "okapnica", l: "Betonska okapnica", jedinica: "kom", opis: "50 × 30 cm" },
  { v: "obloga", l: "Dekorativna obloga", jedinica: "m²", opis: "5 × 19 × 39 cm" },
];

export type Podesavanja = {
  modulDuzina: number;    // m, lice bloka sa fugom (0,40)
  modulVisina: number;    // m, red sa fugom (0,20)
  modulStub: number;      // m, širina stuba sa fugom (0,40)
  okapnicaDuzina: number; // m, 0,50 → 2 kom/m
  cenaOkapnica: number;   // RSD
  cenaKapa: number;       // RSD
  cenaObloga: number | null; // RSD/m² sa PDV-om; potvrdio Luka 28.09.2026. (null = ne računaj cenu)
  blokovaPoReduStuba: number; // kad se stub zida zidnim blokom: koliko blokova ide u jedan red
  rezervaPct: number;     // OBAVEZNO 5 %
  partnerske: boolean;    // interne cene za saradnike (zidni −25, stubni −10)
};

export const PODRAZUMEVANO: Podesavanja = {
  modulDuzina: 0.40, modulVisina: 0.20, modulStub: 0.40, okapnicaDuzina: 0.50,
  cenaOkapnica: 705, cenaKapa: 1315, cenaObloga: 1174,
  blokovaPoReduStuba: 1, rezervaPct: 5, partnerske: false,
};

export type Deonica = { duzina: number; visinaPolja: number; visinaStuba: number; brojKapija: number; sirinaKapija: number };

export type Ulaz = {
  rezim: Rezim;
  // ograda i zid
  duzina: number;          // m, ukupna dužina (uključuje stubove)
  visinaPolja: number;     // m (kod zida: visina zida)
  visinaStuba: number;     // m (samo ograda)
  razmak: number;          // m, željeni svetli otvor između stubova (samo ograda)
  sirinaKapija: number;    // m, ukupna širina svih kapija
  brojKapija: number;      // svaka kapija ima stub sa obe strane, pa broj kapija menja broj stubova
  // deonice: kad visina polja ili zida nije ista na celoj ograди
  poDeonicama: boolean;
  deonice: Deonica[];
  zatvoren: boolean;       // zatvoren obim: stubova koliko i polja
  spojena: boolean;        // nastavlja se na drugu ogradu: jedan stub manje (zajednički)
  saOkapnicama: boolean;   // kod punog zida okapnice nisu obavezne
  stubniBlok: boolean;     // false = i stubovi se zidaju zidnim blokom (cokla 20–30 cm, stubni od 40 cm bi virio)
  // obloga
  povrsina: number;        // m²
  // ručni unos
  rucne: RucnaStavka[];
  // zajedničko
  boja: Boja;
  bojaZavrsnih: BojaZavrsnih;
  mesto: string;
};

export const POCETNI_ULAZ: Ulaz = {
  rezim: "ograda", duzina: 20, visinaPolja: 0.8, visinaStuba: 1.6, razmak: 2,
  sirinaKapija: 0, brojKapija: 0, zatvoren: false, spojena: false, saOkapnicama: true, stubniBlok: true,
  poDeonicama: false,
  deonice: [
    { duzina: 10, visinaPolja: 0.8, visinaStuba: 1.6, brojKapija: 0, sirinaKapija: 0 },
    { duzina: 10, visinaPolja: 1.2, visinaStuba: 1.6, brojKapija: 0, sirinaKapija: 0 },
  ],
  povrsina: 10, boja: "natur_siva", bojaZavrsnih: "siva", mesto: "",
  rucne: [
    { vrsta: "zidni", kolicina: 0, cena: null },
    { vrsta: "stubni", kolicina: 0, cena: null },
    { vrsta: "kapa", kolicina: 0, cena: null },
    { vrsta: "okapnica", kolicina: 0, cena: null },
  ],
};

/* Prevoz: koliko komada staje na paletu i koliko komad teži (Luka, 28.09.2026.).
   Obloga: 12 m² i oko 900 kg na paleti, 12,5 kom/m² → 150 kom/paleta, 6 kg/kom. */
export const PREVOZ: { kljuc: string; naziv: string; poPaleti: number; kg: number; napomena?: string }[] = [
  { kljuc: "Zidni blok", naziv: "Zidni blok 19x19x39", poPaleti: 72, kg: 17 },
  { kljuc: "Stubni blok", naziv: "Stubni blok 19x39x39", poPaleti: 24, kg: 36 },
  { kljuc: "Kapa", naziv: "Betonska kapa 50x50", poPaleti: 10, kg: 40, napomena: "Luka kaže 10 do 20 kom na paletu; računamo 10, da prevoznik ne dođe sa premalim kamionom." },
  { kljuc: "Okapnica", naziv: "Betonska okapnica 50x30", poPaleti: 60, kg: 15 },
  { kljuc: "Dekorativna obloga", naziv: "Dekorativna obloga", poPaleti: 150, kg: 6, napomena: "12 m² i oko 900 kg na paleti." },
];

export type PrevozRed = { naziv: string; kom: number; palete: number; kg: number; poPaleti: number; kgPoKom: number };
export type Prevoz = { redovi: PrevozRed[]; palete: number; kg: number; napomene: string[] };

/** Palete i kilogrami, za dogovor sa prevoznikom. Palete se zaokružuju NAVIŠE, po proizvodu
    (2,3 palete su 3 palete), jer se dva proizvoda ne mešaju na istoj paleti. */
export function izracunajPrevoz(r: Rezultat): Prevoz {
  const redovi: PrevozRed[] = [];
  const napomene: string[] = [];
  for (const s of r.stavke) {
    if (s.kom <= 0) continue;
    const t = PREVOZ.find((x) => s.naziv.startsWith(x.kljuc));
    if (!t) continue;
    redovi.push({
      naziv: t.naziv, kom: s.kom, poPaleti: t.poPaleti, kgPoKom: t.kg,
      palete: Math.ceil(s.kom / t.poPaleti), kg: Math.round(s.kom * t.kg),
    });
    if (t.napomena && !napomene.includes(t.napomena)) napomene.push(t.napomena);
  }
  return {
    redovi,
    palete: redovi.reduce((a, x) => a + x.palete, 0),
    kg: redovi.reduce((a, x) => a + x.kg, 0),
    napomene,
  };
}

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

/** Dopuni rezultat brojem paleta i kilogramima iz tabele PREVOZ. */
function saPrevozom(r: Rezultat): Rezultat {
  const pr = izracunajPrevoz(r);
  return { ...r, palete: pr.palete, tezinaKg: pr.kg };
}

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

  // ---------- RUČNI UNOS ----------
  if (u.rezim === "rucno") {
    const zav = zavrsnaNaziv(u.bojaZavrsnih);
    const boja = bojaNaziv(u.boja);
    for (const rs of u.rucne) {
      if (!(rs.kolicina > 0)) continue;
      const v = VRSTE.find((x) => x.v === rs.vrsta)!;
      if (rs.vrsta === "obloga") {
        const m2 = r2(rs.kolicina);
        const cena = rs.cena ?? p.cenaObloga;
        stavke.push({
          naziv: "Dekorativna obloga", opis: v.opis, kom: zaokruzi(m2 * 12.5), jedinica: "obloga",
          cena, jedinicaCene: "m²", dodatak: `${m2} m²`,
          ukupno: cena != null ? Math.round(m2 * cena) : null,
        });
        racun.push(`Obloga: ${m2} m² × 12,5 = ${zaokruzi(m2 * 12.5)} kom`);
        if (cena == null) napomene.push("Cena obloge nije upisana.");
        continue;
      }
      const podrazumevana =
        rs.vrsta === "zidni" ? cenaZidni :
        rs.vrsta === "stubni" ? cenaStubni :
        rs.vrsta === "kapa" ? p.cenaKapa : p.cenaOkapnica;
      const cena = rs.cena ?? podrazumevana;
      const naziv =
        rs.vrsta === "zidni" ? `Zidni blok ${boja}` :
        rs.vrsta === "stubni" ? `Stubni blok ${boja}` :
        rs.vrsta === "kapa" ? `Kapa ${zav}` : `Okapnica ${zav}`;
      const kom = zaokruzi(rs.kolicina);
      stavke.push({ naziv, opis: v.opis, kom, jedinica: "kom", cena, ukupno: kom * cena });
    }
    racun.push("Ručni unos: količine su upisane rukom, bez rezerve od 5 %.");
    const ukupno = stavke.reduce((a, x) => a + (x.ukupno ?? 0), 0);
    const m2Obloge = stavke.filter((x) => x.jedinicaCene === "m²").reduce((a, x) => a + x.kom / 12.5, 0);
    return saPrevozom({
      rezim: "rucno", polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja: 0, redovaStuba: 0,
      duzinaZida: 0, m2: r2(m2Obloge), stavke, ukupno,
      cenaNepotpuna: stavke.some((x) => x.cena == null),
      tezinaKg: 0, palete: 0, napomene, racun,
    });
  }

  // ---------- DEONICE: visina nije ista na celoj ogradi ----------
  // Svaka deonica se računa kao svoja ograda (ili zid) sa svojom visinom i svojim kapijama,
  // a stub na spoju dve deonice je zajednički, pa svaka sledeća deonica ide kao „spojena".
  if ((u.rezim === "ograda" || u.rezim === "zid") && u.poDeonicama && u.deonice.length > 0) {
    const delovi = u.deonice.filter((d) => d.duzina > 0).map((d, i) => izracunaj({
      ...u, poDeonicama: false,
      duzina: d.duzina, visinaPolja: d.visinaPolja, visinaStuba: d.visinaStuba,
      brojKapija: d.brojKapija, sirinaKapija: d.sirinaKapija,
      zatvoren: i === 0 ? u.zatvoren : false,
      spojena: i === 0 ? u.spojena : true,
    }, p));
    if (delovi.length === 0) return saPrevozom({
      rezim: u.rezim, polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja: 0, redovaStuba: 0,
      duzinaZida: 0, m2: 0, stavke: [], ukupno: 0, cenaNepotpuna: false, tezinaKg: 0, palete: 0,
      napomene: ["Upiši bar jednu deonicu sa dužinom."], racun: [],
    });
    const spojeno = new Map<string, Stavka>();
    for (const d of delovi) for (const st of d.stavke) {
      const ima = spojeno.get(st.naziv);
      if (ima) { ima.kom += st.kom; ima.ukupno = ima.cena != null ? ima.kom * ima.cena : null; }
      else spojeno.set(st.naziv, { ...st });
    }
    const stavkeSve = [...spojeno.values()];
    const polja = delovi.reduce((a, d) => a + d.polja, 0);
    const stubovi = delovi.reduce((a, d) => a + d.stubovi, 0);
    const duzinaZida = r2(delovi.reduce((a, d) => a + d.duzinaZida, 0));
    const racunSve: string[] = [];
    delovi.forEach((d, i) => {
      const deo = u.deonice.filter((x) => x.duzina > 0)[i];
      racunSve.push(`Deonica ${i + 1}: ${deo.duzina} m, polje ${deo.visinaPolja} m${u.rezim === "ograda" ? `, stub ${deo.visinaStuba} m` : ""}${i > 0 ? " (stub na spoju zajednički)" : ""}`);
      racunSve.push(...d.racun.map((x) => "  " + x));
    });
    const napomeneSve = [...new Set(delovi.flatMap((d) => d.napomene.filter((n) => !n.startsWith("Ograda se nastavlja"))))];
    if (u.spojena) napomeneSve.unshift("Ograda se nastavlja na drugu: stub na spoju je zajednički, pa je oduzet jedan stub i jedna kapa.");
    return saPrevozom({
      rezim: u.rezim, polja, stubovi, stvarniRazmak: polja > 0 ? r2(duzinaZida / polja) : 0,
      redovaPolja: delovi[0].redovaPolja, redovaStuba: delovi[0].redovaStuba,
      duzinaZida, m2: r2(delovi.reduce((a, d) => a + d.m2, 0)),
      stavke: stavkeSve, ukupno: stavkeSve.reduce((a, x) => a + (x.ukupno ?? 0), 0),
      cenaNepotpuna: delovi.some((d) => d.cenaNepotpuna), tezinaKg: 0, palete: 0,
      napomene: napomeneSve, racun: racunSve,
    });
  }

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
    return saPrevozom({
      rezim: "obloga", polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja: 0, redovaStuba: 0,
      duzinaZida: 0, m2: r2(m2), stavke, ukupno, cenaNepotpuna: p.cenaObloga == null,
      tezinaKg: 0, palete: 0, napomene, racun,   // popunjava se ispod, iz tabele PREVOZ
    });
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
    return saPrevozom({
      rezim: "zid", polja: 0, stubovi: 0, stvarniRazmak: 0, redovaPolja, redovaStuba: 0,
      duzinaZida: r2(L), m2: r2(L * redovaPolja * p.modulVisina), stavke, ukupno, cenaNepotpuna: false,
      tezinaKg: 0, palete: 0, napomene, racun,
    });
  }

  // ---------- OGRADA ----------
  const L = Math.max(0, u.duzina);
  const R = Math.max(0.1, u.razmak);
  const rs = redoviZaVisinu(u.visinaStuba, p.modulVisina);
  if (!rs.jeCeo) napomene.push(`Visina stuba ${u.visinaStuba} m nije ceo broj redova. Ponudi ${rs.opcije[0].redova} redova (${rs.opcije[0].visina} m) ili ${rs.opcije[1].redova} redova (${rs.opcije[1].visina} m).`);
  const redovaStuba = rs.redova;
  if (redovaStuba < redovaPolja) napomene.push("Stub je niži od polja. Proveri visine.");

  // Kapije: svaka kapija visi između dva stuba, pa je ona „polje" svoje širine.
  // Ograda = polja + kapije, a stubova ima za jedan više (otvorena linija), isto (zatvoren obim)
  // ili za jedan manje (nastavlja se na drugu ogradu). Zato broj kapija menja broj stubova:
  // jedna kapija od 6 m zauzme mesto dva polja (jedan stub manje), dve kapije 1 + 5 m
  // imaju stub i između sebe.
  const kapije = Math.max(0, u.sirinaKapija);
  let brojKapija = Math.max(0, zaokruzi(u.brojKapija));
  if (kapije > 0 && brojKapija === 0) { brojKapija = 1; napomene.push("Upisana je širina kapija, a ne i broj: računam jednu kapiju."); }
  if (kapije === 0 && brojKapija > 0) { brojKapija = 0; napomene.push("Upisan je broj kapija bez širine: kapije nisu uračunate."); }
  // Polja se broje kao za otvorenu liniju; zatvoren obim ili spoj sa drugom ogradom
  // oduzima TAČNO jedan stub (Lukino pravilo), a oslobođenih 0,4 m ide u zidani deo.
  const manjeStubova = u.zatvoren ? 1 : (u.spojena ? 1 : 0);
  const polja = Math.max(brojKapija > 0 ? 0 : 1,
    zaokruzi((L - kapije - (brojKapija + 1) * p.modulStub) / (R + p.modulStub)));
  const stubovi = Math.max(1, polja + brojKapija + 1 - manjeStubova);
  if (u.spojena && !u.zatvoren) napomene.push("Ograda se nastavlja na drugu: stub na spoju je zajednički, pa je oduzet jedan stub i jedna kapa.");
  const Lz = Math.max(0, L - kapije - stubovi * p.modulStub);          // zidani deo, bez stubova i kapija
  const stvarniRazmak = polja > 0 ? Lz / polja : 0;
  if (brojKapija > 0) racun.push(`Polja: zaokruži((${L} − ${kapije} m kapija − ${brojKapija + 1} × ${p.modulStub}) / (${R} + ${p.modulStub})) = ${polja}; kapija ${brojKapija}; stubova ${polja} + ${brojKapija} + 1${manjeStubova ? " − " + manjeStubova : ""} = ${stubovi}`);
  else racun.push(`Polja: zaokruži((${L} − ${p.modulStub}) / (${R} + ${p.modulStub})) = ${polja}; stubova ${stubovi}`);
  if (polja > 0 && Math.abs(stvarniRazmak - R) > 0.02) napomene.push(`Sa ${polja} polja stvarni razmak je ${r2(stvarniRazmak)} m umesto ${R} m (polja se rasporede po celoj dužini).`);
  if (kapije > 0) racun.push(`Zidani deo: ${L} − ${kapije} m kapija − ${stubovi} × ${p.modulStub} = ${r2(Lz)} m`);
  else racun.push(`Zidani deo: ${L} − ${stubovi} × ${p.modulStub} = ${r2(Lz)} m`);

  // Kad je cokla 20–30 cm, stubni blok od 40 cm bi virio, pa se i stubovi zidaju zidnim blokom.
  const uStubu = Math.max(1, p.blokovaPoReduStuba);
  const zidniUPolju = (Lz / p.modulDuzina) * redovaPolja;
  const zidniUStubovima = u.stubniBlok ? 0 : stubovi * redovaStuba * uStubu;
  const stubni = u.stubniBlok ? zaokruzi(stubovi * redovaStuba * rez) : 0;
  const zidni = zaokruzi((zidniUPolju + zidniUStubovima) * rez);
  const kape = zaokruzi(stubovi * rez);
  const okapnice = zaokruzi((Lz / p.okapnicaDuzina) * rez);
  if (u.stubniBlok) {
    racun.push(`Stubni: ${stubovi} × ${redovaStuba} × ${rez} = ${stubni} kom`);
    racun.push(`Zidni: (${r2(Lz)} / ${p.modulDuzina}) × ${redovaPolja} × ${rez} = ${zidni} kom`);
  } else {
    racun.push(`Bez stubnog bloka: i stubovi se zidaju zidnim blokom, ${uStubu} po redu stuba.`);
    racun.push(`Zidni: (polja ${r2(zidniUPolju)} + stubovi ${stubovi} × ${redovaStuba} × ${uStubu}) × ${rez} = ${zidni} kom`);
    napomene.push("Stubovi se zidaju zidnim blokom, pa stubnog bloka nema u ponudi. Proveri da li kapa 50 × 50 pristaje na takav stub.");
  }
  racun.push(`Kape: ${stubovi} × ${rez} = ${kape} kom`);
  racun.push(`Okapnice: (${r2(Lz)} / ${p.okapnicaDuzina}) × ${rez} = ${okapnice} kom`);

  if (u.stubniBlok) stavke.push(
    { naziv: `Stubni blok ${bojaNaziv(u.boja)}`, opis: "19 × 39 × 39 cm", kom: stubni, jedinica: "blokova", cena: cenaStubni, ukupno: stubni * cenaStubni },
  );
  stavke.push(
    { naziv: `Zidni blok ${bojaNaziv(u.boja)}`, opis: "19 × 19 × 39 cm", kom: zidni, jedinica: "blokova", cena: cenaZidni, ukupno: zidni * cenaZidni },
    { naziv: `Kapa ${zavrsnaNaziv(u.bojaZavrsnih)}`, opis: "50 × 50 cm", kom: kape, jedinica: "kapa", cena: p.cenaKapa, ukupno: kape * p.cenaKapa },
    { naziv: `Okapnica ${zavrsnaNaziv(u.bojaZavrsnih)}`, opis: "50 × 30 cm", kom: okapnice, jedinica: "okapnica", cena: p.cenaOkapnica, ukupno: okapnice * p.cenaOkapnica },
  );
  if (kapije > 0) napomene.push(`${brojKapija} ${brojKapija === 1 ? "kapija" : "kapije"} (ukupno ${kapije} m) ${brojKapija === 1 ? "ima" : "imaju"} stub sa obe strane i ne zida se. Same kapije, ispune i rasveta se ugovaraju posebno.`);
  else napomene.push("Kapije nisu uračunate. Ako klijent ima kapiju, upiši broj i ukupnu širinu.");

  const ukupno = stavke.reduce((s, x) => s + (x.ukupno ?? 0), 0);
  return saPrevozom({
    rezim: "ograda", polja, stubovi, stvarniRazmak: r2(stvarniRazmak), redovaPolja, redovaStuba,
    duzinaZida: r2(Lz), m2: r2(Lz * redovaPolja * p.modulVisina), stavke, ukupno, cenaNepotpuna: false,
    tezinaKg: 0, palete: 0, napomene, racun,
  });
}

/** Kratak opis dela ponude: „Ograda 20 m", „Pun zid 10 m", „Obloga 8 m²", „Ručno". */
export function opisDela(u: Ulaz): string {
  const duz = u.poDeonicama ? u.deonice.reduce((a, d) => a + (d.duzina || 0), 0) : u.duzina;
  if (u.rezim === "ograda") return `Ograda ${r2(duz)} m`;
  if (u.rezim === "zid") return `Pun zid ${r2(duz)} m`;
  if (u.rezim === "obloga") return `Obloga ${r2(u.povrsina)} m²`;
  return "Ručno";
}

/** Više delova u jednoj ponudi (ograda + zid, ograda drugačije visine, obloga…): stavke se
    sabiraju po nazivu, iznosi i prevoz takođe. Polja i stubovi se sabiraju radi pregleda. */
export function spojiRezultate(rezultati: Rezultat[], opisi: string[] = []): Rezultat {
  const spojeno = new Map<string, Stavka>();
  for (const d of rezultati) for (const st of d.stavke) {
    const ima = spojeno.get(st.naziv);
    if (ima) {
      ima.kom += st.kom;
      ima.ukupno = ima.cena != null ? Math.round(ima.kom * ima.cena * (ima.jedinicaCene === "m²" ? 1 / 12.5 : 1)) : null;
      if (ima.jedinicaCene === "m²") ima.dodatak = `${r2(ima.kom / 12.5)} m²`;
    } else spojeno.set(st.naziv, { ...st });
  }
  const stavke = [...spojeno.values()];
  const racun: string[] = [];
  rezultati.forEach((d, i) => {
    racun.push(`Deo ${i + 1}${opisi[i] ? `: ${opisi[i]}` : ""}`);
    racun.push(...d.racun.map((x) => "  " + x));
  });
  const prvi = rezultati[0];
  return saPrevozom({
    rezim: prvi?.rezim ?? "ograda",
    polja: rezultati.reduce((a, d) => a + d.polja, 0),
    stubovi: rezultati.reduce((a, d) => a + d.stubovi, 0),
    stvarniRazmak: prvi?.stvarniRazmak ?? 0,
    redovaPolja: prvi?.redovaPolja ?? 0, redovaStuba: prvi?.redovaStuba ?? 0,
    duzinaZida: r2(rezultati.reduce((a, d) => a + d.duzinaZida, 0)),
    m2: r2(rezultati.reduce((a, d) => a + d.m2, 0)),
    stavke, ukupno: stavke.reduce((a, x) => a + (x.ukupno ?? 0), 0),
    cenaNepotpuna: rezultati.some((d) => d.cenaNepotpuna),
    tezinaKg: 0, palete: 0,
    napomene: [...new Set(rezultati.flatMap((d) => d.napomene))],
    racun,
  });
}

/** Ponuda za DM kad ima više delova: naslov, red po delu, pa spojene stavke. */
export function ponudaTekstDelovi(delovi: Ulaz[], r: Rezultat): string {
  const prvi = delovi[0];
  const mesto = prvi.mesto.trim();
  const boje = [...new Set(delovi.map((d) => bojaNaziv(d.boja).toLowerCase()))].join(" i ");
  const red: string[] = [`Ponuda – materijal ${boje}${mesto ? `, ${mesto}` : ""}`, ""];
  for (const d of delovi) {
    const rr = izracunaj(d);
    if (d.rezim === "ograda") red.push(`${opisDela(d)} (stubovi ${r2(rr.redovaStuba * 0.2)}m, polja ${r2(rr.redovaPolja * 0.2)}m, razmak između stubova ${rr.stvarniRazmak}m)`);
    else if (d.rezim === "zid") red.push(`${opisDela(d)} (visina ${r2(rr.redovaPolja * 0.2)}m, ${rr.redovaPolja} redova)`);
    else red.push(opisDela(d));
  }
  red.push("");
  for (const s of r.stavke) {
    const cena = s.cena != null ? `${rsdFmt(s.cena)}din/${s.jedinicaCene ?? "kom"}` : "[cena – proveriti]";
    red.push(`${s.naziv} (${cena}) (${s.opis})`);
    red.push(`${s.kom} ${s.jedinica}${s.dodatak ? ` (${s.dodatak})` : ""} = ${s.ukupno != null ? rsdFmt(s.ukupno) + "din" : "[___]"}`);
  }
  red.push("", `UKUPNO: ${rsdFmt(r.ukupno)}din${r.cenaNepotpuna ? " (bez stavki kojima cena nije potvrđena)" : ""}`);
  return red.join("\n");
}

/** Ponuda u formatu za DM / WhatsApp / Viber (pravila, deo 8). */
export function ponudaTekst(u: Ulaz, r: Rezultat): string {
  const boja = bojaNaziv(u.boja).toLowerCase();
  const mesto = u.mesto.trim();
  const red: string[] = [];

  if (r.rezim === "rucno") {
    red.push(`Ponuda – materijal ${boja}${mesto ? `, ${mesto}` : ""}`, "");
  } else if (r.rezim === "obloga") {
    red.push(`Ponuda – dekorativna obloga ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    red.push(`Obloga ${r.m2} m²`, "");
  } else if (r.rezim === "zid") {
    red.push(`Ponuda – zid ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    if (u.poDeonicama) red.push(`Zid ${r2(u.deonice.reduce((a, d) => a + d.duzina, 0))}m: ` + u.deonice.filter((d) => d.duzina > 0).map((d) => `${d.duzina}m visine ${d.visinaPolja}m`).join(" + "), "");
    else red.push(`Zid ${u.duzina}m (visina ${r2(r.redovaPolja * 0.2)}m, ${r.redovaPolja} redova)`, "");
  } else {
    red.push(`Ponuda – ograda ${boja}${mesto ? `, ${mesto}` : ""}`, "");
    if (u.poDeonicama) red.push(`Ograda ${r2(u.deonice.reduce((a, d) => a + d.duzina, 0))}m: ` + u.deonice.filter((d) => d.duzina > 0).map((d) => `${d.duzina}m (stubovi ${d.visinaStuba}m, polja ${d.visinaPolja}m)`).join(" + ") + `, razmak između stubova ${r.stvarniRazmak}m`, "");
    else red.push(`Ograda ${u.duzina}m (stubovi ${r2(r.redovaStuba * 0.2)}m, polja ${r2(r.redovaPolja * 0.2)}m, razmak između stubova ${r.stvarniRazmak}m)`, "");
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
  red.push(`  Prevoz: ${r.palete} paleta, ≈ ${rsdFmt(r.tezinaKg)} kg.`);
  red.push("", "Nije uključeno: temelj, prevoz, ugradnja, alu paneli i ispune, kapije. To dodaje Luka.");
  if (r.napomene.length) { red.push("", "Proveriti:"); red.push(...r.napomene.map((x) => "  " + x)); }
  return red.join("\n");
}

// Zadržano zbog starijih poziva (procena vrednosti leada).
export const specifikacijaTekst = ponudaTekst;
