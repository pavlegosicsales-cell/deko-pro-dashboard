import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";

/*
  PDF-ovi ponuda (Supabase storage, bucket „dokumenti", javan, samo application/pdf):
    POST /api/pdf  (multipart, polje „pdf", neobavezno „ime") → otprema u „ponude/", vraća javni URL
  Pavle (01.10.2026.): svaka ponuda mora da ima „Sačuvaj u PDF" i „Pošalji klijentu" (Viber / WhatsApp).
  Viber i WhatsApp link ne mogu da ponesu fajl, pa poruka nosi link na ovaj PDF.
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "dokumenti";

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim: baza nije povezana." }, { status: 400 });
  const forma = await req.formData();
  const f = forma.get("pdf");
  if (!(f instanceof File)) return NextResponse.json({ error: "Nema fajla." }, { status: 400 });
  if (f.size > 20 * 1024 * 1024) return NextResponse.json({ error: "PDF je veći od 20 MB." }, { status: 400 });
  const bajtovi = Buffer.from(await f.arrayBuffer());
  if (bajtovi.subarray(0, 4).toString("latin1") !== "%PDF") return NextResponse.json({ error: "Fajl nije PDF." }, { status: 400 });
  const ime = (forma.get("ime")?.toString() ?? f.name ?? "ponuda").replace(/\.pdf$/i, "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "ponuda";
  const put = `ponude/${Date.now()}-${ime}.pdf`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(put, bajtovi, { contentType: "application/pdf", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(put).data.publicUrl });
}
