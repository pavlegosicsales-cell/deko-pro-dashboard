import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase vezan za sesiju (kolačići) — za server komponente/proveru korisnika.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
