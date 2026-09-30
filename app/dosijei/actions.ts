"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";
import { JE_DEMO } from "@/lib/env";
import { tabelaDosijeaFali, PORUKA_MIGRACIJA_7, type DosijeUnos } from "@/lib/dosije";
import type { Ugradnja } from "@/lib/ugradnja";

export type DosijeOdgovor = { ok: boolean; msg?: string; id?: string };

const osvezi = () => { revalidatePath("/kalkulator"); revalidatePath("/ponude"); revalidatePath("/ugradnja"); };
const greska = (msg: string) => ({ ok: false, msg: tabelaDosijeaFali(msg) ? PORUKA_MIGRACIJA_7 : msg });

/** Nađe dosije po id-ju ili po leadu; vraća id ili null. */
async function nadji(id?: string | null, leadId?: string | null): Promise<string | null> {
  if (id) {
    const r = await supabaseAdmin.from("dosijei").select("id").eq("id", id).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    if (r.data) return r.data.id;
  }
  if (leadId) {
    const r = await supabaseAdmin.from("dosijei").select("id").eq("lead_id", leadId).maybeSingle();
    if (r.error) throw new Error(r.error.message);
    if (r.data) return r.data.id;
  }
  return null;
}

/** Čuva unos kalkulatora u dosije kupca (jedan dosije po leadu). Sa `oznaci` beleži da je poruka poslata. */
export async function sacuvajDosije(d: DosijeUnos): Promise<DosijeOdgovor> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana, dosije se ne čuva." };
  if (!d.kupac.trim()) return { ok: false, msg: "Fali ime kupca: upiši ga u ponudi ili izaberi lead." };
  const sad = new Date().toISOString();
  const red: Record<string, unknown> = { kupac: d.kupac.trim(), updated_at: sad };
  if (d.lead_id !== undefined) red.lead_id = d.lead_id;
  for (const k of ["telefon", "mesto", "opis", "ukupno_rsd", "palete", "kg", "stanje", "transport_eur", "sa_istovarom", "prevoznik"] as const) {
    if (d[k] !== undefined) red[k] = d[k];
  }
  if (d.oznaci === "prevoz") red.prevoz_poslato_kad = sad;
  if (d.oznaci === "paja") red.paja_poslato_kad = sad;

  try {
    const id = await nadji(d.id, d.lead_id);
    const upit = id
      ? supabaseAdmin.from("dosijei").update(red).eq("id", id).select("id").single()
      : supabaseAdmin.from("dosijei").insert(red).select("id").single();
    const { data, error } = await upit;
    if (error) return greska(error.message);
    osvezi();
    return { ok: true, id: data.id, msg: id ? "Dosije je osvežen." : "Dosije je otvoren." };
  } catch (e) {
    return greska((e as Error).message);
  }
}

/** Upisuje cenu prevoza u dosije (kad prevoznik javi), bez diranja ostalog. */
export async function upisiPrevoz(id: string, transportEur: number | null, saIstovarom: boolean): Promise<DosijeOdgovor> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana." };
  const { error } = await supabaseAdmin.from("dosijei").update({ transport_eur: transportEur, sa_istovarom: saIstovarom, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return greska(error.message);
  osvezi();
  return { ok: true };
}

/** Čuva ponudu za ugradnju u dosije. Bez id-ja otvara nov dosije po imenu kupca. */
export async function sacuvajUgradnju(u: Ugradnja, id?: string | null, leadId?: string | null): Promise<DosijeOdgovor> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana, ponuda se ne čuva." };
  if (!u.kupac.trim()) return { ok: false, msg: "Fali ime kupca." };
  const sad = new Date().toISOString();
  try {
    const postojeci = await nadji(id, leadId);
    const red = { ugradnja: u, ugradnja_kad: sad, updated_at: sad, ...(postojeci ? {} : { kupac: u.kupac.trim(), mesto: u.lokacija || null, lead_id: leadId ?? null }) };
    const upit = postojeci
      ? supabaseAdmin.from("dosijei").update(red).eq("id", postojeci).select("id").single()
      : supabaseAdmin.from("dosijei").insert(red).select("id").single();
    const { data, error } = await upit;
    if (error) return greska(error.message);
    osvezi();
    return { ok: true, id: data.id, msg: "Ponuda za ugradnju je u dosijeu." };
  } catch (e) {
    return greska((e as Error).message);
  }
}

export async function obrisiDosije(id: string): Promise<DosijeOdgovor> {
  if (JE_DEMO) return { ok: false, msg: "Demo režim: baza nije povezana." };
  const { error } = await supabaseAdmin.from("dosijei").delete().eq("id", id);
  if (error) return greska(error.message);
  osvezi();
  return { ok: true };
}
