import { citajLeadove } from "@/lib/citajLeadove";
import { citajPonude, tabelaPonudaFali } from "@/lib/citajPonude";
import { citajDosijee, uskladiDosijee } from "@/lib/citajDosijee";
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
  const prvo = await citajDosijee();
  // svako iz „Dostaviti ponudu" dobija dosije (Pavle, 03.10.2026.); ako je nešto dodato, čita se ponovo
  const dodato = await uskladiDosijee(leadovi as Parameters<typeof uskladiDosijee>[0], prvo.dosijei);
  const [{ ponude, error }, { dosijei, error: greskaDosijea }] = await Promise.all([citajPonude(), dodato ? citajDosijee() : Promise.resolve(prvo)]);
  return (
    <PonudeView uRedu={uRedu} ponude={ponude} dosijei={dosijei} leadovi={leadMapa} leadoviPuni={leadovi} pocetniTab={pocetniTab}
      tabelaFali={tabelaPonudaFali(error)} tabelaDosijeaFali={tabelaDosijeaFali(greskaDosijea)}
      greska={[error && !tabelaPonudaFali(error) ? error : null, greskaDosijea && !tabelaDosijeaFali(greskaDosijea) ? greskaDosijea : null].filter(Boolean).join(" · ") || null} />
  );
}
