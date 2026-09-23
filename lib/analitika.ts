// Analitika toka leadova — čisto računanje nad redovima, radi i na demo podacima.
import type { LeadRow } from "@/components/LeadView";

export const TZ = "Europe/Belgrade";

// ISO dan (YYYY-MM-DD) po beogradskom vremenu
export const danKljuc = (d: Date | string) => new Date(d).toLocaleDateString("sv-SE", { timeZone: TZ });
export const danasKljuc = () => danKljuc(new Date());
export const pomeriDan = (kljuc: string, dana: number) => {
  const d = new Date(kljuc + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + dana);
  return d.toISOString().slice(0, 10);
};

// Kad je lead pozvan: pozvan_kad, a za stare redove (pre migracije) updated_at ako više nije „nov".
export const pozvanKad = (l: LeadRow): string | null =>
  l.pozvan_kad ?? (l.status !== "nov" && l.updated_at ? l.updated_at : null);

export type DanStat = { dan: string; novi: number; pozvani: number };

// Poslednjih N dana (uključujući danas), po danu: koliko je novih stiglo i koliko je pozvano.
export function poDanu(leadovi: LeadRow[], dana = 14): DanStat[] {
  const danas = danasKljuc();
  const mapa = new Map<string, DanStat>();
  for (let i = dana - 1; i >= 0; i--) { const k = pomeriDan(danas, -i); mapa.set(k, { dan: k, novi: 0, pozvani: 0 }); }
  for (const l of leadovi) {
    const n = mapa.get(danKljuc(l.created_at)); if (n) n.novi++;
    const p = pozvanKad(l); if (p) { const r = mapa.get(danKljuc(p)); if (r) r.pozvani++; }
  }
  return [...mapa.values()];
}

export const brojNaDan = (leadovi: LeadRow[], kljuc: string) => leadovi.filter((l) => danKljuc(l.created_at) === kljuc).length;
export const pozvanoNaDan = (leadovi: LeadRow[], kljuc: string) => leadovi.filter((l) => { const p = pozvanKad(l); return !!p && danKljuc(p) === kljuc; }).length;

// Kratka srpska oznaka dana za osu: „23.09." i naziv dana
export const danKratko = (kljuc: string) => new Date(kljuc + "T12:00:00").toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" });
export const danIme = (kljuc: string) => new Date(kljuc + "T12:00:00").toLocaleDateString("sr-Latn-RS", { weekday: "short" });
