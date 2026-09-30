// Provera kalkulatora po pravilima iz „Deko Pro – pravila za računanje ograda, zidova i obloga".
// Pokreni: node --experimental-strip-types lib/kalkulator.test.mjs
// Primeri A, B i C su Lukini i Pavlovi, iz samog dokumenta pravila: oni su merodavni.
// KOLIČINE su iz dokumenta i ne menjaju se. IZNOSI su preračunati na cenovnik od 28.09.2026.
// (svaka stavka +25 din), pa su veći od onih u dokumentu za 25 × broj komada.
import { izracunaj, redoviZaVisinu, obimPlaca, ponudaTekst, izracunajPrevoz, PODRAZUMEVANO, POCETNI_ULAZ } from "./kalkulator.ts";

let pao = 0;
const je = (naziv, dobijeno, ocekivano) => {
  const ok = dobijeno === ocekivano;
  if (!ok) pao++;
  console.log(`${ok ? "OK  " : "PAO "} ${naziv}: ${dobijeno}${ok ? "" : ` (očekivano ${ocekivano})`}`);
};
const u = (x) => ({ ...POCETNI_ULAZ, ...x });
const kom = (r, deo) => r.stavke.find((s) => s.naziv.startsWith(deo))?.kom;

/* PRIMER A iz pravila — 150 m, natur, stub 2 m (10 redova), polje 1,6 m (8 redova), razmak 2,8 m
   n = zaokruži((150 − 0,4) / 3,2) = 47 polja, 48 stubova, polje ≈ 2,78 m, Lz = 130,8 m
   Stubni 504 · Zidni 2.747 · Kape 50 · Okapnice 275
   UKUPNO 1.667.320 din po starom cenovniku, 1.756.720 din po novom (+25 × 3.576 kom) */
const A = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, boja: "natur_siva" }));
je("A polja", A.polja, 47);
je("A stubovi", A.stubovi, 48);
je("A stvarni razmak", A.stvarniRazmak, 2.78);
je("A zidani deo", A.duzinaZida, 130.8);
je("A stubni blokovi", kom(A, "Stubni"), 504);
je("A zidni blokovi", kom(A, "Zidni"), 2747);
je("A kape", kom(A, "Kapa"), 50);
je("A okapnice", kom(A, "Okapnica"), 275);
je("A UKUPNO din", A.ukupno, 1756720);

/* PRIMER B iz pravila — pun zid 23 m, visina 1,6 m (8 redova), natur
   Zidni 483 · Okapnice 48 · UKUPNO 235.500 din staro, 248.775 din novo (+25 × 531 kom) */
const B = izracunaj(u({ rezim: "zid", duzina: 23, visinaPolja: 1.6, boja: "natur_siva" }));
je("B zidni blokovi", kom(B, "Zidni"), 483);
je("B okapnice", kom(B, "Okapnica"), 48);
je("B UKUPNO din", B.ukupno, 248775);

/* PRIMER C iz pravila — obloga, cokla 13 × 0,6 m = 7,8 m² → 102 obloge.
   Cena je 10 €/m², to jest 1.174 din/m² sa PDV-om (Luka, 28.09.2026.). Obloga se NE diže
   za 25 din kao ostale stavke. Naplaćuje se dostavljena
   kvadratura sa rezervom: 102 / 12,5 = 8,16 m² × 1.174 = 9.580 din. */
const C = izracunaj(u({ rezim: "obloga", povrsina: 7.8 }));
je("C obloge", kom(C, "Dekorativna obloga"), 102);
je("C cena je potvrđena", C.cenaNepotpuna, false);
je("C cena po m²", C.stavke[0].cena, 1174);
je("C jedinica cene", C.stavke[0].jedinicaCene, "m²");
je("C naplaćena kvadratura", C.stavke[0].dodatak, "8.16 m²");
je("C UKUPNO din", C.ukupno, 9580);

