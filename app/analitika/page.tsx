import { citajLeadove } from "@/lib/citajLeadove";
import type { LeadRow } from "@/components/LeadView";
import { AnalitikaView } from "@/components/AnalitikaView";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Analitika() {
  let leadovi: LeadRow[] = DEMO_LEADOVI;
  if (!JE_DEMO) leadovi = (await citajLeadove()).leadovi;
  return <AnalitikaView leadovi={leadovi} />;
}
