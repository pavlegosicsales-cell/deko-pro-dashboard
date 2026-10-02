import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";

/*
  Slike za ponudu za ugradnju (Supabase storage, bucket „slike", javan):
    GET  /api/slika?lista=1      → biblioteka (fotografije iz kataloga) + otpremljene slike
    GET  /api/slika?src=<url>    → ista slika kroz naš server (da PDF u pregledaču može da je pročita)
    POST /api/slika  (multipart, polje „slika") → otprema sliku u „ugradnja/", vraća javni URL
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "slike";
const javniUrl = (put: string) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(put).data.publicUrl;

export async function GET(req: Request) {
  if (JE_DEMO) return NextResponse.json({ slike: [] });
  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  if (src) {
    const dozvoljeno = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    if (!dozvoljeno || !src.startsWith(dozvoljeno)) return NextResponse.json({ error: "Nedozvoljen izvor." }, { status: 400 });
    const r = await fetch(src, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: "Slika nije dostupna." }, { status: 404 });
    return new NextResponse(await r.arrayBuffer(), { headers: { "Content-Type": r.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=300" } });
  }
  const slike: { url: string; ime: string; grupa: "biblioteka" | "ugradnja" }[] = [];
  for (const grupa of ["ugradnja", "biblioteka"] as const) {
    const { data } = await supabaseAdmin.storage.from(BUCKET).list(grupa, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    for (const f of data ?? []) if (f.name && !f.name.startsWith(".")) slike.push({ url: javniUrl(`${grupa}/${f.name}`), ime: f.name, grupa });
  }
  return NextResponse.json({ slike });
}

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim: baza nije povezana." }, { status: 400 });
  const forma = await req.formData();
  const f = forma.get("slika");
  if (!(f instanceof File)) return NextResponse.json({ error: "Nema fajla." }, { status: 400 });
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return NextResponse.json({ error: "Dozvoljene su JPG, PNG i WebP slike." }, { status: 400 });
  if (f.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Slika je veća od 15 MB." }, { status: 400 });
  const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
  const ime = (forma.get("ime")?.toString() ?? "slika").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "slika";
  const g = forma.get("grupa")?.toString();
  const grupa = g === "dvoriste" || g === "nacrt" ? g : "ugradnja";
  const put = `${grupa}/${Date.now()}-${ime}.${ext}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(put, Buffer.from(await f.arrayBuffer()), { contentType: f.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: javniUrl(put) });
}
