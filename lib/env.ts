// Supabase env sa rezervom: dok ključevi nisu upisani (lokalno placeholder,
// na Vercelu prazno), panel radi u demo režimu na probnim podacima.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
export const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";
export const JE_DEMO = /placeholder/.test(SUPABASE_URL);
// Login je isključen dok se ne postavi ZAHTEVAJ_LOGIN=1 (odluka Pavla, 23.09.2026.:
// link imaju samo on i Luka, bitnije je da proradi nego da se prave nalozi).
export const TRAZI_LOGIN = process.env.ZAHTEVAJ_LOGIN === "1";
