"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { normalizujTelefon } from "@/lib/lead";
import { normalizujProizvod } from "@/lib/opcije";

export type LeadState = { ok: boolean; msg?: string };

const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const t = typeof v === "string" ? v.trim() : "";
  return t === "" ? null : t;
};

async function mojEmail(): Promise<string | null> {
  try { const { data } = await (await supabaseServer()).auth.getUser(); return data.user?.email ?? null; }
  catch { return null; }
}

function polja(fd: FormData) {
  return {
    ime: s(fd, "ime"),
    prezime: s(fd, "prezime"),
    telefon: normalizujTelefon(s(fd, "telefon")),
    proizvod: normalizujProizvod(s(fd, "proizvod")),
    izvor: s(fd, "izvor"),
    info: s(fd, "info"),
    status: s(fd, "status") ?? "nov",
    podseti_kad: s(fd, "podseti_kad"),
    ishod_beleska: s(fd, "ishod_beleska"),
  };
}

export async function dodajLead(_prev: LeadState, fd: FormData): Promise<LeadState> {
  const p = polja(fd);
  if (!p.ime && !p.prezime && !p.telefon) return { ok: false, msg: "Unesi bar ime ili telefon." };

  const { error } = await supabaseAdmin.from("leadovi").insert({ ...p, dodao: await mojEmail() });
  if (error) return { ok: false, msg: jeTabelaFali(error.message) ? PORUKA_MIGRACIJA : "Greška: " + error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function izmeniLead(_prev: LeadState, fd: FormData): Promise<LeadState> {
  const id = s(fd, "id");
  if (!id) return { ok: false, msg: "Nedostaje ID." };
  const p = polja(fd);
  const sad = new Date().toISOString();
  const prethodni = s(fd, "prethodni_status");
  const promenjen = !!prethodni && prethodni !== p.status;
  const izNov = prethodni === "nov" && p.status !== "nov";
  const dodatno = { ...(promenjen ? { status_od: sad } : {}), ...(izNov ? { pozvan_kad: sad } : {}) };
  let { error } = await supabaseAdmin.from("leadovi").update({ ...p, updated_at: sad, ...dodatno }).eq("id", id);
  if (error && Object.keys(dodatno).length) ({ error } = await supabaseAdmin.from("leadovi").update({ ...p, updated_at: sad }).eq("id", id));
  if (error) return { ok: false, msg: "Greška: " + error.message };
  revalidatePath("/");
  return { ok: true };
}

// Brza promena ishoda iz padajućeg menija (optimistično na klijentu).
export async function promeniStatus(id: string, status: string, izNov?: boolean): Promise<void> {
  const sad = new Date().toISOString();
  const osnovno = { status, updated_at: sad };
  // status_od = od kad je u ovom ishodu; pozvan_kad = prvi izlazak iz „nov" (= pozvan).
  // Ako kolone još ne postoje (migracija-2 nije pokrenuta), snimi bez njih.
  const dodatno = { status_od: sad, ...(izNov && status !== "nov" ? { pozvan_kad: sad } : {}) };
  const { error } = await supabaseAdmin.from("leadovi").update({ ...osnovno, ...dodatno }).eq("id", id);
  if (error) await supabaseAdmin.from("leadovi").update(osnovno).eq("id", id);
  revalidatePath("/");
}

export async function obrisiLead(id: string): Promise<void> {
  await supabaseAdmin.from("leadovi").delete().eq("id", id);
  revalidatePath("/");
}

const PORUKA_MIGRACIJA = "Baza još nije podešena — pokreni supabase/schema.sql u Supabase SQL editoru.";
const jeTabelaFali = (msg?: string | null) => !!msg && /does not exist|schema cache|relation/i.test(msg);

// Beleška posle poziva direktno sa kartice (čuva se na blur, bez otvaranja izmene).
export async function promeniBelesku(id: string, beleska: string | null): Promise<void> {
  await supabaseAdmin.from("leadovi").update({ ishod_beleska: beleska, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
}

// Datum povratnog poziva direktno sa kartice (kad je ishod „Pozvati (datum)").
export async function promeniPodsetnik(id: string, datum: string | null): Promise<void> {
  await supabaseAdmin.from("leadovi").update({ podseti_kad: datum, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
}
