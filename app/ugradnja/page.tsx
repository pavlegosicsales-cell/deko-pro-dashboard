import { citajLeadove } from "@/lib/citajLeadove";
import { citajDosije } from "@/lib/citajDosijee";
import { UgradnjaView } from "@/components/UgradnjaView";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deko Pro — Ponuda za ugradnju" };

// /ugradnja?dosije=<id> → ponuda za ugradnju u dosijeu tog kupca; bez parametra → nova, upisuje se ime
// /ugradnja?bezslike=1 → ponuda bez pojasa sa slikom (Pavle, 01.10.2026.: za Paju i Luku dok se slike ne usavrše)
export default async function Ugradnja({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.dosije === "string" ? sp.dosije : null;
  const bezSlike = sp.bezslike === "1";
  const leadovi = JE_DEMO ? DEMO_LEADOVI : (await citajLeadove()).leadovi;
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const uRedu = leadovi.filter((l) => l.status === "nov" || l.status === "nije_se_javio" || (l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas)).length;
  const dosije = id && !JE_DEMO ? await citajDosije(id) : null;
  return <UgradnjaView uRedu={uRedu} dosije={dosije} demo={JE_DEMO} bezSlikePocetno={bezSlike} />;
}
