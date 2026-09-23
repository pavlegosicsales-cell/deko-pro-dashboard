# Deko Pro — Dashboard (kontekst)

Interni panel za **leadove** firme Deko Pro. Pravi ga PATO (Pavle). Pavle je
**call setter** — filtrira leadove kroz Instagram/Facebook/Viber poruke i upisuje
ih; **vlasnik** ih zove i beleži ishod. Optimizovano za **telefon**, optimistično i brzo.

## Klijent — Deko Pro
- Proizvodnja + prodaja + transport + ugradnja ograda i potpornih zidova od
  **dekorativnog betonskog bloka** (turnkey). Od 2015. Cela Srbija, sopstveni transport.
- Telefon: **062 253 140**. Instagram: `@dekorativni_blok_deko_pro` (~5.8k),
  Facebook: profile 61568610785095, Viber grupa.
- Sajt (odvojen projekat): repo `Deko-Pro`, live `https://deko-pro.vercel.app`.
- Modeli ograda: **START, PLUS, PRIVAT**; + potporni zidovi, oblaganje/fasada.
  Boje: ~12 nijansi (Natur, Kapućino, Rast, Rock, crvena, narandžasta…).
  Ispune/kapije/rasveta se posebno naplaćuju. Cene po meri.

## Brend (sa živog sajta, izvor istine)
- Navy (ink): `#0B1E3B` · Zlatna (flame): `#D0B26A` · Zlatna-deep: `#8A6A2F`
- Fontovi: **Outfit** (display, uppercase naslovi), **Inter** (telo).
- Logo: `public/logo-mark.png` (256×256, skinut sa sajta).
- Estetika: arhitektonski blueprint/line-art.

## Stack
Next 16.3.5 (App Router) + React 19 + TS + Tailwind v4 + Supabase (@supabase/ssr).
Isti stek kao Mojsilov-Dashboard (odatle su preuzeti config i auth/supabase infra).

## Faza 1 (ovo što je napravljeno)
Jedna glavna strana (`/`) = lista leadova, mobile-first, optimistična.
- **Dodaj lead** (dugme u top baru): ime, prezime, telefon, proizvod, izvor, info za vlasnika.
- Svaki lead: **Pozovi / Viber / WhatsApp / SMS** dugmad + padajući **ishod**.
- Ishodi: `nov` (Za poziv) → `nije_se_javio` → `zvati_kasnije` (+ datum) →
  `zainteresovan` → `ponuda` → `zatvoren` / `propao`.
- Filter „Za zvanje" (otvoreni), po statusu, „Svi" + pretraga. Red za zvanje:
  dospeli povratni pozivi gore, pa najstariji novi (zove se redom).
- KPI: U redu / Dospelo danas / Zatvoreno.
- `/api/lead` — javni endpoint (token-opcioni) za buduću formu sa sajta (izvor="sajt").

## Odluke (default-ovane, potvrditi sa Pavleom)
- 7 ishoda gore (može se dodati „neispravan broj/spam" ako zatreba).
- „Zvati kasnije" ima datum + badge kad dospe.
- Proizvod = padajući spisak (START/PLUS/PRIVAT/potporni/oblaganje/ostalo).
- Auth: allowlist login (`lib/auth.ts`). Trenutno samo Pavle — **treba dodati mejl vlasnika**.

## Podešavanje (TODO pre puštanja)
1. Nov Supabase projekat → popuni `.env.local` (vidi `.env.local.example`).
2. Pokreni `supabase/schema.sql` u SQL editoru.
3. Dodaj mejl vlasnika u `lib/auth.ts` i kreiraj mu nalog u Supabase Auth.
4. (Kasnije) Ugasiti javni signup u Supabase; sajt forma → `/api/lead`.

## Kasnije faze (najavljeno)
Forma sa sajta direktno u listu, analitika učinka (leadovi po izvoru, stopa
zatvaranja, učinak settera), lead tracking.
