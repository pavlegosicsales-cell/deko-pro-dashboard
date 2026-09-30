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

  const red: Record<string, unknown> = {
    broj: p.broj.trim(), datum: p.datum, kupac: p.kupac.trim(), mesto: p.mesto || null, rezim: p.rezim,
    ukupno_rsd: p.ukupno_rsd, transport_eur: p.transport_eur, sa_istovarom: p.sa_istovarom,
    sastavio: p.sastavio, redovi: p.redovi, adresa: p.adresa, lead_id: p.lead_id ?? null,
    ...(p.dosije_id ? { dosije_id: p.dosije_id } : {}),
  };

  const postojeca = await supabaseAdmin.from("ponude").select("id").eq("broj", red.broj as string).eq("kupac", red.kupac as string).maybeSingle();
  if (postojeca.error) return { ok: false, msg: tabelaPonudaFali(postojeca.error.message) ? PORUKA_MIGRACIJA : postojeca.error.message };

  const upisi = (r: Record<string, unknown>) => postojeca.data
    ? supabaseAdmin.from("ponude").update(r).eq("id", postojeca.data.id).select("id").single()
    : supabaseAdmin.from("ponude").insert(r).select("id").single();
  let { data, error } = await upisi(red);
  let napomena = "";
  // kolona dosije_id dolazi sa migracijom 7; dok nije pokrenuta, ponuda se upiše bez veze sa dosijeom
  if (error && /dosije_id/i.test(error.message) && red.dosije_id) {
    delete red.dosije_id;
    ({ data, error } = await upisi(red));
    napomena = " (bez dosijea: pokreni migracija-7.sql)";
  }
  if (error || !data) return { ok: false, msg: tabelaPonudaFali(error?.message) ? PORUKA_MIGRACIJA : (error?.message ?? "Nije upisano.") };

  // u dosije ide cena prevoza iz ponude, da kartica kupca zna da se više ne čeka
  if (p.dosije_id && !napomena) {
    await supabaseAdmin.from("dosijei").update({
      ...(p.transport_eur != null ? { transport_eur: p.transport_eur, sa_istovarom: p.sa_istovarom } : {}),
      updated_at: new Date().toISOString(),
    }).eq("id", p.dosije_id);
    revalidatePath("/kalkulator");
  }
  revalidatePath("/ponude");
  return { ok: true, id: data.id, msg: (postojeca.data ? "Ponuda je prepisana u Ponudama." : "Ponuda je u Ponudama.") + napomena };
}

export async function obrisiPonudu(id: string): Promise<PonudaStanje> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana." };
  const { error } = await supabaseAdmin.from("ponude").delete().eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/ponude");
  return { ok: true };
}
