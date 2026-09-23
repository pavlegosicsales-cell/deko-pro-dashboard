import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeadView, type LeadRow } from "@/components/LeadView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabaseAdmin
    .from("leadovi")
    .select("id, ime, prezime, telefon, proizvod, izvor, info, status, podseti_kad, ishod_beleska, created_at")
    .order("created_at", { ascending: false });

  const tabelaFali = !!error && /does not exist|schema cache|relation/i.test(error.message);
  const leadovi = (data ?? []) as LeadRow[];

  return <LeadView leadovi={leadovi} tabelaFali={tabelaFali} />;
}
