"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import { normalizujTelefon } from "@/lib/lead";
import { normalizujProizvod, DRUGO } from "@/lib/opcije";

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
    proizvod: s(fd, "proizvod") === DRUGO ? normalizujProizvod(s(fd, "proizvod_tekst")) : s(fd, "proizvod"),
    obuhvat: s(fd, "obuhvat"),
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

  const dodao = await mojEmail();
  let { error } = await supabaseAdmin.from("leadovi").insert({ ...p, dodao });
  // kolona obuhvat fali (migracija-3 nije pokrenuta): snimi bez nje, ostalo ne sme da propadne
  if (error && /obuhvat/.test(error.message)) { const { obuhvat: _o, ...bez } = p; void _o; ({ error } = await supabaseAdmin.from("leadovi").insert({ ...bez, dodao })); }
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
  if (error && /obuhvat/.test(error.message)) { const { obuhvat: _o, ...bez } = p; void _o; ({ error } = await supabaseAdmin.from("leadovi").update({ ...bez, updated_at: sad, ...dodatno }).eq("id", id)); }
  if (error && Object.keys(dodatno).length) ({ error } = await supabaseAdmin.from("leadovi").update({ ...p, updated_at: sad }).eq("id", id));
  if (error) return { ok: false, msg: "Greška: " + error.message };
  revalidatePath("/");
  return { ok: true };
}

// Brza promena ishoda iz padajućeg menija (optimistično na klijentu).
export async function promeniStatus(id: string, status: string, izNov?: boolean): Promise<LeadState> {
  const sad = new Date().toISOString();
  const osnovno = { status, updated_at: sad };
  // status_od = od kad je u ovom ishodu; pozvan_kad = prvi izlazak iz „nov" (= pozvan).
  // Ako kolone još ne postoje (migracija-2 nije pokrenuta), snimi bar ishod.
  const dodatno = { status_od: sad, ...(izNov && status !== "nov" ? { pozvan_kad: sad } : {}) };
  let { error } = await supabaseAdmin.from("leadovi").update({ ...osnovno, ...dodatno }).eq("id", id);
  if (error) ({ error } = await supabaseAdmin.from("leadovi").update(osnovno).eq("id", id));
  revalidatePath("/");
  return rezultat(error?.message);
}

export async function obrisiLead(id: string): Promise<LeadState> {
  const { error } = await supabaseAdmin.from("leadovi").delete().eq("id", id);
  revalidatePath("/");
  return rezultat(error?.message);
}

const PORUKA_MIGRACIJA = "Baza još nije podešena — pokreni supabase/schema.sql u Supabase SQL editoru.";
const PORUKA_MIGRACIJA_2 = "Nije sačuvano: bazi fali kolona iz supabase/migracija-2.sql ili migracija-3.sql. Pokreni ih u Supabase SQL editoru.";
const jeTabelaFali = (msg?: string | null) => !!msg && /does not exist|schema cache|relation/i.test(msg);
const jeKolonaFali = (msg?: string | null) => !!msg && /column .* does not exist|schema cache/i.test(msg);
const rezultat = (msg?: string | null): LeadState =>
  !msg ? { ok: true } : { ok: false, msg: jeKolonaFali(msg) ? PORUKA_MIGRACIJA_2 : jeTabelaFali(msg) ? PORUKA_MIGRACIJA : "Nije sačuvano: " + msg };

// Brza izmena jednog polja sa kartice; vraća ok/msg umesto da tiho proguta grešku.
async function brzaIzmena(id: string, polja: Record<string, unknown>): Promise<LeadState> {
  const { error } = await supabaseAdmin.from("leadovi").update({ ...polja, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/");
  return rezultat(error?.message);
}

// Beleška posle poziva direktno sa kartice (čuva se na blur, bez otvaranja izmene).
export async function promeniBelesku(id: string, beleska: string | null): Promise<LeadState> { return brzaIzmena(id, { ishod_beleska: beleska }); }

// Datum povratnog poziva direktno sa kartice (kad je ishod „Pozvati (datum)").
export async function promeniPodsetnik(id: string, datum: string | null): Promise<LeadState> { return brzaIzmena(id, { podseti_kad: datum }); }

// Zvezdica (prioritet) sa kartice.
export async function promeniPrioritet(id: string, prioritet: boolean): Promise<LeadState> { return brzaIzmena(id, { prioritet }); }

// Zarada (RSD) kad je ishod „Kupio", sa kartice.
export async function promeniZaradu(id: string, zarada: number | null): Promise<LeadState> { return brzaIzmena(id, { zarada_rsd: zarada }); }
