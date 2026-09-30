import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { SacuvanaPonuda } from "@/lib/ponuda";

const KOLONE = "id, broj, datum, kupac, mesto, rezim, ukupno_rsd, transport_eur, sa_istovarom, sastavio, redovi, adresa, lead_id, created_at";
const KOLONE_7 = KOLONE + ", dosije_id";   // dosije_id dolazi sa migracijom 7

/** Tabela „ponude" dolazi sa migracija-6.sql; dok nije pokrenuta, strana to kaže. */
export const tabelaPonudaFali = (msg: string | null | undefined) =>
  !!msg && /does not exist|schema cache|relation/i.test(msg);

export async function citajPonude(): Promise<{ ponude: SacuvanaPonuda[]; error: string | null }> {
  const prvi = await supabaseAdmin.from("ponude").select(KOLONE_7).order("created_at", { ascending: false });
  // dok migracija 7 nije pokrenuta, kolone dosije_id nema: čita se bez nje
  const rez = prvi.error && /dosije_id/i.test(prvi.error.message)
    ? await supabaseAdmin.from("ponude").select(KOLONE).order("created_at", { ascending: false })
    : prvi;
  return { ponude: ((rez.data ?? []) as unknown) as SacuvanaPonuda[], error: rez.error?.message ?? null };
}

export async function citajPonudu(id: string): Promise<SacuvanaPonuda | null> {
  const { data } = await supabaseAdmin.from("ponude").select(KOLONE).eq("id", id).maybeSingle();
  return (data as unknown as SacuvanaPonuda) ?? null;
}
