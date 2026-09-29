import { citajLeadove } from "@/lib/citajLeadove";
import { citajPonude, tabelaPonudaFali } from "@/lib/citajPonude";
import { PonudeView } from "@/components/PonudeView";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deko Pro — Ponude" };

export default async function Ponude() {
  const leadovi = JE_DEMO ? DEMO_LEADOVI : (await citajLeadove()).leadovi;
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const uRedu = leadovi.filter((l) => l.status === "nov" || l.status === "nije_se_javio" || (l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas)).length;

  if (JE_DEMO) return <PonudeView uRedu={uRedu} ponude={[]} demo />;
  const { ponude, error } = await citajPonude();
  return <PonudeView uRedu={uRedu} ponude={ponude} tabelaFali={tabelaPonudaFali(error)} greska={error && !tabelaPonudaFali(error) ? error : null} />;
}
