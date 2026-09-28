// Provera kalkulatora po pravilima iz „Deko Pro – pravila za računanje ograda, zidova i obloga".
// Pokreni: node --experimental-strip-types lib/kalkulator.test.mjs
// Primeri A, B i C su Lukini i Pavlovi, iz samog dokumenta pravila: oni su merodavni.
// KOLIČINE su iz dokumenta i ne menjaju se. IZNOSI su preračunati na cenovnik od 28.09.2026.
// (svaka stavka +25 din), pa su veći od onih u dokumentu za 25 × broj komada.
import { izracunaj, redoviZaVisinu, obimPlaca, ponudaTekst, PODRAZUMEVANO, POCETNI_ULAZ } from "./kalkulator.ts";

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

/* Kapija zauzima mesto polja: njena širina se oduzima od zidanog dela (ne dodaje stub) */
const F = izracunaj(u({ duzina: 20, razmak: 2, sirinaKapija: 3, visinaPolja: 0.8, visinaStuba: 1.6 }));
const G = izracunaj(u({ duzina: 20, razmak: 2, sirinaKapija: 0, visinaPolja: 0.8, visinaStuba: 1.6 }));
je("F isti broj stubova sa kapijom", F.stubovi, G.stubovi);
je("F zidani deo manji za 3 m", Math.round((G.duzinaZida - F.duzinaZida) * 100) / 100, 3);
je("F manje zidnih blokova", kom(F, "Zidni") < kom(G, "Zidni"), true);

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

console.log(pao ? `\n${pao} test(ova) PALO` : "\nSVI TESTOVI PROŠLI");
process.exit(pao ? 1 : 0);
