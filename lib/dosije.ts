/*
  Dosije po kupcu (tabela dosijei, migracija-7). Pavle je 01.10.2026. tražio da svaki kupac ima svoj
  „folder": šta je od ponuda urađeno, da li je poruka poslata prevozniku i Paji, da li se još čeka cena
  prevoza, i ponuda za ugradnju. Ceo unos kalkulatora stoji u `stanje` (isto što kalkulator pamti u
  pregledaču), pa se dosije vraća u kalkulator 1:1 i ponuda pravi sa kartice kad stigne cena.
*/
import type { Ulaz, Podesavanja } from "@/lib/kalkulator";
import type { PonudaMeta } from "@/lib/ponuda";
import type { PajaPolja } from "@/lib/paja";
import type { Ugradnja } from "@/lib/ugradnja";

/** Razmena sa Pajom po kupcu (tab „Paja"): živi u `ugradnja` jsonb (pajaPoruka / tekst), bez nove kolone. */
export type PajaRazmena = {
  poruka: string;            // specifikacija posla (šablon), kako je poslata Paji
  poruka_kad: string;        // ISO
  odgovor?: string | null;   // Pajin tekst ponude za ugradnju (= ugradnja.tekst)
  odgovor_kad?: string | null;
};
export const pajaIz = (d: { ugradnja?: Ugradnja | null; paja_poslato_kad?: string | null }): PajaRazmena | null => {
  const u = d.ugradnja;
  if (!u?.pajaPoruka && !u?.tekst) return null;
  return { poruka: u.pajaPoruka ?? "", poruka_kad: u.pajaPorukaKad ?? d.paja_poslato_kad ?? "", odgovor: u.tekst?.trim() || null, odgovor_kad: u.pajaOdgovorKad ?? null };
};
/** Ponuda za ugradnju je napravljena (PDF spreman) tek kad ima cenu. Sam Pajin tekst = ugradnja rešena, PDF po želji. */
export const pdfUgradnjeSpreman = (u: Ugradnja | null | undefined) => !!u && u.cena != null;
export const cekaPaju = (d: { ugradnja?: Ugradnja | null; paja_poslato_kad?: string | null }) => { const p = pajaIz(d); return !!p?.poruka && !p.odgovor && !pdfUgradnjeSpreman(d.ugradnja); };

export type KalkulatorStanje = {
  delovi: Ulaz[];
  aktivni: number;
  p: Podesavanja;
  pon: PonudaMeta;
  bezTransporta: boolean;
  leadId: string | null;
  paja: PajaPolja;
  telefonKupca: string;
};

export type Dosije = {
  id: string;
  lead_id: string | null;
  kupac: string;
  telefon: string | null;
  mesto: string | null;
  opis: string | null;
  ukupno_rsd: number | null;
  palete: number | null;
  kg: number | null;
  stanje: KalkulatorStanje | null;
  prevoznik: string | null;
  prevoz_poslato_kad: string | null;
  transport_eur: number | null;
  sa_istovarom: boolean | null;
  paja_poslato_kad: string | null;
  ugradnja: Ugradnja | null;
  ugradnja_kad: string | null;
  created_at: string;
  updated_at: string;
};

/** Šta kalkulator šalje kad čuva dosije. Ono što nije poslato, u bazi ostaje kako je bilo. */
export type DosijeUnos = {
  id?: string | null;
  lead_id?: string | null;
  kupac: string;
  telefon?: string | null;
  mesto?: string | null;
  opis?: string | null;
  ukupno_rsd?: number | null;
  palete?: number | null;
  kg?: number | null;
  stanje?: KalkulatorStanje | null;
  transport_eur?: number | null;
  sa_istovarom?: boolean | null;
  /** klik na dugme za prevoznika ili Paju: beleži se vreme, da se zna da je poruka poslata */
  oznaci?: "prevoz" | "paja" | null;
  prevoznik?: string | null;
};

export const tabelaDosijeaFali = (msg: string | null | undefined) =>
  !!msg && /does not exist|schema cache|relation|column/i.test(msg);

export const PORUKA_MIGRACIJA_7 = "Tabela „dosijei“ još ne postoji. Pokreni supabase/migracija-7.sql u Supabase SQL editoru.";

/** „01.10. 14:35" po Beogradu, za kartice. */
export function kadFmt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const delovi = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const uzmi = (t: string) => delovi.find((x) => x.type === t)?.value ?? "";
  return `${uzmi("day")}.${uzmi("month")}. ${uzmi("hour")}:${uzmi("minute")}`;
}

/** Čeka se cena prevoza: poruka je poslata (ili je unos sačuvan), a cena još nije upisana. */
export const cekaPrevoz = (d: Dosije) => d.transport_eur == null && !!d.stanje;
