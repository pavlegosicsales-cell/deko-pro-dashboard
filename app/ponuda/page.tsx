import { Suspense } from "react";
import { PonudaView } from "@/components/PonudaView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ponuda — PromoBet" };

export default function Ponuda() {
  return (
    <Suspense fallback={null}>
      <PonudaView />
    </Suspense>
  );
}
