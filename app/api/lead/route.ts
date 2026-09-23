import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizujTelefon } from "@/lib/lead";

// Prijem leada sa sajta (kontakt forma) → ubacuje u listu sa izvor="sajt".
// Zaštita: opcioni tajni token LEAD_WEBHOOK_TOKEN (header x-lead-token ili ?k=).
// Ako token nije podešen u env-u, endpoint prima bez provere (za rani test).

export async function POST(req: Request) {
  const token = process.env.LEAD_WEBHOOK_TOKEN;
  if (token) {
    const dat = req.headers.get("x-lead-token") || new URL(req.url).searchParams.get("k");
    if (dat !== token) return Response.json({ ok: false, msg: "forbidden" }, { status: 403 });
  }

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return Response.json({ ok: false, msg: "bad json" }, { status: 400 }); }

  const str = (k: string) => { const v = b[k]; return typeof v === "string" && v.trim() ? v.trim() : null; };
  const telefon = normalizujTelefon(str("telefon") ?? str("phone"));
  const ime = str("ime") ?? str("name");
  if (!ime && !telefon) return Response.json({ ok: false, msg: "nedostaje ime ili telefon" }, { status: 400 });

  const { error } = await supabaseAdmin.from("leadovi").insert({
    ime,
    prezime: str("prezime"),
    telefon,
    proizvod: str("proizvod"),
    izvor: "sajt",
    info: str("info") ?? str("poruka") ?? str("message"),
    status: "nov",
    dodao: "sajt",
  });
  if (error) return Response.json({ ok: false, msg: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
