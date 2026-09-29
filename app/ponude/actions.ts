"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { JE_DEMO } from "@/lib/env";
import { tabelaPonudaFali } from "@/lib/citajPonude";
import type { NovaPonuda } from "@/lib/ponuda";

export type PonudaStanje = { ok: boolean; msg?: string; id?: string };

const PORUKA_MIGRACIJA = "Tabela „ponude“ još ne postoji. Pokreni supabase/migracija-6.sql u Supabase SQL editoru.";

/** Upisuje ponudu u tab „Ponude". Ista ponuda (isti broj i kupac) se prepisuje, ne dupla. */
export async function sacuvajPonudu(p: NovaPonuda): Promise<PonudaStanje> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana, ponuda se ne čuva." };
  if (!p.broj.trim() || !p.kupac.trim()) return { ok: false, msg: "Fali broj ponude ili ime kupca." };
  if (!Array.isArray(p.redovi) || p.redovi.length === 0) return { ok: false, msg: "Ponuda nema stavki." };

  const red = {
    broj: p.broj.trim(), datum: p.datum, kupac: p.kupac.trim(), mesto: p.mesto || null, rezim: p.rezim,
    ukupno_rsd: p.ukupno_rsd, transport_eur: p.transport_eur, sa_istovarom: p.sa_istovarom,
    sastavio: p.sastavio, redovi: p.redovi, adresa: p.adresa, lead_id: p.lead_id ?? null,
  };

  const postojeca = await supabaseAdmin.from("ponude").select("id").eq("broj", red.broj).eq("kupac", red.kupac).maybeSingle();
  if (postojeca.error) return { ok: false, msg: tabelaPonudaFali(postojeca.error.message) ? PORUKA_MIGRACIJA : postojeca.error.message };

  const upit = postojeca.data
    ? supabaseAdmin.from("ponude").update(red).eq("id", postojeca.data.id).select("id").single()
    : supabaseAdmin.from("ponude").insert(red).select("id").single();
  const { data, error } = await upit;
  if (error) return { ok: false, msg: tabelaPonudaFali(error.message) ? PORUKA_MIGRACIJA : error.message };
  revalidatePath("/ponude");
  return { ok: true, id: data.id, msg: postojeca.data ? "Ponuda je prepisana u Ponudama." : "Ponuda je u Ponudama." };
}

export async function obrisiPonudu(id: string): Promise<PonudaStanje> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana." };
  const { error } = await supabaseAdmin.from("ponude").delete().eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/ponude");
  return { ok: true };
}
