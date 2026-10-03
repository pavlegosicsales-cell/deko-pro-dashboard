import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Dosije } from "@/lib/dosije";

const KOLONE = "id, lead_id, kupac, telefon, mesto, opis, ukupno_rsd, palete, kg, stanje, prevoznik, prevoz_poslato_kad, transport_eur, sa_istovarom, paja_poslato_kad, ugradnja, ugradnja_kad, created_at, updated_at";
const KOLONE_8 = KOLONE;   // Pajina razmena je u ugradnja jsonb, nema posebne kolone
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

/** Pavle 03.10.2026.: svako iz „Dostaviti ponudu" (ključ u ruke / sa prevozom) ima dosije u tabu Kupci, i bez kalkulatora,
    da se vidi šta mu fali. Pravi dosijee koji nedostaju; vraća koliko je napravljeno. Idempotentno. */
export async function uskladiDosijee(leadovi: { id: string; ime: string | null; prezime: string | null; telefon: string | null; lokacija?: string | null; status: string; obuhvat?: string | null; duzina_m?: number | null; detalji?: Record<string, string> | null }[], dosijei: Dosije[]): Promise<number> {
  const ima = new Set(dosijei.map((d) => d.lead_id).filter(Boolean));
  const novi = leadovi.filter((l) => l.status === "dostaviti_ponudu" && l.obuhvat !== "materijal" && !ima.has(l.id));
  if (!novi.length) return 0;
  const sad = new Date().toISOString();
  const redovi = novi.map((l) => ({
    lead_id: l.id, kupac: [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena", telefon: l.telefon, mesto: l.lokacija ?? null,
    opis: [l.duzina_m ? `Ograda ${l.duzina_m} m` : null, l.detalji?.boja ?? null].filter(Boolean).join(" · ") || null, updated_at: sad,
  }));
  const { error } = await supabaseAdmin.from("dosijei").insert(redovi);
  return error ? 0 : redovi.length;
}
