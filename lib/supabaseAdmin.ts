// SAMO za server (server komponente / server akcije). Koristi service_role ključ
// koji zaobilazi RLS. NIKAD ne uvoziti u klijentski ("use client") kod.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE } from "@/lib/env";

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE,
  { auth: { persistSession: false } }
);
