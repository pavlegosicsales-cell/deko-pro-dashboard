import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { LeadRow } from "@/components/LeadView";

const OSNOVNO = "id, ime, prezime, telefon, proizvod, izvor, info, status, podseti_kad, ishod_beleska, created_at, updated_at";
// Kolone dodate migracijama, po fajlu — da baner kaže tačno koja migracija fali.
const MIGRACIJE: { fajl: string; kolone: string[]; sta: string }[] = [
  { fajl: "migracija-2.sql", kolone: ["pozvan_kad", "status_od", "prioritet", "zarada_rsd"], sta: "zvezdica, zarada i vreme u ishodu" },
  { fajl: "migracija-3.sql", kolone: ["obuhvat"], sta: "obuhvat (materijal / prevoz / ključ u ruke)" },
];
const DODATNE = MIGRACIJE.flatMap((m) => m.kolone);
const PUNO = `${OSNOVNO}, ${DODATNE.join(", ")}`;

// Čita sve leadove; ako kolona pozvan_kad još ne postoji (migracija-2 nije pokrenuta), čita bez nje.
export type MigracijaFali = { fajl: string; sta: string } | null;

export async function citajLeadove(): Promise<{ leadovi: LeadRow[]; error: string | null; migracijaFali: MigracijaFali }> {
  const citaj = (kolone: string) => supabaseAdmin.from("leadovi").select(kolone).order("created_at", { ascending: false });
  let { data, error } = await citaj(PUNO);
  let migracijaFali: MigracijaFali = null;
  if (error && DODATNE.some((k) => error!.message.includes(k))) {
    // Postgres javi prvu kolonu koja fali; probaj redom bez svake migracije da nađeš koja nedostaje.
    const m = MIGRACIJE.find((m) => m.kolone.some((k) => error!.message.includes(k))) ?? MIGRACIJE[0];
    migracijaFali = { fajl: m.fajl, sta: m.sta };
    const bez = MIGRACIJE.filter((x) => x !== m).flatMap((x) => x.kolone);
    ({ data, error } = await citaj(bez.length ? `${OSNOVNO}, ${bez.join(", ")}` : OSNOVNO));
    if (error) ({ data, error } = await citaj(OSNOVNO));
  }
  return { leadovi: (data ?? []) as unknown as LeadRow[], error: error?.message ?? null, migracijaFali };
}
