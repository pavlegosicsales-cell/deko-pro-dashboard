"use client";

import { createBrowserClient } from "@supabase/ssr";

// Klijentski Supabase (za login/logout) — koristi javni anon ključ.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
