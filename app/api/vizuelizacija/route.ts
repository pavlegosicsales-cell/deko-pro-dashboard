import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JE_DEMO } from "@/lib/env";
import { hfAlat, uuidIz, urlSlikeIz, ISECCI_BOJA, FOTKE_BOJA, REF_RAVAN_ZID } from "@/lib/higgsfield";
import { citajLead } from "@/lib/citajLeadove";
import { citajDosije } from "@/lib/citajDosijee";
import { bojaNaziv, type Boja } from "@/lib/kalkulator";
import { ulazIzLeada } from "@/lib/procena";
import type { SpecSlike } from "@/lib/nacrt";

/*
  Slika ograde za ponudu za ugradnju (Pavle, 01–02.10.2026.: „izrada ponude na klik", i bez fotke dvorišta).
    POST /api/vizuelizacija  { spec?, nacrt?, dvoriste?, dosijeId?, leadId?, napomena? } → { jobId, opis, kredita }
    GET  /api/vizuelizacija?job=<id>&ime=<kupac>                                        → { status, url? }
  spec = mere i boja (sa strane ponude, popunjene iz leada ili ručno); nacrt = elevacija + pogled odozgo
  nacrtana u pregledaču (lib/nacrt.ts), predložak koji model prati blok po blok; dvoriste = fotka kupčevog
  dvorišta, neobavezno: kad je ima, ograda se crta na njoj. Dva koraka jer Vercel funkcija ne čeka ceo posao.
  Pravila: nano_banana_pro 2k, 2 kredita; uvek paneli; bez stubnog bloka = zid u jednoj ravni.
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Model (Pavle, 02.10.2026.): GPT Image 2.5, varijanta Sunburst. Dobija: nacrt, PRAVU fotku ograde u toj boji
// („to je ta boja"), isečak sa palete, (fotku dvorišta), i objašnjenje kako se blokovi broje. Promeni ovde ako treba.
const MODEL = "gpt_image_2_5";
// quality: medium = 1 kredit, high = 2,75, xhigh = 4,5 (Pavlovo pravilo: do 2 kredita po slici)
const MODEL_PARAMI = { variant: "sunburst", quality: "medium", resolution: "2k" };

const m = (n: number) => String(n).replace(".", ",");
const BOJA_EN: Record<string, string> = {
  natur_siva: "natural concrete grey", zuta: "ochre yellow", braon: "dark brown", oranz: "terracotta orange", crvena: "brick red",
  zelena: "muted green", crna: "anthracite black", kapucino: "light beige (cappuccino: pale sand-beige, not grey, not yellow, not orange)",
  multikolor_rok: "multicolour rustic mix of grey, beige and brown blocks", multikolor_rast: "multicolour rustic mix of grey, beige and brown blocks",
};
const ZAV_EN: Record<string, string> = { siva: "light grey", crna: "black", bela: "white" };

export async function POST(req: Request) {
  if (JE_DEMO) return NextResponse.json({ error: "Demo režim: baza nije povezana." }, { status: 400 });
  const b = await req.json().catch(() => ({})) as { spec?: Partial<SpecSlike>; nacrt?: string | null; dvoriste?: string | null; dosijeId?: string | null; leadId?: string | null; napomena?: string };
  const jeUrl = (s: unknown): s is string => typeof s === "string" && /^https?:\/\//.test(s);

  // spec: sa strane ponude, ili iz leada / dosijea, ili podrazumevano
  const dosije = b.dosijeId ? await citajDosije(b.dosijeId) : null;
  const leadId = b.leadId ?? dosije?.lead_id ?? null;
  const lead = leadId ? await citajLead(leadId) : null;
  const iz = lead ? ulazIzLeada(lead) : null;
  const u = iz?.ulaz ?? dosije?.stanje?.delovi?.[0] ?? null;
  const d = (lead?.detalji ?? {}) as Record<string, string>;
  const sp: SpecSlike = {
    boja: b.spec?.boja ?? u?.boja ?? "natur_siva",
    visinaPolja: b.spec?.visinaPolja ?? u?.visinaPolja ?? 0.8,
    visinaStuba: b.spec?.visinaStuba ?? u?.visinaStuba ?? 1.6,
    razmak: b.spec?.razmak ?? u?.razmak ?? 2.0,
    stubniBlok: b.spec?.stubniBlok ?? (u ? u.stubniBlok : !(d.stubni_blok ?? "").toLowerCase().startsWith("n")),
    bojaZavrsnih: (b.spec?.bojaZavrsnih ?? u?.bojaZavrsnih ?? "siva") as SpecSlike["bojaZavrsnih"],
    brojKapija: b.spec?.brojKapija ?? u?.brojKapija ?? 0,
    sirinaKapija: b.spec?.sirinaKapija ?? u?.sirinaKapija ?? 0,
    paneli: b.spec?.paneli ?? true,
  };
  const boja = sp.boja as Boja, bojaIme = bojaNaziv(boja);
  const redovaPolje = Math.round(sp.visinaPolja / 0.2), redovaStub = Math.round(sp.visinaStuba / 0.2), blokovaUPolju = Math.max(1, Math.round(sp.razmak / 0.4));
  const zav = ZAV_EN[sp.bojaZavrsnih] ?? "light grey";
  const saFotkom = jeUrl(b.dvoriste), saNacrtom = jeUrl(b.nacrt);

  const imaFotkuBoje = !!FOTKE_BOJA[boja];
  const konstrukcija = [
    `HOW THIS FENCE IS BUILT (read carefully, the numbers matter): it is made of ONE kind of block only, a split-face decorative concrete block 39 cm long, 19 cm high, 19 cm deep. With the 1 cm mortar joint each block takes 40 cm of length and 20 cm of height, so EVERY 20 cm of height is exactly ONE course of blocks and every 40 cm of length is exactly ONE block. Count the courses: a ${m(sp.visinaPolja)} m wall is ${redovaPolje} courses, a ${m(sp.visinaStuba)} m pillar is ${redovaStub} courses, a ${m(sp.razmak)} m field holds ${blokovaUPolju} whole blocks. All blocks are whole and identical, NO half blocks, NO cut pieces, NO blocks of different sizes, stacked one on top of another with the vertical joints aligned, thin light mortar joints. Caps and copings are flat concrete plates, not blocks.`,
    `Low wall ${m(sp.visinaPolja)} m high = EXACTLY ${redovaPolje} courses, topped with a flat ${zav} concrete coping. Taller parts ${m(sp.visinaStuba)} m high = EXACTLY ${redovaStub} courses, each topped with a flat ${zav} concrete cap, spaced ${m(sp.razmak)} m apart (${blokovaUPolju} whole blocks between them), every field identical.`,
    sp.stubniBlok
      ? `The taller parts are pillars built from square 39 x 39 cm pillar blocks: slightly wider than the wall, protruding a little on both faces, with the cap slightly wider than the pillar.`
      : `There are NO pillars, NO piers, NO columns: the wall is ONE perfectly flat plane of constant thickness (19 cm); every ${m(sp.razmak)} m a one-block-wide strip of the same flat wall simply rises higher, in the same plane, same thickness, no side faces, no shadow line, nothing steps forward or back (the plan view in the drawing is a straight band).`,
    sp.paneli ? `Between the taller parts, above the low wall, dark anthracite vertical metal slat panels fill the space up to the cap height.` : `Between the taller parts, above the low wall, there is nothing, just open air.`,
    sp.brojKapija > 0 && sp.sirinaKapija > 0 ? `${sp.brojKapija === 1 ? "One gate" : `${sp.brojKapija} gates`} (total width about ${m(sp.sirinaKapija)} m) made of the same anthracite slats, reaching down to the ground.` : "",
    imaFotkuBoje
      ? `BLOCK COLOUR: one of the attached images is a real photo of a finished Deko fence in the colour "${bojaIme}". THAT is the colour and the surface of the blocks: match it exactly (same hue, same brightness, same rough split rock texture, same light speckles); the attached close-up strip shows the same block even closer. Do not invent another shade. Only the construction (heights, counts, pillar type, panels, gates) comes from the drawing, not from that photo.`
      : `Block colour "${bojaIme}": ${BOJA_EN[boja] ?? bojaIme}; take the exact colour and the rough split rock texture from the attached close-up strip of the block, do not invent another shade.`,
  ].filter(Boolean).join("\n");

  const prompt = saFotkom
    ? [
        "Photorealistic edit of the attached photo of the customer's property. KEEP THE PHOTO AS IT IS: same camera angle and framing, same house, ground, sky, trees and neighbours. Only ADD a new front fence along the edge of the property where a fence naturally stands (replace any old fence or wire there), with realistic perspective and shadows so it sits convincingly in the scene.",
        saNacrtom ? "The attached construction drawing (elevation on top, plan view below) is a strict template for the fence: reproduce it block for block." : "",
        konstrukcija,
        b.napomena?.trim() ? `Additional instructions: ${b.napomena.trim()}` : "",
        "Natural daylight matching the photo. No people, no text, no watermark.",
      ].filter(Boolean).join("\n")
    : [
        "Turn the attached construction drawing into a photorealistic photograph. The drawing has two parts: the top is the front elevation, the bottom strip is the PLAN VIEW (seen from above). Reproduce it EXACTLY, block for block.",
        konstrukcija,
        "View: from the sidewalk across the street at a slight angle (about 15 degrees), 16:9, soft daylight; a tidy lawn and a single-family house with light facade and tiled roof behind the fence, concrete sidewalk, curb and asphalt street in front. Village street in Serbia.",
        b.napomena?.trim() ? `Additional instructions: ${b.napomena.trim()}` : "",
        "No people, no text, no watermark, no license plates, no cars. Realistic materials, architectural photography quality.",
      ].filter(Boolean).join("\n");

  try {
    const medias: { value: string; role: string }[] = [];
    if (saNacrtom) { const t = await hfAlat("media_import_url", { url: b.nacrt, type: "image" }); const id = uuidIz(t); if (id) medias.push({ value: id, role: "image_references" }); }
    if (saFotkom) { const t = await hfAlat("media_import_url", { url: b.dvoriste, type: "image" }); const id = uuidIz(t); if (!id) return NextResponse.json({ error: "Higgsfield nije prihvatio fotku dvorišta." }, { status: 502 }); medias.push({ value: id, role: "image_references" }); }
    if (FOTKE_BOJA[boja]) medias.push({ value: FOTKE_BOJA[boja], role: "image_references" });
    if (ISECCI_BOJA[boja]) medias.push({ value: ISECCI_BOJA[boja], role: "image_references" });
    if (!sp.stubniBlok && !saFotkom) medias.push({ value: REF_RAVAN_ZID, role: "image_references" });
    if (medias.length === 0) return NextResponse.json({ error: "Nema ni nacrta ni fotke." }, { status: 400 });

    const cena = await hfAlat("generate_image", { params: { model: MODEL, ...MODEL_PARAMI, prompt, aspect_ratio: "16:9", count: 1, medias, get_cost: true } });
    const kredita = Number(cena.match(/([\d.]+)\s*credit/)?.[1] ?? 2);
    const rez = await hfAlat("generate_image", { params: { model: MODEL, ...MODEL_PARAMI, prompt, aspect_ratio: "16:9", count: 1, use_unlim: false, medias } });
    const jobId = uuidIz(rez);
    if (!jobId) return NextResponse.json({ error: "Higgsfield nije vratio posao: " + rez.slice(0, 200) }, { status: 502 });
    const opis = `${bojaIme} · polje ${m(sp.visinaPolja)} m (${redovaPolje} reda) · stub ${m(sp.visinaStuba)} m (${redovaStub} redova) · razmak ${m(sp.razmak)} m · ${sp.stubniBlok ? "stubni blok" : "stub u ravni zida"} · kape ${sp.bojaZavrsnih}${sp.paneli ? " · paneli" : ""}${sp.brojKapija ? ` · ${sp.brojKapija} kapija` : ""}${saFotkom ? " · na fotki dvorišta" : ""}`;
    return NextResponse.json({ jobId, opis, kredita });
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
