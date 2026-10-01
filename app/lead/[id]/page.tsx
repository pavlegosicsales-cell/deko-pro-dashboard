import { notFound } from "next/navigation";
import { citajLeadove, citajLead } from "@/lib/citajLeadove";
import { citajDosijeZaLead } from "@/lib/citajDosijee";
import { citajPonudeZaLead } from "@/lib/citajPonude";
import { LeadStrana } from "@/components/LeadStrana";
import { JE_DEMO, TRAZI_LOGIN } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deko Pro — Lead" };

/*
  Strana leada (Pavle, 01.10.2026.): celokupno stanje na jednom mestu: podaci, kvalifikacija, ishod,
  dosije (materijal / prevoz / ugradnja), sve ponude, i jednostavna forma za izmenu (wizard je samo za unos).
  /lead/<id>?uredi=1 otvara formu odmah.
*/
export default async function Lead({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (JE_DEMO) notFound();
  const [lead, { leadovi }] = await Promise.all([citajLead(id), citajLeadove()]);
  if (!lead) notFound();
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const uRedu = leadovi.filter((l) => l.status === "nov" || l.status === "nije_se_javio" || (l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas)).length;
  const dosije = await citajDosijeZaLead(id);
  const ponude = await citajPonudeZaLead(id, dosije?.id ?? null);
  return <LeadStrana lead={lead} dosije={dosije} ponude={ponude} uRedu={uRedu} login={TRAZI_LOGIN} urediOdmah={sp.uredi === "1"} />;
}
