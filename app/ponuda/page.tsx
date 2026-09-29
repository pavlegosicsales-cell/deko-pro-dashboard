import { Suspense } from "react";
import { PonudaView } from "@/components/PonudaView";
import { citajPonudu } from "@/lib/citajPonude";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ponuda — PromoBet" };

// /ponuda?...mere...  → nova ponuda iz kalkulatora (računa se na licu mesta)
// /ponuda?id=<uuid>   → sačuvana ponuda iz taba „Ponude", redovi tačno kako su poslati
export default async function Ponuda({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : null;
  const sacuvana = id && !JE_DEMO ? await citajPonudu(id) : null;
  return (
    <Suspense fallback={null}>
      <PonudaView sacuvana={sacuvana} nijeNadjena={!!id && !sacuvana} />
    </Suspense>
  );
}
