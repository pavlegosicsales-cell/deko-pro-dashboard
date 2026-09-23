import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { LeadRow } from "@/components/LeadView";

const PUNO = "id, ime, prezime, telefon, proizvod, izvor, info, status, podseti_kad, ishod_beleska, created_at, updated_at, pozvan_kad, status_od";

// Čita sve leadove; ako kolona pozvan_kad još ne postoji (migracija-2 nije pokrenuta), čita bez nje.
export async function citajLeadove(): Promise<{ leadovi: LeadRow[]; error: string | null }> {
  const citaj = (kolone: string) => supabaseAdmin.from("leadovi").select(kolone).order("created_at", { ascending: false });
  let { data, error } = await citaj(PUNO);
  if (error && /pozvan_kad|status_od/.test(error.message)) ({ data, error } = await citaj(PUNO.replace(", pozvan_kad, status_od", "")));
  return { leadovi: (data ?? []) as unknown as LeadRow[], error: error?.message ?? null };
}
