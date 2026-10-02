import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";
import { obavesti, type Ko } from "@/lib/push";

/*
  Pretplate za obaveštenja:
    POST   /api/push  { ko, pretplata }  → upiše uređaj (ko = pavle | luka | paja)
    DELETE /api/push  { endpoint }       → skine uređaj
    PUT    /api/push  { ko }             → probno obaveštenje toj osobi (da se vidi da radi)
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KO = new Set(["pavle", "luka", "paja"]);
const fali = (msg?: string | null) => !!msg && /does not exist|schema cache|relation/i.test(msg);
const PORUKA_MIGRACIJA = "Tabela „pretplate“ još ne postoji. Pokreni supabase/migracija-8.sql u Supabase SQL editoru.";

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { ko?: string; pretplata?: { endpoint?: string } };
  if (!b.ko || !KO.has(b.ko) || !b.pretplata?.endpoint) return NextResponse.json({ error: "Fali ko ili pretplata." }, { status: 400 });
  const { error } = await supabaseAdmin.from("pretplate").upsert({ ko: b.ko, endpoint: b.pretplata.endpoint, pretplata: b.pretplata }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: fali(error.message) ? PORUKA_MIGRACIJA : error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { endpoint?: string };
  if (!b.endpoint) return NextResponse.json({ error: "Fali endpoint." }, { status: 400 });
  await supabaseAdmin.from("pretplate").delete().eq("endpoint", b.endpoint);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { ko?: string };
  if (!b.ko || !KO.has(b.ko)) return NextResponse.json({ error: "Fali ko." }, { status: 400 });
  const n = await obavesti(b.ko as Ko, "Deko Pro: proba", "Obaveštenja rade na ovom uređaju.");
  return NextResponse.json({ ok: true, poslato: n });
}
