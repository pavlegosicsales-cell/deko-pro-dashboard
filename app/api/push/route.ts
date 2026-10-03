import { NextResponse } from "next/server";
import { JE_DEMO } from "@/lib/env";
import { obavesti, dodajPretplatu, skiniPretplatu, type Ko } from "@/lib/push";

/*
  Pretplate za obaveštenja:
    POST   /api/push  { ko, pretplata }  → upiše uređaj (ko = pavle | luka | paja)
    DELETE /api/push  { endpoint }       → skine uređaj
    PUT    /api/push  { ko }             → probno obaveštenje toj osobi (da se vidi da radi)
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KO = new Set(["pavle", "luka", "paja"]);

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { ko?: string; pretplata?: { endpoint?: string } };
  if (!b.ko || !KO.has(b.ko) || !b.pretplata?.endpoint) return NextResponse.json({ error: "Fali ko ili pretplata." }, { status: 400 });
  try { await dodajPretplatu(b.ko as Ko, b.pretplata as unknown as Parameters<typeof dodajPretplatu>[1]); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { endpoint?: string };
  if (!b.endpoint) return NextResponse.json({ error: "Fali endpoint." }, { status: 400 });
  await skiniPretplatu(b.endpoint);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { ko?: string };
  if (!b.ko || !KO.has(b.ko)) return NextResponse.json({ error: "Fali ko." }, { status: 400 });
  const n = await obavesti(b.ko as Ko, "Deko Pro: proba", "Obaveštenja rade na ovom uređaju.");
  return NextResponse.json({ ok: true, poslato: n });
}
