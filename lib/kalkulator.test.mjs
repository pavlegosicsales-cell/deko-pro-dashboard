// Ručni test kalkulatora (pokreni: node --experimental-strip-types lib/kalkulator.test.mjs)
// Specifikacija je prvo sračunata rukom, pa se poredi sa funkcijom.
import { izracunaj, PODRAZUMEVANO } from "./kalkulator.ts";

let pao = 0;
const je = (naziv, dobijeno, ocekivano) => {
  const ok = dobijeno === ocekivano;
  if (!ok) pao++;
  console.log(`${ok ? "OK  " : "PAO "} ${naziv}: ${dobijeno}${ok ? "" : ` (očekivano ${ocekivano})`}`);
};

/* TEST 1, ručno:
   Prav potez L = 10 m, razmak 2,0 m, polje 0,8 m, stub 1,6 m, natur siva.
   polja = (10 − 0,4) / (2,0 + 0,4) = 4  → stubova 5
   dužina zida = 10 − 5 × 0,4 = 8,0 m; stvarni razmak 8/4 = 2,0
   zidni: 8,0 / 0,4 = 20 po redu × (0,8/0,2 = 4 reda) = 80   (provera: 8 × 0,8 = 6,4 m² × 12,5 = 80 ✓)
   stubni: 1,6 / 0,2 = 8 redova × 5 = 40
   okapnice: 8,0 / 0,5 = 16; kape: 5
   cena: 80×420 + 40×520 + 16×680 + 5×1290 = 33.600 + 20.800 + 10.880 + 6.450 = 71.730 */
const t1 = izracunaj({ duzina: 10, razmak: 2, visinaPolja: 0.8, visinaStuba: 1.6, otvori: 0, zatvoren: false, boja: "natur_siva" });
je("T1 polja", t1.polja, 4);
je("T1 stubovi", t1.stubovi, 5);
je("T1 dužina zida", t1.duzinaZida, 8);
je("T1 zidni", t1.zidni, 80);
je("T1 stubni", t1.stubni, 40);
je("T1 okapnice", t1.okapnice, 16);
je("T1 kape", t1.kape, 5);
je("T1 ukupno RSD", t1.ukupno, 71730);
je("T1 palete zidnog", t1.paleteZidni, 2);
je("T1 težina kg (18×80 + 36×40)", t1.tezinaKg, 80 * 18 + 40 * 36);

/* TEST 2, ručno: dužina koja se ne deli tačno + kapija + visina van modula.
   L = 25 m, razmak 2,5 m, 1 otvor (kapija), polje 1,0 m, stub 1,7 m, kapućino.
   fiksni stubovi = 1 + 1 = 2; polja = (25 − 0,8) / 2,9 = 8,34 → 8; stubova = 8 + 1 + 1 = 10
   dužina zida = 25 − 10 × 0,4 = 21,0; stvarni razmak = 21/8 = 2,625
   polje 1,0 → 5 redova; stub 1,7 → 8,5 → 9 redova (1,8 m, napomena)
   zidni: 21/0,4 = 52,5 po redu × 5 = 262,5 → 263
   stubni: 10 × 9 = 90; okapnice: 21/0,5 = 42; kape: 10
   cena: 263×560 + 90×720 + 42×680 + 10×1290 = 147.280 + 64.800 + 28.560 + 12.900 = 253.540 */
const t2 = izracunaj({ duzina: 25, razmak: 2.5, visinaPolja: 1.0, visinaStuba: 1.7, otvori: 1, zatvoren: false, boja: "kapucino" });
je("T2 polja", t2.polja, 8);
je("T2 stubovi", t2.stubovi, 10);
je("T2 stvarni razmak", t2.stvarniRazmak, 2.63);
je("T2 redova stuba", t2.redovaStuba, 9);
je("T2 zidni", t2.zidni, 263);
je("T2 stubni", t2.stubni, 90);
je("T2 okapnice", t2.okapnice, 42);
je("T2 ukupno RSD", t2.ukupno, 253540);
je("T2 ima napomenu o visini stuba", t2.napomene.some((n) => n.includes("Visina stuba")), true);
je("T2 ima napomenu o razmaku", t2.napomene.some((n) => n.includes("ne deli")), true);

/* TEST 3: zatvoren obim 4 × 10 m = 40 m, razmak 1,6 m, polje 0,8, stub 1,6, natur, rezerva 3 %.
   polja = 40 / (1,6 + 0,4) = 20; stubova = 20 (zatvoren); zid = 40 − 8 = 32 m; razmak 1,6 ✓
   zidni bez rezerve: 32/0,4 = 80 × 4 = 320 → ×1,03 = 329,6 → 330
   stubni bez rezerve: 20 × 8 = 160 → ×1,03 = 164,8 → 165
   okapnice 64, kape 20 */
const t3 = izracunaj({ duzina: 40, razmak: 1.6, visinaPolja: 0.8, visinaStuba: 1.6, otvori: 0, zatvoren: true, boja: "natur_siva" }, { ...PODRAZUMEVANO, rezervaPct: 3 });
je("T3 polja", t3.polja, 20);
je("T3 stubovi", t3.stubovi, 20);
je("T3 zidni bez rezerve", t3.zidniBezRezerve, 320);
je("T3 zidni sa 3 %", t3.zidni, 330);
je("T3 stubni sa 3 %", t3.stubni, 165);
je("T3 okapnice", t3.okapnice, 64);
je("T3 kape", t3.kape, 20);

console.log(pao ? `\n${pao} test(ova) PALO` : "\nSVI TESTOVI PROŠLI");
process.exit(pao ? 1 : 0);
