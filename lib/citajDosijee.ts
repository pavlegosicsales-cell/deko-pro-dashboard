import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Dosije } from "@/lib/dosije";

const KOLONE = "id, lead_id, kupac, telefon, mesto, opis, ukupno_rsd, palete, kg, stanje, prevoznik, prevoz_poslato_kad, transport_eur, sa_istovarom, paja_poslato_kad, ugradnja, ugradnja_kad, created_at, updated_at";
const KOLONE_8 = KOLONE + ", paja";   // paja dolazi sa migracijom 8
const bezPaje = (msg?: string | null) => !!msg && /paja/i.test(msg);

/** Svi dosijei, najskorije menjani prvi. Tabela dolazi sa migracija-7.sql. */
export async function citajDosijee(): Promise<{ dosijei: Dosije[]; error: string | null; migracija8Fali?: boolean }> {
  const prvi = await supabaseAdmin.from("dosijei").select(KOLONE_8).order("updated_at", { ascending: false });
  const rez = prvi.error && bezPaje(prvi.error.message) ? await supabaseAdmin.from("dosijei").select(KOLONE).order("updated_at", { ascending: false }) : prvi;
  return { dosijei: (rez.data ?? []) as unknown as Dosije[], error: rez.error?.message ?? null, migracija8Fali: !!prvi.error && bezPaje(prvi.error.message) };
}

export async function citajDosije(id: string): Promise<Dosije | null> {
  const prvi = await supabaseAdmin.from("dosijei").select(KOLONE_8).eq("id", id).maybeSingle();
  const rez = prvi.error && bezPaje(prvi.error.message) ? await supabaseAdmin.from("dosijei").select(KOLONE).eq("id", id).maybeSingle() : prvi;
  return (rez.data as unknown as Dosije) ?? null;
}

/** Dosije kupca po leadu (jedan po leadu). */
export async function citajDosijeZaLead(leadId: string): Promise<Dosije | null> {
  const prvi = await supabaseAdmin.from("dosijei").select(KOLONE_8).eq("lead_id", leadId).maybeSingle();
  const rez = prvi.error && bezPaje(prvi.error.message) ? await supabaseAdmin.from("dosijei").select(KOLONE).eq("lead_id", leadId).maybeSingle() : prvi;
  return (rez.data as unknown as Dosije) ?? null;
}
