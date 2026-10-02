import { citajLeadove } from "@/lib/citajLeadove";
import { citajPonude, tabelaPonudaFali } from "@/lib/citajPonude";
import { citajDosijee } from "@/lib/citajDosijee";
import { tabelaDosijeaFali } from "@/lib/dosije";
import { PonudeView } from "@/components/PonudeView";
import type { LeadZaDosije } from "@/components/DosijeKartica";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deko Pro — Ponude i kupci" };

export default async function Ponude({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const pocetniTab = sp.tab === "sve" ? "sve" : sp.tab === "paja" ? "paja" : "kupci";
  const leadovi = JE_DEMO ? DEMO_LEADOVI : (await citajLeadove()).leadovi;
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const uRedu = leadovi.filter((l) => l.status === "nov" || l.status === "nije_se_javio" || (l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas)).length;
  const leadMapa: Record<string, LeadZaDosije> = Object.fromEntries(leadovi.map((l) => [l.id, { obuhvat: l.obuhvat ?? null, status: l.status }]));

  if (JE_DEMO) return <PonudeView uRedu={uRedu} ponude={[]} demo pocetniTab={pocetniTab} />;
  const [{ ponude, error }, { dosijei, error: greskaDosijea, migracija8Fali }] = await Promise.all([citajPonude(), citajDosijee()]);
  return (
    <PonudeView uRedu={uRedu} ponude={ponude} dosijei={dosijei} leadovi={leadMapa} leadoviPuni={leadovi} migracija8Fali={!!migracija8Fali} pocetniTab={pocetniTab}
      tabelaFali={tabelaPonudaFali(error)} tabelaDosijeaFali={tabelaDosijeaFali(greskaDosijea)}
      greska={[error && !tabelaPonudaFali(error) ? error : null, greskaDosijea && !tabelaDosijeaFali(greskaDosijea) ? greskaDosijea : null].filter(Boolean).join(" · ") || null} />
  );
}
