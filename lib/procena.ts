/*
  Procena vrednosti projekta iz podataka leada (Lukin zahtev 26.09.2026.): lista se ređa
  po veličini posla. Koristi isti kalkulator kao /kalkulator. Gde lead nema meru, uzima
  podrazumevanu (START: polje 0,8 / stub 1,6; PRIVAT: 1,8 / 2,0; razmak 2 m; natur siva
  kao najjeftinija) i to navodi u `pretpostavke`, da se zna koliko je procena gruba.
*/
import { izracunaj, CENOVNIK, type Boja, type Ulaz } from "@/lib/kalkulator";

type LeadZaProcenu = {
  proizvod?: string | null; duzina_m?: number | null; obuhvat?: string | null;
  detalji?: Partial<Record<string, string>> | null;
};

export type Procena = { rsd: number; ulaz: Ulaz; pretpostavke: string[] };

// „1,6", „0,6-1,3 m", „do 2m" -> najveći broj u tekstu (u metrima; vrednosti > 5 tretira kao cm)
const metri = (t: string | undefined | null): number | null => {
  if (!t) return null;
  const nums = (t.replace(/,/g, ".").match(/\d+(\.\d+)?/g) ?? []).map(Number).filter((n) => n > 0);
  if (!nums.length) return null;
  let m = Math.max(...nums);
  if (m > 5) m = m / 100;
  return m;
};

// Naziv boje iz detalja (kako je upisana u wizardu) -> ključ cenovnika
const bojaKljuc = (t: string | undefined | null): Boja | null => {
  if (!t) return null;
  const s = t.toLowerCase();
  const nadji = (...k: string[]) => k.some((x) => s.includes(x));
  if (nadji("rok", "rock")) return "multikolor_rok";
  if (nadji("rast")) return "multikolor_rast";
  if (nadji("kapu")) return "kapucino";
  if (nadji("natur", "siva", "cement")) return "natur_siva";
  if (nadji("žut", "zut")) return "zuta";
  if (nadji("braon")) return "braon";
  if (nadji("oran")) return "oranz";
  if (nadji("crven")) return "crvena";
  if (nadji("zelen")) return "zelena";
  if (nadji("crn")) return "crna";
  return null;
};

export function proceniLead(l: LeadZaProcenu): Procena | null {
  // bez dužine nema procene (ključ u ruke bez mera isto ne možemo)
  if (l.duzina_m == null || l.duzina_m <= 0) return null;
  const d = l.detalji ?? {};
  const pretpostavke: string[] = [];
  const model = (d.model ?? "").toLowerCase();
  const privat = model === "privat";

  let visinaPolja = metri(d.visina_polja);
  if (visinaPolja == null) { visinaPolja = privat ? 1.8 : 0.8; pretpostavke.push(`polje ${visinaPolja} m`); }
  let visinaStuba = metri(d.visina_stuba);
  if (visinaStuba == null) { visinaStuba = privat ? 2.0 : Math.max(1.6, visinaPolja + 0.2); pretpostavke.push(`stub ${visinaStuba} m`); }
  let razmak = metri(d.razmak_stubova);
  if (razmak == null) { razmak = 2; pretpostavke.push("razmak 2 m"); }
  let boja = bojaKljuc(d.boja);
  if (!boja) { boja = "natur_siva"; pretpostavke.push("natur siva"); }

  const ulaz: Ulaz = { duzina: Number(l.duzina_m), razmak, visinaPolja, visinaStuba, otvori: 0, zatvoren: false, boja };
  const r = izracunaj(ulaz);
  return { rsd: r.ukupno, ulaz, pretpostavke };
}

export const bojaNaziv = (b: Boja) => CENOVNIK.find((c) => c.v === b)?.l ?? b;

// Redosled po Luki: vrući i topli zajedno po vrednosti (opadajuće), pa bez ocene, pa hladni
// (isto po vrednosti). Bez procene ide iza onih sa procenom u istoj grupi, najstariji prvi.
export function grupaTemperature(t: string | null | undefined): number {
  if (t === "vruc" || t === "topao") return 0;
  if (t === "hladan") return 2;
  return 1;
}
