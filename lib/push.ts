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

/** Pošalje obaveštenje svim uređajima osobe (ili svima). Vraća koliko je poslato. Nikad ne baca. */
export async function obavesti(ko: Ko | "svi", naslov: string, telo: string, url = "/ponude?tab=paja"): Promise<number> {
  try {
    if (!podesi()) return 0;
    const q = supabaseAdmin.from("pretplate").select("id, endpoint, pretplata");
    const { data } = ko === "svi" ? await q : await q.eq("ko", ko);
    let n = 0;
    for (const p of data ?? []) {
      try {
        await webpush.sendNotification(p.pretplata as webpush.PushSubscription, JSON.stringify({ naslov, telo, url }), { TTL: 60 * 60 * 24 });
        n++;
      } catch (e) {
        const st = (e as { statusCode?: number }).statusCode;
        if (st === 404 || st === 410) await supabaseAdmin.from("pretplate").delete().eq("id", p.id);  // uređaj se odjavio
      }
    }
    return n;
  } catch { return 0; }
}
