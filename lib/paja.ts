/*
  Poruka za Paju: Paja (Pavle, +381 63 1781032) sastavlja ponude za UGRADNJU.
  Šalje mu se „SPECIFIKACIJA POSLA" na WhatsApp, tačno u ovom obliku (Pavle, 30.09.2026.).
  Pajino pravilo (29.09.2026.): kad klijent ima temelj ili će ga uraditi sam (mi ga ne radimo),
  uz specifikaciju ide i ponuda samo za blok (materijal + dostava).
*/
import { izracunajPrevoz, ponudaTekst, type Ulaz, type Rezultat } from "@/lib/kalkulator";
import { waLink } from "@/lib/lead";

export const PAJA_TEL = "0631781032";

export type PajaPolja = {
  ime: string;            // kupac, kako ide u zaglavlje poruke
  lokacija: string;
  temelj: string;         // Ima temelj | Uradiće sam | Treba mu temelj | ""
  iskop: string;          // Da | Ne | ""
  cokla: string;          // Da | Ne | ""
  dodatniRadovi: string;
};

export const PRAZNA_PAJA: PajaPolja = { ime: "", lokacija: "", temelj: "", iskop: "", cokla: "", dodatniRadovi: "" };

/** Klijent ima temelj ili ga radi sam → Paji ide i ponuda za materijal. */
export const idePonudaPaji = (p: PajaPolja) => p.temelj.startsWith("Ima") || p.temelj.startsWith("Uradi");

const daNe = (v: string) => (v.toLowerCase().startsWith("d") ? "da" : v.toLowerCase().startsWith("n") ? "ne" : v || "");
const m = (n: number) => `${String(n).replace(".", ",")}m`;

export function porukaZaPaju(p: PajaPolja, u: Ulaz, r: Rezultat, saPonudom: boolean, transport?: { eur: number | null; saIstovarom: boolean }): string {
  const deonice = u.poDeonicama ? u.deonice.filter((d) => d.duzina > 0) : [];
  const duzina = deonice.length ? deonice.reduce((a, d) => a + d.duzina, 0) : u.duzina;
  const visinaPolja = deonice.length ? deonice.map((d) => m(d.visinaPolja)).join(" / ") : m(u.visinaPolja);
  const visinaStuba = deonice.length ? deonice.map((d) => m(d.visinaStuba)).join(" / ") : m(u.visinaStuba);
  const potrebanTemelj = p.temelj ? (p.temelj.startsWith("Treba") ? "da" : "ne") : "";
  const red = [
    "*SPECIFIKACIJA POSLA*",
    p.ime || "",
    "",
    "",
    `* *Lokacija:* ${p.lokacija}`,
    "* *Ukupna dužina ograde:*",
    `* ${m(Math.round(duzina * 100) / 100)}`,
    "* *Visina polja:*",
    `* ${visinaPolja}`,
    "* *Visina stubova:*",
    `* ${visinaStuba}`,
    "* *Dužina polja / razmak između stubova:*",
    "* ",
    m(u.razmak),
    `* *Da li se koristi stubni blok:*${u.stubniBlok ? "da" : "ne"}`,
    `* *Da li je potreban temelj:*${potrebanTemelj}`,
    `* *Da li postoji iskop za temelj: ${daNe(p.iskop)}`,
    `* *Da li je cokla već pripremljena:*${daNe(p.cokla)} `,
    `* *Dodatni radovi:* ${p.dodatniRadovi.trim() || "nista"}`,
    "* *Fotografije ili video terena:*",
  ];
  if (u.brojKapija > 0 || deonice.some((d) => d.brojKapija > 0)) {
    const bk = deonice.length ? deonice.reduce((a, d) => a + d.brojKapija, 0) : u.brojKapija;
    const sk = deonice.length ? deonice.reduce((a, d) => a + d.sirinaKapija, 0) : u.sirinaKapija;
    red.push(`* *Kapije:* ${bk} kom, ukupno ${m(sk)}`);
  }
  if (saPonudom) {
    const prevoz = izracunajPrevoz(r);
    red.push("", "*PONUDA ZA MATERIJAL*", ponudaTekst(u, r));
    red.push("", `Prevoz: ${prevoz.palete} paleta, ${prevoz.kg} kg`);
    if (transport && transport.eur != null && transport.eur > 0) red.push(`Transport ${transport.saIstovarom ? "sa istovarom" : "bez istovara"}: ${transport.eur}e`);
  }
  return red.join("\n");
}

export const pajaLink = (tekst: string) => waLink(PAJA_TEL, tekst);

/* Larisa vodi finansije i pravi predračun. Kad je posao samo materijal i prevoz, njoj ide ponuda
   sa molbom za predračun, pa predračun ide kupcu. Njen broj još nije upisan: dok ga nema,
   link otvara WhatsApp sa gotovim tekstom, a kontakt se bira ručno. */
export const LARISA_TEL = "";

export function porukaZaLarisu(kupac: string, mesto: string, broj: string, u: Ulaz, r: Rezultat, transport?: { eur: number | null; saIstovarom: boolean }): string {
  const red = [
    "Zdravo Larisa, treba mi predračun za ovu ponudu:",
    `Kupac: ${kupac}${mesto ? `, ${mesto}` : ""}`,
    broj ? `Ponuda br. ${broj}` : "",
    "",
    ponudaTekst(u, r),
  ];
  if (transport && transport.eur != null && transport.eur > 0) red.push("", `Transport ${transport.saIstovarom ? "sa istovarom" : "bez istovara"}: ${transport.eur}e`);
  return red.filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");
}

export const larisaLink = (tekst: string) =>
  LARISA_TEL ? waLink(LARISA_TEL, tekst) : `https://wa.me/?text=${encodeURIComponent(tekst)}`;