/* Prazna cena obloge → samo količina, bez iznosa */
const C0 = izracunaj(u({ rezim: "obloga", povrsina: 7.8 }), { ...PODRAZUMEVANO, cenaObloga: null });
je("C0 količina ista", kom(C0, "Dekorativna obloga"), 102);
je("C0 nema cenu", C0.cenaNepotpuna, true);
je("C0 ukupno 0", C0.ukupno, 0);

/* Ponuda za oblogu: cena po m², a količina u komadima */
const po = ponudaTekst(u({ rezim: "obloga", povrsina: 7.8, mesto: "Mladenovac" }), C);
je("ponuda obloge ima din/m²", po.includes("1.174din/m²"), true);
je("ponuda obloge ima komade i m²", po.includes("102 obloga (8.16 m²)"), true);
je("ponuda obloge ima UKUPNO", po.includes("UKUPNO: 9.580din"), true);

/* Pravilo 2 i 3: rezerva 5 % i zaokruživanje na NAJBLIŽI ceo broj (ne naviše).
   10 m, razmak 2, polje 0,8 (4 reda), stub 1,6 (8 redova), natur:
   polja = zaokruži(9,6/2,4) = 4, stubova 5, Lz = 8 m
   stubni 5×8×1,05 = 42 · zidni 20×4×1,05 = 84 · kape 5×1,05 = 5,25 → 5 · okapnice 16×1,05 = 16,8 → 17 */
const D = izracunaj(u({ duzina: 10, razmak: 2, visinaPolja: 0.8, visinaStuba: 1.6 }));
je("D polja", D.polja, 4);
je("D stubni (5×8×1,05)", kom(D, "Stubni"), 42);
je("D zidni (20×4×1,05)", kom(D, "Zidni"), 84);
je("D kape 5,25 → 5 (naniže)", kom(D, "Kapa"), 5);
je("D okapnice 16,8 → 17 (naviše)", kom(D, "Okapnica"), 17);
je("D UKUPNO din", D.ukupno, 84 * 445 + 42 * 545 + 17 * 705 + 5 * 1315);

/* Pravilo 4: visina koja nije ceo broj redova daje dve opcije, bez pola reda */
const V = redoviZaVisinu(1.7);
je("1,7 m nije ceo broj redova", V.jeCeo, false);
je("opcija niža", V.opcije[0].visina, 1.6);
je("opcija viša", V.opcije[1].visina, 1.8);
je("2,0 m je 10 redova", redoviZaVisinu(2).redova, 10);
const E = izracunaj(u({ duzina: 20, visinaPolja: 1.7 }));
je("E napomena o visini polja", E.napomene.some((n) => n.includes("nije ceo broj redova")), true);

/* ---------- KAPIJE (ispravka 30.09.2026.) ----------
   Svaka kapija visi između dva stuba, pa je ona „polje" svoje širine. Zato BROJ kapija
   menja broj stubova, ne samo njihova ukupna širina:
   150 m, razmak 2,8 (polje+stub = 3,2): bez kapije 47 polja + 48 stubova.
   Jedna kapija od 6 m: polja = zaokruži((150 − 6 − 2 × 0,4) / 3,2) = 45, stubova 45 + 1 + 1 = 47.
   Dve kapije 1 + 5 m:  polja = zaokruži((150 − 6 − 3 × 0,4) / 3,2) = 45, stubova 45 + 2 + 1 = 48. */
const K0 = izracunaj(u({ duzina: 150, razmak: 2.8, visinaPolja: 1.6, visinaStuba: 2 }));
const K1 = izracunaj(u({ duzina: 150, razmak: 2.8, visinaPolja: 1.6, visinaStuba: 2, brojKapija: 1, sirinaKapija: 6 }));
const K2 = izracunaj(u({ duzina: 150, razmak: 2.8, visinaPolja: 1.6, visinaStuba: 2, brojKapija: 2, sirinaKapija: 6 }));
je("K0 bez kapije stubova", K0.stubovi, 48);
je("K1 jedna kapija 6 m: polja", K1.polja, 45);
je("K1 jedna kapija 6 m: stubova (jedan manje)", K1.stubovi, 47);
je("K1 zidani deo 150 − 6 − 47 × 0,4", K1.duzinaZida, 125.2);
je("K2 dve kapije 1 + 5: polja", K2.polja, 45);
je("K2 dve kapije 1 + 5: stubova (stub i između njih)", K2.stubovi, 48);
je("K2 zidani deo 150 − 6 − 48 × 0,4", K2.duzinaZida, 124.8);
je("K2 ima stub više nego K1", K2.stubovi - K1.stubovi, 1);
je("K1 stubni = 47 × 10 × 1,05 = 493,5 → 493 (tačno ,5 ide dole)", kom(K1, "Stubni"), 493);
je("K2 kape = 48 × 1,05 → 50", kom(K2, "Kapa"), 50);

