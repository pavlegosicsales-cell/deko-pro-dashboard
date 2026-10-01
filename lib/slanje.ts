/*
  Slanje ponude klijentu (Pavle, 01.10.2026.): svaka ponuda ima „Sačuvaj u PDF" i „Pošalji klijentu"
  preko WhatsAppa ili Vibera, na broj kupca iz baze.

  Kako radi: PDF se napravi u pregledaču, otpremi u storage (/api/pdf) i klijentu ode poruka sa linkom.
  WhatsApp: wa.me/<broj>?text=… otvara razgovor baš sa tim kupcem, poruka je upisana, ostaje tap na „Pošalji".
  Viber: viber://forward?text=… otvara Viber sa upisanom porukom, kupac se bira u listi (Viber nema link
  koji nosi i broj i tekst). Na telefonu, ako sistem ume da podeli fajl, PDF ide i kao prilog.
  Slanje bez ijednog klika traži WhatsApp Business API / Viber Business poruke (nalozi, verifikacija,
  šabloni); to nije ovde.
*/
import { waLink } from "@/lib/lead";
import { rsd } from "@/lib/format";
import type { PonudaMeta, SacuvanaPonuda } from "@/lib/ponuda";

export type Kanal = "wa" | "viber";

/** Meta sačuvane ponude (tab Ponude), da se PDF napravi iz redova tačno kako su poslati. */
export const metaPonude = (p: SacuvanaPonuda): PonudaMeta => ({
  broj: p.broj, datum: p.datum, kupac: p.kupac, transportEur: p.transport_eur, saIstovarom: p.sa_istovarom,
  sastavio: p.sastavio || "Luka Jovanović", leadId: p.lead_id ?? null, dosijeId: p.dosije_id ?? null,
});

/** Telefon kupca iz adrese ponude („…&tel=06x…"), gde ga kalkulator upiše. */
export const telIzAdrese = (adresa: string | null | undefined): string | null => {
  if (!adresa) return null;
  try { return new URLSearchParams(adresa.replace(/^\/?ponuda\?/, "").replace(/^\?/, "")).get("tel") || null; } catch { return null; }
};

/** Bajtovi slike ograde kroz naš server (da PDF u pregledaču može da je pročita). */
export async function bajtoviSlike(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const r = await fetch(`/api/slika?src=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch { return null; }
}

export const TEL_FIRME = "062 253 140";

export async function otpremiPdf(blob: Blob, ime: string): Promise<string> {
  const fd = new FormData();
  fd.append("pdf", new File([blob], ime, { type: "application/pdf" }));
  fd.append("ime", ime);
  const r = await fetch("/api/pdf", { method: "POST", body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.url) throw new Error(j.error || "Otpremanje PDF-a nije uspelo.");
  return j.url as string;
}

export const viberForwardLink = (tekst: string) => `viber://forward?text=${encodeURIComponent(tekst)}`;

/** Poruka uz ponudu za materijal. Uvek „vi", kratko, jedna sledeća radnja (brand voice). */
export const porukaMaterijal = (broj: string, ukupnoRsd: number, url: string | null) =>
  [`Poštovani, šaljemo vam ponudu br. ${broj} za dekorativni blok. Ukupno: ${rsd(ukupnoRsd)}.`,
   url ? `PDF ponude: ${url}` : "",
   `Ponuda važi 3 dana. Za sva pitanja tu smo, ${TEL_FIRME}.`].filter(Boolean).join("\n");

/** Poruka uz ponudu za ugradnju (Gradi Lako). */
export const porukaUgradnja = (broj: string, cenaEur: string, url: string | null) =>
  [`Poštovani, šaljemo vam ponudu za ugradnju ograde br. ${broj}. Cena radova: ${cenaEur} EUR.`,
   url ? `PDF ponude: ${url}` : "",
   `Za sva pitanja tu smo, ${TEL_FIRME}.`].filter(Boolean).join("\n");

/** Skida PDF na uređaj. */
export function skiniPdf(blob: Blob, ime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = ime;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

/**
 * Pošalje ponudu klijentu: otpremi PDF, sastavi poruku sa linkom i otvori WhatsApp (sa brojem) ili Viber.
 * Vraća javni URL PDF-a. Baca grešku ako otpremanje ne uspe.
 */
export async function posaljiKlijentu(kanal: Kanal, telefon: string | null, blob: Blob, ime: string, tekst: (url: string | null) => string): Promise<string> {
  const url = await otpremiPdf(blob, ime);
  const poruka = tekst(url);
  try { await navigator.clipboard.writeText(poruka); } catch { /* prazno */ }
  if (kanal === "wa") {
    window.open(waLink(telefon, poruka), "_blank", "noopener");
    return url;
  }
  // Viber: na telefonu probaj sistemski „Podeli" sa fajlom (PDF ide kao prilog, Pavle bira Viber i kupca)
  const fajl = new File([blob], ime, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const mobilni = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (mobilni && nav.share && nav.canShare?.({ files: [fajl] })) {
    try { await nav.share({ files: [fajl], text: poruka, title: ime }); return url; }
    catch (e) { if ((e as Error)?.name === "AbortError") return url; }
  }
  window.location.href = viberForwardLink(poruka);
  return url;
}
