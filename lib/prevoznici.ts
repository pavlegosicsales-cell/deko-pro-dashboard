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

/** Koga predložiti: najmanji prevoznik u koga staje sve; preko 22 palete ide Marko u više tura. */
export function predloziPrevoznika(palete: number, saIstovarom?: boolean): Prevoznik["kljuc"] {
  if (palete <= 3) return "rocko";
  if (palete <= 10 && saIstovarom !== false) return "milos";
  return "marko";
}

export const porukaPrevozniku = (p: Prevoznik, telo: string) => `Dobar dan ${p.vokativ},\n${telo}`;
export const prevoznikLink = (p: Prevoznik, telo: string) => waLink(p.tel, porukaPrevozniku(p, telo));
