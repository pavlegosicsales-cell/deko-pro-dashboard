import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/*
  Web Push obaveštenja (Pavle, 02.10.2026.): Paji stiže kad Pavle doda novu šablon poruku za kupca,
  Pavlu kad Paja upiše ponudu. Pretplate uređaja su u tabeli `pretplate` (supabase/migracija-8.sql),
  ključevi u env-u (VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_SUBJECT).
  Na iPhone-u obaveštenja rade samo kad je panel dodat na početni ekran (PWA).
*/
export type Ko = "pavle" | "luka" | "paja";

function podesi() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:pavlegosic9@gmail.com", pub, priv);
  return true;
}

type Pretplata = { ko: Ko; endpoint: string; pretplata: webpush.PushSubscription; kad: string };
const BUCKET = "tajne", OBJEKAT = "pretplate.json";
export async function citajPretplate(): Promise<Pretplata[]> {
  try { const { data } = await supabaseAdmin.storage.from(BUCKET).download(OBJEKAT); return data ? (JSON.parse(await data.text()) as Pretplata[]) : []; } catch { return []; }
}
export async function pisiPretplate(lista: Pretplata[]) {
  await supabaseAdmin.storage.from(BUCKET).upload(OBJEKAT, Buffer.from(JSON.stringify(lista)), { contentType: "application/json", upsert: true });
}
export async function dodajPretplatu(ko: Ko, pretplata: webpush.PushSubscription) {
  const lista = (await citajPretplate()).filter((x) => x.endpoint !== pretplata.endpoint);
  lista.push({ ko, endpoint: pretplata.endpoint, pretplata, kad: new Date().toISOString() });
  await pisiPretplate(lista);
}
export async function skiniPretplatu(endpoint: string) {
  await pisiPretplate((await citajPretplate()).filter((x) => x.endpoint !== endpoint));
}

/** Pošalje obaveštenje svim uređajima osobe (ili svima). Vraća koliko je poslato. Nikad ne baca. */
export async function obavesti(ko: Ko | "svi", naslov: string, telo: string, url = "/ponude?tab=paja"): Promise<number> {
  try {
    if (!podesi()) return 0;
    const sve = await citajPretplate();
    const lista = ko === "svi" ? sve : sve.filter((x) => x.ko === ko);
    let n = 0; const mrtvi: string[] = [];
    for (const p of lista) {
      try { await webpush.sendNotification(p.pretplata, JSON.stringify({ naslov, telo, url }), { TTL: 60 * 60 * 24 }); n++; }
      catch (e) { const st = (e as { statusCode?: number }).statusCode; if (st === 404 || st === 410) mrtvi.push(p.endpoint); }
    }
    if (mrtvi.length) await pisiPretplate(sve.filter((x) => !mrtvi.includes(x.endpoint)));
    return n;
  } catch { return 0; }
}