/* širina bez broja: računa se jedna kapija i to piše */
const K3 = izracunaj(u({ duzina: 150, razmak: 2.8, visinaPolja: 1.6, visinaStuba: 2, sirinaKapija: 6 }));
je("K3 širina bez broja = jedna kapija", K3.stubovi, K1.stubovi);
je("K3 napomena", K3.napomene.some((n) => n.includes("računam jednu kapiju")), true);

/* mala kapija u malom polju ne menja broj stubova */
const F = izracunaj(u({ duzina: 20, razmak: 2, brojKapija: 1, sirinaKapija: 3, visinaPolja: 0.8, visinaStuba: 1.6 }));
const G = izracunaj(u({ duzina: 20, razmak: 2, visinaPolja: 0.8, visinaStuba: 1.6 }));
je("F 20 m sa kapijom 3 m: stubova", F.stubovi, 9);
je("G 20 m bez kapije: stubova", G.stubovi, 9);
je("F zidani deo manji za 3 m", Math.round((G.duzinaZida - F.duzinaZida) * 100) / 100, 3);

/* ---------- DEONICE: visina nije ista na celoj ogradi ----------
   20 m sa poljem 0,8 + 10 m sa poljem 1,2, razmak 2, stub 1,6.
   Deonica 1 sama: polja 8, stubova 9, Lz 16,4. Deonica 2 sama (spojena, stub na spoju zajednički):
   polja zaokruži((10 − 0) / 2,4) = 4, stubova 4 + 0 + 1 − 1 = 4, Lz 10 − 1,6 = 8,4. */
const D1 = izracunaj(u({ duzina: 20, razmak: 2, visinaPolja: 0.8, visinaStuba: 1.6 }));
const DS = izracunaj(u({ razmak: 2, poDeonicama: true, deonice: [
  { duzina: 20, visinaPolja: 0.8, visinaStuba: 1.6, brojKapija: 0, sirinaKapija: 0 },
  { duzina: 10, visinaPolja: 1.2, visinaStuba: 1.6, brojKapija: 0, sirinaKapija: 0 },
] }));
je("DS stubova = 9 + 4", DS.stubovi, 13);
je("DS polja = 8 + 4", DS.polja, 12);
je("DS zidani deo = 16,4 + 8,4", DS.duzinaZida, 24.8);
je("DS zidni = (16,4/0,4 × 4 + 8,4/0,4 × 6) × 1,05", kom(DS, "Zidni"), Math.round(16.4 / 0.4 * 4 * 1.05) + Math.round(8.4 / 0.4 * 6 * 1.05));
je("DS stubni = 13 × 8 × 1,05", kom(DS, "Stubni"), Math.round(9 * 8 * 1.05) + Math.round(4 * 8 * 1.05));
je("DS prva deonica ista kao sama", D1.stubovi, 9);
je("DS ima jednu stavku zidnog (spojeno)", DS.stavke.filter((x) => x.naziv.startsWith("Zidni")).length, 1);
je("DS UKUPNO = zbir stavki", DS.ukupno, DS.stavke.reduce((a, x) => a + x.ukupno, 0));

/* deonice punog zida */
const DZ = izracunaj(u({ rezim: "zid", poDeonicama: true, deonice: [
  { duzina: 10, visinaPolja: 1.0, visinaStuba: 0, brojKapija: 0, sirinaKapija: 0 },
  { duzina: 5, visinaPolja: 1.6, visinaStuba: 0, brojKapija: 0, sirinaKapija: 0 },
] }));
je("DZ zidni = (25 × 5 + 12,5 × 8) × 1,05", kom(DZ, "Zidni"), Math.round(25 * 5 * 1.05) + Math.round(12.5 * 8 * 1.05));
je("DZ okapnice = 21 + (10,5 → 10)", kom(DZ, "Okapnica"), 31);

