import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";
import { hfAlat, uuidIz, urlSlikeIz, ISECCI_BOJA, REF_RAVAN_ZID } from "@/lib/higgsfield";
import { citajLead } from "@/lib/citajLeadove";
import { citajDosije } from "@/lib/citajDosijee";
import { bojaNaziv, type Boja } from "@/lib/kalkulator";
import { ulazIzLeada } from "@/lib/procena";

/*
  Vizuelizacija ograde na fotki kupčevog dvorišta (Pavle, 01.10.2026.).
    POST /api/vizuelizacija  { dvoriste: url, dosijeId?, leadId?, napomena? }  → { jobId, opis, kredita }
    GET  /api/vizuelizacija?job=<id>&ime=<kupac>                                → { status, url? }
  Dva koraka jer Vercel funkcija ne sme da čeka ceo posao: POST predaje, GET proverava (sync do ~25 s)
  i kad je gotovo skida PNG, otprema ga u bucket slike/ugradnja/ i vraća javni URL.
  Mere i boja dolaze iz leada (detalji) kao i u kalkulatoru; Pavlova pravila: uvek paneli na slici,
  bez stubnog bloka = stub u ravni zida; 2 kredita po slici (nano_banana_pro 2k).
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const m = (n: number) => String(n).replace(".", ",");

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim: baza nije povezana." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { dvoriste?: string; dosijeId?: string | null; leadId?: string | null; napomena?: string };
  if (!b.dvoriste || !/^https?:\/\//.test(b.dvoriste)) return NextResponse.json({ error: "Nema slike dvorišta." }, { status: 400 });

  // mere i boja iz leada (preko dosijea ako je dat)
  const dosije = b.dosijeId ? await citajDosije(b.dosijeId) : null;
  const leadId = b.leadId ?? dosije?.lead_id ?? null;
  const lead = leadId ? await citajLead(leadId) : null;
  const iz = lead ? ulazIzLeada(lead) : null;
  const u = iz?.ulaz ?? (dosije?.stanje?.delovi?.[0] ?? null);
  const d = (lead?.detalji ?? {}) as Record<string, string>;
  const boja = (u?.boja ?? "natur_siva") as Boja;
  const bojaIme = bojaNaziv(boja);
  const zavrsne = (u?.bojaZavrsnih ?? "siva") as string;
  const polje = u?.visinaPolja ?? 0.8, stub = u?.visinaStuba ?? 1.6, razmak = u?.razmak ?? 2.0;
  const stubniBlok = u ? u.stubniBlok : !(d.stubni_blok ?? "").toLowerCase().startsWith("n");
  const kapije = u ? { broj: u.brojKapija, sirina: u.sirinaKapija } : { broj: 0, sirina: 0 };
  const redovaPolje = Math.round(polje / 0.2), redovaStub = Math.round(stub / 0.2), blokovaUPolju = Math.max(1, Math.round(razmak / 0.4));
  const zavrsneEn = { siva: "light grey", crna: "black", bela: "white" }[zavrsne] ?? "light grey";
  const bojaEn: Record<string, string> = {
    natur_siva: "natural concrete grey", zuta: "ochre yellow", braon: "dark brown", oranz: "terracotta orange", crvena: "brick red",
    zelena: "muted green", crna: "anthracite black", kapucino: "light beige (cappuccino, pale sand-beige, not grey, not yellow)",
    multikolor_rok: "multicolour rustic mix of grey, beige and brown blocks", multikolor_rast: "multicolour rustic mix of grey, beige and brown blocks",
  };

  const prompt = [
    "Photorealistic edit of the attached photo of the customer's property. KEEP THE PHOTO EXACTLY AS IT IS: same camera angle, same house, same ground, same sky, same trees and neighbours. Only ADD a new front fence along the edge of the property where a fence would naturally stand (replace any old fence or wire there).",
    `The fence is built from split-face decorative concrete blocks in the colour "${bojaIme}": ${bojaEn[boja] ?? bojaIme}; take the exact colour and rough split rock texture from the attached close-up strip of the block. Blocks 39 x 19 cm, all whole and identical, thin light mortar joints.`,
    `Construction: low wall ${m(polje)} m high = exactly ${redovaPolje} courses, topped with a flat ${zavrsneEn} concrete coping; pillars ${m(stub)} m high = exactly ${redovaStub} courses, each with a flat ${zavrsneEn} concrete cap; pillars spaced ${m(razmak)} m apart (${blokovaUPolju} whole blocks between pillars).`,
    stubniBlok
      ? "Pillars are square 39 x 39 cm columns, slightly wider than the wall, protruding a little on both sides."
      : "There are NO separate pillars: the wall is one flat plane of constant thickness, and every few metres a one-block-wide strip of the same wall simply rises higher; nothing steps forward or back (see the reference photo of the fence with flush pillars).",
    "Between the pillars, above the low wall, dark anthracite vertical metal slat panels fill the space up to the cap height.",
    kapije.broj > 0 ? `Include ${kapije.broj} gate${kapije.broj > 1 ? "s" : ""} (total width about ${m(kapije.sirina)} m) made of the same anthracite slats, placed where the driveway or path enters.` : "",
    b.napomena?.trim() ? `Additional instructions: ${b.napomena.trim()}` : "",
    "Natural daylight matching the photo, realistic shadows and perspective so the fence sits convincingly in the scene. No people, no text, no watermark.",
  ].filter(Boolean).join("\n");

  // fotka dvorišta → Higgsfield media_id
  const uvoz = await hfAlat("media_import_url", { url: b.dvoriste, type: "image" }).catch((e: Error) => { throw new Error("Uvoz fotke dvorišta nije uspeo: " + e.message); });
  const dvoristeId = uuidIz(uvoz);
  if (!dvoristeId) return NextResponse.json({ error: "Higgsfield nije prihvatio fotku dvorišta." }, { status: 502 });

  const medias = [
    { value: dvoristeId, role: "image_references" },
    ...(ISECCI_BOJA[boja] ? [{ value: ISECCI_BOJA[boja], role: "image_references" }] : []),
    ...(!stubniBlok ? [{ value: REF_RAVAN_ZID, role: "image_references" }] : []),
  ];
  try {
    const cena = await hfAlat("generate_image", { params: { model: "nano_banana_pro", prompt, aspect_ratio: "16:9", resolution: "2k", count: 1, medias, get_cost: true } });
    const kredita = Number(cena.match(/([\d.]+)\s*credit/)?.[1] ?? 2);
    const rez = await hfAlat("generate_image", { params: { model: "nano_banana_pro", prompt, aspect_ratio: "16:9", resolution: "2k", count: 1, use_unlim: false, medias } });
    const jobId = uuidIz(rez);
    if (!jobId) return NextResponse.json({ error: "Higgsfield nije vratio posao: " + rez.slice(0, 200) }, { status: 502 });
    const opis = `${bojaIme} · polje ${m(polje)} m (${redovaPolje} reda) · stub ${m(stub)} m (${redovaStub} redova) · razmak ${m(razmak)} m · ${stubniBlok ? "stubni blok" : "stub u ravni zida"} · kape ${zavrsne} · paneli${kapije.broj ? ` · ${kapije.broj} kapija` : ""}`;
    return NextResponse.json({ jobId, opis, kredita, prompt });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim." }, { status: 400 });
  const url = new URL(req.url);
  const job = url.searchParams.get("job");
  if (!job) return NextResponse.json({ error: "Nema posla." }, { status: 400 });
  try {
    const t = await hfAlat("job_status", { jobId: job, sync: true });
    const gotovo = /completed/i.test(t);
    const neuspeh = /failed|error/i.test(t) && !gotovo;
    if (neuspeh) return NextResponse.json({ status: "failed", poruka: t.slice(0, 300) });
    const slika = gotovo ? urlSlikeIz(t) : null;
    if (!gotovo || !slika) return NextResponse.json({ status: "pending" });
    // skini PNG i otpremi u naš bucket kao JPG-kompatibilan fajl (PNG je ok, bucket prima png)
    const r = await fetch(slika);
    if (!r.ok) return NextResponse.json({ error: "Slika nije skinuta sa Higgsfielda." }, { status: 502 });
    const bajtovi = Buffer.from(await r.arrayBuffer());
    const ime = (url.searchParams.get("ime") ?? "vizuelizacija").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "vizuelizacija";
    const put = `ugradnja/${Date.now()}-${ime}-vizuelizacija.png`;
    const { error } = await supabaseAdmin.storage.from("slike").upload(put, bajtovi, { contentType: "image/png", upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "done", url: supabaseAdmin.storage.from("slike").getPublicUrl(put).data.publicUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
