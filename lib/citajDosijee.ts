import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Dosije } from "@/lib/dosije";

const KOLONE = "id, lead_id, kupac, telefon, mesto, opis, ukupno_rsd, palete, kg, stanje, prevoznik, prevoz_poslato_kad, transport_eur, sa_istovarom, paja_poslato_kad, ugradnja, ugradnja_kad, created_at, updated_at";

/** Svi dosijei, najskorije menjani prvi. Tabela dolazi sa migracija-7.sql. */
export async function citajDosijee(): Promise<{ dosijei: Dosije[]; error: string | null }> {
  const { data, error } = await supabaseAdmin.from("dosijei").select(KOLONE).order("updated_at", { ascending: false });
  return { dosijei: (data ?? []) as unknown as Dosije[], error: error?.message ?? null };
}

export async function citajDosije(id: string): Promise<Dosije | null> {
  const { data } = await supabaseAdmin.from("dosijei").select(KOLONE).eq("id", id).maybeSingle();
  return (data as unknown as Dosije) ?? null;
}