/* Zatvoren obim: stubova koliko i polja. Spojena ograda: jedan stub manje. */
const Z = izracunaj(u({ duzina: 40, razmak: 1.6, zatvoren: true }));
je("Z stubova = polja", Z.stubovi, Z.polja);
const S1 = izracunaj(u({ duzina: 40, razmak: 2 }));
const S2 = izracunaj(u({ duzina: 40, razmak: 2, spojena: true }));
je("S spojena ima 1 stub manje", S1.stubovi - S2.stubovi, 1);

/* Pun zid bez okapnica: samo blokovi + napomena */
const Zb = izracunaj(u({ rezim: "zid", duzina: 23, visinaPolja: 1.6, saOkapnicama: false }));
je("Zb samo jedna stavka", Zb.stavke.length, 1);
je("Zb napomena o okapnicama", Zb.napomene.some((n) => n.includes("preporučuju")), true);

/* Plac u arima → obim (5 ari ≈ 90 m, 15,5 ari ≈ 160 m) */
je("5 ari", Math.round(obimPlaca(5)), 89);
je("15,5 ari", Math.round(obimPlaca(15.5)), 157);

/* Rezerva se može isključiti (tada su količine bez +5 %) */
const R0 = izracunaj(u({ duzina: 10, razmak: 2 }), { ...PODRAZUMEVANO, rezervaPct: 0 });
je("bez rezerve stubni 5×8", kom(R0, "Stubni"), 40);

/* Format ponude */
const t = ponudaTekst(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, mesto: "Kragujevac" }), A);
je("ponuda ima naslov", t.startsWith("Ponuda – ograda natur siva, Kragujevac"), true);
je("ponuda ima UKUPNO", t.includes("UKUPNO: 1.756.720din"), true);
je("ponuda ima stubni red", t.includes("504 blokova"), true);

/* ---------- PREVOZ (Luka, 28.09.2026.) ----------
   Zidni 72/paleta 17 kg · stubni 24/paleta 36 kg · kapa 10/paleta 40 kg ·
   okapnica 60/paleta 15 kg · obloga 150 kom (12 m²) po paleti, 6 kg/kom.
   Palete se zaokružuju NAVIŠE, po proizvodu: 2,3 palete su 3 palete. */
const pA = izracunajPrevoz(A);
const red = (p, deo) => p.redovi.find((x) => x.naziv.startsWith(deo));
je("prevoz A zidni palete (2747/72 = 38,15)", red(pA, "Zidni").palete, 39);
je("prevoz A zidni kg", red(pA, "Zidni").kg, 2747 * 17);
je("prevoz A stubni palete (504/24 = 21)", red(pA, "Stubni").palete, 21);
je("prevoz A stubni kg", red(pA, "Stubni").kg, 504 * 36);
je("prevoz A kape palete (50/10)", red(pA, "Betonska kapa").palete, 5);
je("prevoz A okapnice palete (275/60 = 4,58)", red(pA, "Betonska okapnica").palete, 5);
je("prevoz A UKUPNO paleta", pA.palete, 39 + 21 + 5 + 5);
je("prevoz A UKUPNO kg", pA.kg, 2747 * 17 + 504 * 36 + 50 * 40 + 275 * 15);
je("rezultat nosi iste palete", A.palete, pA.palete);
je("rezultat nosi iste kg", A.tezinaKg, pA.kg);

/* zaokruživanje naviše: 73 zidna bloka su 1,014 palete → 2 palete */
const P1 = izracunajPrevoz({ stavke: [{ naziv: "Zidni blok Natur siva", kom: 73 }] });
je("73 zidna = 2 palete", P1.palete, 2);
const P2 = izracunajPrevoz({ stavke: [{ naziv: "Zidni blok Natur siva", kom: 72 }] });
je("72 zidna = 1 paleta", P2.palete, 1);

