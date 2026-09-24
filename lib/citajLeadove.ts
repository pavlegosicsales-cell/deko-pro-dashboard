import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { LeadRow } from "@/components/LeadView";

const OSNOVNO = "id, ime, prezime, telefon, proizvod, izvor, info, status, podseti_kad, ishod_beleska, created_at, updated_at";
const DODATNE = ["pozvan_kad", "status_od", "prioritet", "zarada_rsd", "obuhvat"]; // iz migracija-2 i -3
const PUNO = `${OSNOVNO}, ${DODATNE.join(", ")}`;

// Čita sve leadove; ako kolona pozvan_kad još ne postoji (migracija-2 nije pokrenuta), čita bez nje.
export async function citajLeadove(): Promise<{ leadovi: LeadRow[]; error: string | null; migracijaFali: boolean }> {
  const citaj = (kolone: string) => supabaseAdmin.from("leadovi").select(kolone).order("created_at", { ascending: false });
  let { data, error } = await citaj(PUNO);
  let migracijaFali = false;
  if (error && DODATNE.some((k) => error!.message.includes(k))) { migracijaFali = true; ({ data, error } = await citaj(OSNOVNO)); }
  return { leadovi: (data ?? []) as unknown as LeadRow[], error: error?.message ?? null, migracijaFali };
}
