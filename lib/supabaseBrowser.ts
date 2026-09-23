"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON } from "@/lib/env";

// Klijentski Supabase (za login/logout) — koristi javni anon ključ.
export const supabaseBrowser = () =>
  createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON
  );
