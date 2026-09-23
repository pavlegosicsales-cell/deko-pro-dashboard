import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON } from "@/lib/env";

// Supabase vezan za sesiju (kolačići) — za server komponente/proveru korisnika.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component ne sme da piše kolačiće — proxy to radi */ }
        },
      },
    }
  );
}
