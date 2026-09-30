/*
  Prevoznici (Pavle, 30.09.2026.). Poruka je ista za sve (mesto, palete, kilaža, „Cena?"),
  samo počinje pozdravom po imenu. Kalkulator predlaže prevoznika po broju paleta.
*/
import { waLink } from "@/lib/lead";

export type Prevoznik = {
  kljuc: "rocko" | "milos" | "marko";
  ime: string;
  vokativ: string;        // „Dobar dan Miloše"
  tel: string;
  opis: string;
  maxPaleta: number;
  istovar: "rucno" | "sa" | "bez";
};

export const PREVOZNICI: Prevoznik[] = [
  // brojevi tačno kako ih je Pavle poslao: +381 63 263996, 061 3059 441, +381 62 299 017
  { kljuc: "rocko", ime: "Rocko", vokativ: "Rocko", tel: "063263996", opis: "mali kamion i kombi, par paleta, kupac istovara ručno", maxPaleta: 3, istovar: "rucno" },
  { kljuc: "milos", ime: "Miloš", vokativ: "Miloše", tel: "0613059441", opis: "istovarna ruka, cena sa istovarom, do 10 paleta", maxPaleta: 10, istovar: "sa" },
  { kljuc: "marko", ime: "Marko", vokativ: "Marko", tel: "062299017", opis: "šleper, cena bez istovara, do 22 palete", maxPaleta: 22, istovar: "bez" },
];

// Najteža paleta je zidni blok: 72 × 17 kg = 1.224 kg. Nosivost u kg je izvedena iz broja paleta,
// jer Pavle nije dao kilograme po prevozniku; kad ih da, upisati ovde.
export const KG_PO_PALETI_MAX = 72 * 17;
export const maxKg = (p: Prevoznik) => p.maxPaleta * KG_PO_PALETI_MAX;

/** Kalkulator SAM bira prevoznika po paletama i kilaži (Pavle, 30.09.2026.): najmanji u koga staje sve.
    Rocko do 3 palete; Miloš do 10 (cena sa istovarom); Marko do 22 (bez istovara); preko toga Marko u više tura.
    Kad je ponuda bez istovara, Miloš se preskače, jer on daje cenu sa istovarom. */
export function izaberiPrevoznika(palete: number, kg: number, saIstovarom?: boolean): { prevoznik: Prevoznik; razlog: string; viseTura: boolean } {
  const staje = (p: Prevoznik) => palete <= p.maxPaleta && kg <= maxKg(p);
  const [rocko, milos, marko] = PREVOZNICI;
  if (staje(rocko)) return { prevoznik: rocko, razlog: `${palete} paleta i ${kg} kg stanu u kombi ili mali kamion`, viseTura: false };
  if (staje(milos) && saIstovarom !== false) return { prevoznik: milos, razlog: `${palete} paleta i ${kg} kg, do 10 paleta, sa istovarom`, viseTura: false };
  if (staje(marko)) return { prevoznik: marko, razlog: `${palete} paleta i ${kg} kg, šleper do 22 palete, bez istovara`, viseTura: false };
  return { prevoznik: marko, razlog: `${palete} paleta i ${kg} kg je više od jednog šlepera (22 palete): ide u više tura`, viseTura: true };
}

export const porukaPrevozniku = (p: Prevoznik, telo: string) => `Dobar dan ${p.vokativ},\n${telo}`;
export const dativ = (p: Prevoznik) => (p.kljuc === "milos" ? "Milošu" : p.kljuc === "marko" ? "Marku" : "Rocku");

/** Telo poruke prevozniku, tačno kako je Pavle šalje: mesto, palete, kilaža, „Cena?". */
export function porukaPrevozu(mesto: string, palete: number, kg: number): string {
  const zadnja = palete % 10, dve = palete % 100;
  const rec = zadnja >= 2 && zadnja <= 4 && !(dve >= 12 && dve <= 14) ? "palete" : "paleta";
  const red: string[] = [];
  if (mesto.trim()) red.push(mesto.trim());
  red.push(`${palete} ${rec}`, `${kg}kg`, "Cena?");
  return red.join("\n");
}
export const prevoznikLink = (p: Prevoznik, telo: string) => waLink(p.tel, porukaPrevozniku(p, telo));
