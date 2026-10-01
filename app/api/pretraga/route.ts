import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";
import type { Pogodak } from "@/components/Pretraga";

/*
  GET /api/pretraga?q=  → leadovi + dosijei + ponude koji se poklapaju (ime, telefon, mesto, broj).
  Prazan upit vraća najskorije. Služi globalnoj pretrazi (Ctrl+K).
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ime = (l: { ime: string | null; prezime: string | null }) => [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena";
const tel = (t: string | null | undefined) => (t ?? "").replace(/\D/g, "");

export async function GET(req: Request) {
  if (JE_DEMO) return NextResponse.json({ pogoci: [] });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const qTel = q.replace(/\D/g, "");
  const [l, d, p] = await Promise.all([
    supabaseAdmin.from("leadovi").select("id, ime, prezime, telefon, lokacija, status, proizvod, created_at").order("created_at", { ascending: false }).limit(400),
    supabaseAdmin.from("dosijei").select("id, kupac, telefon, mesto, opis, updated_at").order("updated_at", { ascending: false }).limit(200),
    supabaseAdmin.from("ponude").select("id, broj, kupac, mesto, datum, ukupno_rsd, created_at").order("created_at", { ascending: false }).limit(300),
  ]);
  const pogadja = (...polja: (string | null | undefined)[]) =>
    !q || polja.some((x) => (x ?? "").toLowerCase().includes(q)) || (qTel.length >= 3 && polja.some((x) => tel(x).includes(qTel)));

  const pogoci: Pogodak[] = [];
  for (const x of l.data ?? []) if (pogadja(x.ime, x.prezime, x.telefon, x.lokacija)) pogoci.push({ vrsta: "lead", id: x.id, naslov: ime(x), opis: [x.telefon, x.lokacija].filter(Boolean).join(" · ") || "lead", href: `/lead/${x.id}`, status: x.status });
  for (const x of d.data ?? []) if (pogadja(x.kupac, x.telefon, x.mesto)) pogoci.push({ vrsta: "dosije", id: x.id, naslov: x.kupac, opis: ["kupac", x.mesto, x.opis].filter(Boolean).join(" · "), href: `/ponude?dosije=${x.id}` });
  for (const x of p.data ?? []) if (pogadja(x.broj, x.kupac, x.mesto)) pogoci.push({ vrsta: "ponuda", id: x.id, naslov: `Ponuda ${x.broj} · ${x.kupac}`, opis: [x.datum, x.mesto].filter(Boolean).join(" · "), href: `/ponuda?id=${x.id}` });
  return NextResponse.json({ pogoci: pogoci.slice(0, q ? 30 : 12) });
}
