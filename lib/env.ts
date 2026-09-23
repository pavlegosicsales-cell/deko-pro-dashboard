// Supabase env sa rezervom: dok ključevi nisu upisani (lokalno placeholder,
// na Vercelu prazno), panel radi u demo režimu na probnim podacima.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
export const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";
export const JE_DEMO = /placeholder/.test(SUPABASE_URL);
