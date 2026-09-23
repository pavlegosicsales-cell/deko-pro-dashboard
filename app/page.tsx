import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeadView, type LeadRow } from "@/components/LeadView";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO, TRAZI_LOGIN } from "@/lib/env";

export const dynamic = "force-dynamic";

// Dok Supabase nije povezan (.env.local placeholder), panel prikazuje probne
// leadove da se izgled i tok mogu videti; izmene se tada ne čuvaju.
const demo = JE_DEMO;

export default async function Home() {
  if (demo) return <LeadView leadovi={DEMO_LEADOVI} tabelaFali={false} demo />;

  const { data, error } = await supabaseAdmin
    .from("leadovi")
    .select("id, ime, prezime, telefon, proizvod, izvor, info, status, podseti_kad, ishod_beleska, created_at")
    .order("created_at", { ascending: false });

  const tabelaFali = !!error && /does not exist|schema cache|relation/i.test(error.message);
  const leadovi = (data ?? []) as LeadRow[];

  return <LeadView leadovi={leadovi} tabelaFali={tabelaFali} login={TRAZI_LOGIN} />;
}