/* obloga: puna paleta je 12 m² = 150 kom = 900 kg, kao što Luka kaže */
const P3 = izracunajPrevoz({ stavke: [{ naziv: "Dekorativna obloga", kom: 150 }] });
je("puna paleta obloge = 1", P3.palete, 1);
je("puna paleta obloge = 900 kg", P3.kg, 900);
je("prevoz C obloge palete", izracunajPrevoz(C).palete, 1);

/* ---------- RUČNI UNOS ----------
   Količine se upisuju rukom, bez rezerve. Cene su iz cenovnika za izabranu boju,
   osim kad se u redu upiše svoja. */
const R1 = izracunaj(u({ rezim: "rucno", boja: "natur_siva", bojaZavrsnih: "siva", rucne: [
  { vrsta: "zidni", kolicina: 150, cena: null },
  { vrsta: "stubni", kolicina: 40, cena: null },
  { vrsta: "kapa", kolicina: 8, cena: null },
  { vrsta: "okapnica", kolicina: 30, cena: null },
] }));
je("R1 stavki", R1.stavke.length, 4);
je("R1 zidni bez rezerve", kom(R1, "Zidni"), 150);
je("R1 stubni bez rezerve", kom(R1, "Stubni"), 40);
je("R1 UKUPNO", R1.ukupno, 150 * 445 + 40 * 545 + 8 * 1315 + 30 * 705);
je("R1 palete", R1.palete, Math.ceil(150 / 72) + Math.ceil(40 / 24) + 1 + 1);
je("R1 kg", R1.tezinaKg, 150 * 17 + 40 * 36 + 8 * 40 + 30 * 15);

/* red sa nulom se preskače, a svoja cena gazi cenovnik */
const R2 = izracunaj(u({ rezim: "rucno", rucne: [
  { vrsta: "zidni", kolicina: 100, cena: 400 },
  { vrsta: "stubni", kolicina: 0, cena: null },
] }));
je("R2 samo jedna stavka", R2.stavke.length, 1);
je("R2 svoja cena", R2.ukupno, 100 * 400);

/* obloga se u ručnom unosu upisuje u m² */
const R3 = izracunaj(u({ rezim: "rucno", rucne: [{ vrsta: "obloga", kolicina: 8, cena: null }] }));
je("R3 obloge komada (8 × 12,5)", kom(R3, "Dekorativna obloga"), 100);
je("R3 iznos (8 × 1.174)", R3.ukupno, 9392);

/* ponuda i redovi ponude rade i za ručni unos */
const rt = ponudaTekst(u({ rezim: "rucno", mesto: "Beograd", rucne: [{ vrsta: "zidni", kolicina: 150, cena: null }] }), izracunaj(u({ rezim: "rucno", rucne: [{ vrsta: "zidni", kolicina: 150, cena: null }] })));
je("ponuda rucno ima naslov", rt.startsWith("Ponuda – materijal natur siva, Beograd"), true);
je("ponuda rucno ima iznos", rt.includes("66.750din"), true);

/* ---------- OGRADA BEZ STUBNOG BLOKA ----------
   Kad je cokla 20–30 cm, stubni blok od 40 cm bi virio, pa se i stubovi zidaju
   zidnim blokom. Primer A: polja 327 × 8 = 2.616, stubovi 48 × 10 = 480,
   (2.616 + 480) × 1,05 = 3.250,8 → 3.251 zidnih, stubnog nema. */
const SB = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, boja: "natur_siva", stubniBlok: false }));
je("SB nema stubnog bloka", SB.stavke.some((x) => x.naziv.startsWith("Stubni")), false);
je("SB zidni (polja + stubovi)", kom(SB, "Zidni"), 3251);
je("SB kape ostaju", kom(SB, "Kapa"), 50);
je("SB okapnice ostaju", kom(SB, "Okapnica"), 275);
je("SB isti broj stubova", SB.stubovi, A.stubovi);
je("SB UKUPNO din", SB.ukupno, 3251 * 445 + 50 * 1315 + 275 * 705);
je("SB napomena o kapi", SB.napomene.some((n) => n.includes("kapa 50 × 50")), true);
je("SB prevoz nema stubnog", izracunajPrevoz(SB).redovi.some((x) => x.naziv.startsWith("Stubni")), false);

