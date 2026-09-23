# Deko Pro — Dashboard

Interni panel za leadove (Deko Pro). Next 16 + React 19 + Tailwind v4 + Supabase.
Vidi `CONTEXT.md` za poslovni kontekst, brend i stanje.

## Pokretanje lokalno
```bash
npm install
cp .env.local.example .env.local   # popuni Supabase ključeve
npm run dev
```

## Podešavanje baze
Pokreni `supabase/schema.sql` u Supabase SQL editoru (tabela `leadovi` + RLS).

## Pristup
Login je allowlist (`lib/auth.ts`) + Supabase email/password. Dodaj mejlove tima tamo
i kreiraj naloge u Supabase Auth.
