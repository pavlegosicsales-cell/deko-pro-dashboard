import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  Higgsfield sa servera (Pavle, 01.10.2026.: slika ograde na fotki kupčevog dvorišta, na jedno dugme).
  Isti MCP koji koristi Claude (https://mcp.higgsfield.ai/mcp), ali kroz običan HTTP JSON-RPC, sa
  Bearer tokenom iz env-a (HIGGSFIELD_TOKEN, važi 24 h). Kad istekne, osvežava se preko
  HIGGSFIELD_REFRESH_TOKEN + HIGGSFIELD_CLIENT_ID (Clerk), a novi par se čuva u privatnom bucketu `tajne`
  (objekat higgsfield.json) da preživi novi deploy. Env je samo početna vrednost.
  Pravila (Pavle): jedna slika = nano_banana_pro 2k, 2 kredita; cena se piše na dugmetu.
*/
const MCP = "https://mcp.higgsfield.ai/mcp";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) deko-pro-dashboard";

/** Referentni isečci boja bloka (otpremljeni na Higgsfield 01.10.2026. sa `paleta boja.jpeg`). */
export const ISECCI_BOJA: Record<string, string> = {
  "zuta": "5a8c48d2-03b2-4ada-9fea-e9aced7f8d68",
  "braon": "5481112b-0b0c-4740-9b43-7e160969e494",
  "oranz": "4b50dd39-c85e-444f-9d20-4d2cec7db81d",
  "natur_siva": "a8c54fa7-92d3-4e7d-9082-528f67a1985d",
  "crvena": "545521e6-14e9-4271-92e6-edc9f990d0e6",
  "kapucino": "c1837f56-d7e5-4846-8863-adf0e0c9b909",
  "zelena": "40effcdd-7409-44a4-8852-c1d486244e03",
  "crna": "500b1974-3f73-4de8-8a3b-fc889d3705f9",
  "multikolor": "e801bcd3-1122-4368-aa3b-5f17e6c788a9",
  "multikolor_rok": "e801bcd3-1122-4368-aa3b-5f17e6c788a9",
  "multikolor_rast": "e801bcd3-1122-4368-aa3b-5f17e6c788a9"
};
/** Fotka prave ograde sa stubovima od zidnog bloka u ravni zida (IMG_1084), za „bez stubnog bloka". */
export const REF_RAVAN_ZID = "881ba390-365b-4290-8f76-6b9f2781e54e";

let token = process.env.HIGGSFIELD_TOKEN ?? "";
let refresh = process.env.HIGGSFIELD_REFRESH_TOKEN ?? "";
const clientId = process.env.HIGGSFIELD_CLIENT_ID ?? "";

/* Osveženi token se čuva u privatnom bucketu `tajne` (objekat higgsfield.json), da preživi redeploy i
   hladan start. Service-role ključ ga čita i piše; javno nije dostupan. */
const BUCKET = "tajne", OBJEKAT = "higgsfield.json";
async function ucitajIzBaze() {
  try {
    const { data } = await supabaseAdmin.storage.from(BUCKET).download(OBJEKAT);
    if (!data) return;
    const j = JSON.parse(await data.text()) as { access_token?: string; refresh_token?: string };
    if (j.access_token) token = j.access_token;
    if (j.refresh_token) refresh = j.refresh_token;
  } catch { /* nema još */ }
}
async function sacuvajUBazu() {
  try {
    const telo = Buffer.from(JSON.stringify({ access_token: token, refresh_token: refresh, kad: new Date().toISOString() }));
    await supabaseAdmin.storage.from(BUCKET).upload(OBJEKAT, telo, { contentType: "application/json", upsert: true });
  } catch { /* prazno */ }
}

async function osvezi(): Promise<boolean> {
  if (!refresh || !clientId) return false;
  const r = await fetch("https://clerk.higgsfield.ai/oauth/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh, client_id: clientId, resource: MCP }),
  });
  if (!r.ok) return false;
  const j = await r.json() as { access_token?: string; refresh_token?: string };
  if (!j.access_token) return false;
  token = j.access_token; if (j.refresh_token) refresh = j.refresh_token;
  await sacuvajUBazu();
  return true;
}

let ucitano = false;
async function post(body: unknown, sid?: string): Promise<Response> {
  if (!ucitano) { ucitano = true; await ucitajIzBaze(); }
  const h: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "User-Agent": UA };
  if (sid) h["Mcp-Session-Id"] = sid;
  let r = await fetch(MCP, { method: "POST", headers: h, body: JSON.stringify(body) });
  if (r.status === 401) {
    // druga instanca (ili Claude) je možda već osvežila token: prvo pročitaj bucket, pa tek onda osvežavaj
    const pre = token; await ucitajIzBaze();
    if (token !== pre || await osvezi()) { h.Authorization = `Bearer ${token}`; r = await fetch(MCP, { method: "POST", headers: h, body: JSON.stringify(body) }); }
    if (r.status === 401 && token !== pre && await osvezi()) { h.Authorization = `Bearer ${token}`; r = await fetch(MCP, { method: "POST", headers: h, body: JSON.stringify(body) }); }
  }
  return r;
}

async function parsiraj(r: Response): Promise<unknown> {
  const t = await r.text();
  const linija = t.split("\n").map((x) => x.trim()).filter((x) => x.startsWith("data: ") || x.startsWith("{")).pop();
  if (!linija) throw new Error(`Higgsfield: prazan odgovor (${r.status})`);
  return JSON.parse(linija.replace(/^data: /, ""));
}

/** Jedan poziv alata: initialize → initialized → tools/call. Vraća tekst alata. */
export async function hfAlat(name: string, args: Record<string, unknown>): Promise<string> {
  const init = await post({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "deko-pro-dashboard", version: "1" } } });
  if (init.status === 401) throw new Error("Higgsfield: token istekao, a osvežavanje nije uspelo. Claude mora da obnovi prijavu.");
  const sid = init.headers.get("mcp-session-id") ?? undefined;
  await init.text();
  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sid);
  const r = await post({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, sid);
  const j = await parsiraj(r) as { result?: { content?: { text?: string }[]; isError?: boolean }; error?: { message?: string } };
  if (j.error) throw new Error("Higgsfield: " + (j.error.message ?? "greška"));
  const tekst = (j.result?.content ?? []).map((c) => c.text ?? "").join("\n");
  if (j.result?.isError) throw new Error("Higgsfield: " + tekst.slice(0, 300));
  return tekst;
}

export const uuidIz = (t: string) => t.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? null;
export const urlSlikeIz = (t: string) => t.match(/https?:\/\/\S+\.(?:png|jpe?g|webp)\S*/)?.[0]?.replace(/[)\]"',]+$/, "") ?? null;