/* dva zidna po redu stuba (ako se stub zida kao 39 × 39) */
const SB2 = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, stubniBlok: false }),
  { ...PODRAZUMEVANO, blokovaPoReduStuba: 2 });
je("SB2 zidni sa dva po redu", kom(SB2, "Zidni"), Math.round((327 * 8 + 48 * 10 * 2) * 1.05));

/* BROJ STUBOVA umesto razmaka (Pavle, 01.10.2026.): kupac kaže „48 stubova" → polja = 47, razmak ispada 2,78 m,
   sve količine kao u primeru A. */
const ST = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 9, stubova: 48 }));
je("ST stubovi kao zadato", ST.stubovi, 48);
je("ST polja", ST.polja, 47);
je("ST razmak ispada", ST.stvarniRazmak, 2.78);
je("ST stubni kao A", kom(ST, "Stubni"), 504);
je("ST zidni kao A", kom(ST, "Zidni"), 2747);
je("ST kape", kom(ST, "Kapa"), 50);
// sa kapijom: 47 stubova → polja = 47 − 1 − 1 = 45
const STK = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, stubova: 47, brojKapija: 1, sirinaKapija: 6 }));
je("STK stubovi", STK.stubovi, 47);
je("STK polja", STK.polja, 45);
// zatvoren obim: stubova koliko i polja
const STZ = izracunaj(u({ duzina: 90, visinaStuba: 1.6, visinaPolja: 0.8, razmak: 2, stubova: 30, zatvoren: true }));
je("STZ stubovi", STZ.stubovi, 30);
je("STZ polja", STZ.polja, 30);

/* RUČNE ISPRAVKE količina (Pavle, 01.10.2026.): kape 50 → 48, okapnice ostaju; iznos i prevoz se preračunaju */
const IS = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, ispravke: { kapa: 48 } }));
je("IS kape ispravljene", kom(IS, "Kapa"), 48);
je("IS okapnice netaknute", kom(IS, "Okapnica"), 275);
je("IS ukupno manje za 2 kape", IS.ukupno, A.ukupno - 2 * 1315);
je("IS racun beleži ispravku", IS.racun.some((x) => x.startsWith("Ispravljeno ručno: Kapa")), true);
je("IS prevoz kapa 48", izracunajPrevoz(IS).redovi.find((x) => x.naziv.startsWith("Betonska kapa"))?.kom, 48);
const IS0 = izracunaj(u({ duzina: 150, visinaStuba: 2, visinaPolja: 1.6, razmak: 2.8, ispravke: { kapa: null } }));
je("IS null = bez ispravke", IS0.ukupno, A.ukupno);
// obloga: ispravka komada menja naplaćene kvadrate
const ISO = izracunaj(u({ rezim: "obloga", povrsina: 7.8, ispravke: { obloga: 100 } }));
je("ISO obloga 100 kom", kom(ISO, "Dekorativna obloga"), 100);
je("ISO naplata 8 m2", ISO.ukupno, Math.round(8 * 1174));

/* TRANSPORT u tekstu ponude za DM (Pavle, 01.10.2026.: kod obloge nije pisala cena dostave) */
const TO = izracunaj(u({ rezim: "obloga", povrsina: 7.8 }));
je("TO transport u tekstu", ponudaTekst(u({ rezim: "obloga", povrsina: 7.8 }), TO, { eur: 120, saIstovarom: true }).includes("Transport sa istovarom: 120e"), true);
je("TO bez transporta nema reda", ponudaTekst(u({ rezim: "obloga", povrsina: 7.8 }), TO, { eur: null, saIstovarom: true }).includes("Transport"), false);

console.log(pao ? `\n${pao} test(ova) PALO` : "\nSVI TESTOVI PROŠLI");
process.exit(pao ? 1 : 0);
