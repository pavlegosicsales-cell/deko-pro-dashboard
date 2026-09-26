# Deko Pro — Dashboard (kontekst)

Interni panel za **leadove** firme Deko Pro. Pravi ga PATO (Pavle). Pavle je
**call setter** — filtrira leadove kroz Instagram/Facebook/Viber poruke i upisuje
ih; **vlasnik** ih zove i beleži ishod. Optimizovano za **telefon**, optimistično i brzo.

## Izvor istine o biznisu
`context/business details` (24.09.2026.) — ceo poslovni kontekst: firme (Deko Pro brend,
PromoBet proizvođač/pravno lice, Gradi Lako izvođač), ljudi i ovlašćenja (Pavle setter,
Luka Jovanović vlasnik zatvara), proizvodi i cenovnik (RSD/kom; partnerske cene su INTERNE),
obuhvat ponude (materijal / sa prevozom / ključ u ruke), modeli START/PLUS/PRIVAT, tipovi
kupca (6), predlog modela podataka, pravila follow-upa, KPI, zaštita podataka, otvorena
pitanja **[potvrditi]**. Pročitati pre svake veće izmene. Ishodi u kodu su Lukini (7),
ne pipeline iz dokumenta (10) — vidi „Faza 1".

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
- **Dizajn panela = dizajn sajta** (23.09.2026.): `app/globals.css` nosi tokene i
  komponente prepisane iz `styles.css` sajta — plutajući pill nav (glass navy + blur),
  `.btn` pill sa okruglom ikonicom (strelica se okreće na hover), `.eyebrow`, `.tag`,
  `.stat` traka (navy / bronza / navy), `.page-head` (navy + foto `public/hero-bg.jpg`
  + preliv), `.inp` polja 50px/r10. Telo teksta je **Noto Sans** (kao na sajtu), h3 Inter.
  Sve komponentne klase su u `@layer components` da Tailwind utility klase pobeđuju.
- **Desktop = Mojsilov obrazac**: fiksni sidebar 256px (`components/Sidebar.tsx`), sadržaj
  preko cele širine bez margina, leadovi kao tabela (`LeadTabela`). Telefon: pill nav + kartice.

## Stack
Next 16.3.5 (App Router) + React 19 + TS + Tailwind v4 + Supabase (@supabase/ssr).
Isti stek kao Mojsilov-Dashboard (odatle su preuzeti config i auth/supabase infra).

## Faza 1 (ovo što je napravljeno)
Jedna glavna strana (`/`) = lista leadova, mobile-first, optimistična.
- **Dodaj lead** (dugme u top baru): ime, prezime, telefon, proizvod, izvor, info za vlasnika.
- Svaki lead: **Pozovi / Viber / WhatsApp / SMS** dugmad + padajući **ishod**.
- Ishodi (Lukin spisak, 23.09.2026.): `nov` Novi → `nije_se_javio` → `zvati_kasnije`
  „Pozvati (datum)" (+ datum, inline na kartici) → `dostaviti_ponudu` → `ponuda` „Čeka
  odgovor na ponudu" → `zatvoren` „Kupio" / `propao` „Odustao".
- Filter „Aktivni" (otvoreni), po statusu, „Svi" + pretraga. Red za zvanje:
  dospeli povratni pozivi gore, pa najstariji novi (zove se redom).
- Gornje kartice = Lukine kategorije i ujedno filteri (24.09.2026.): Pozvati (novi + nije se
  javio + dospeli povratni), Prioritetni (zvezdica + dospeli), Dostaviti ponudu, Čeka odgovor,
  Kupci (+ zbir zarade). Sitno: Zakazani / Odustali / Svi. Sat + „stiglo danas/juče" pod naslovom.
- **Unos leada = wizard** (`components/LeadWizard.tsx`, 24.09.2026.): 1 Kontakt → 2 Šta kupuje
  (obuhvat) → 3 Ograda (pretpostavka, Luka: 90% upita; dužina*, ispuna*, model, boja; sitan
  prekidač „Gradi: ograda / potporni zid / oblaganje / drugo" zameni pitanja u Materijal: boja,
  količina, opis) → 4 Za Luku (poželjni detalji, info, ishod kod izmene, spisak šta fali).
  Svaki korak ima „Pitaj kupca: …" sa Lukinom formulacijom. Grana je „šta gradi", NE obuhvat. `staFali()` u lib/opcije.ts je jedini
  izvor istine za oznaku „Nepotpun". `#novi` u URL-u otvara wizard odmah, `#novi:N` na koraku N.
- **Kvalifikacija** (Lukin zahtev, 24.09.2026., migracija-5): `temperatura` vruć/topao/hladan
  (Pavle daje predlog u wizardu, auto-predlog iz roka+podataka, Luka menja tapom na kartici),
  `tip_kupca` (srednja_klasa / dijaspora / bogatas / preporuka / status_selo / materijal, Pavlovi
  nazivi), `rok` (odmah / 1–3 meseca / proleće / ne zna), `razlog_odustajanja` obavezan kod
  „Odustao" (crven dok se ne izabere). Prioritetni uključuju vruće. Analitika: stopa zatvaranja
  i zarada po tipu / kvalitetu / izvoru + razlozi odustajanja.
- **Kalkulator** (`/kalkulator`, `lib/kalkulator.ts`, 26.09.2026., Lukin zahtev): unos dužina /
  razmak (KRAJ DO KRAJA stubnog bloka, ne osa) / visina polja / visina stuba / boja / kapije /
  zatvoren obim → raspored (polja, stubovi), zidni + stubni + okapnice + kape, cene iz cenovnika,
  težina, palete, tekst za ponudu. Modul 20×40 cm (blok + fuga) po priručniku; 12,5 kom/m².
  Luka potvrdio 26.09.2026.: stubni blok 1/red, širina 40 cm sa fugom, stub od temelja, visina
  stuba BEZ kape; cene iz cenovnika SA PDV-om. Ostale pretpostavke podesive u UI. Ručno provereni testovi: `node --experimental-strip-types
  lib/kalkulator.test.mjs`. Izvorni dokumenti u `primeri ponuda/` (nisu u gitu).
- Zvezdica (`prioritet`) na svakom leadu; `zarada_rsd` se upisuje inline kad je „Kupio".
  Analitika ima zaradu ovog meseca i ukupno. Strana `/analitika`.
- `/api/lead` — javni endpoint (token-opcioni) za buduću formu sa sajta (izvor="sajt").

## Odluke (default-ovane, potvrditi sa Pavleom)
- 7 ishoda gore (može se dodati „neispravan broj/spam" ako zatreba).
- „Zvati kasnije" ima datum + badge kad dospe.
- Proizvod = padajući spisak (START/PLUS/PRIVAT/potporni/oblaganje/ostalo).
- Auth: allowlist login (`lib/auth.ts`). Trenutno samo Pavle — **treba dodati mejl vlasnika**.

## Demo režim
Dok `NEXT_PUBLIC_SUPABASE_URL` sadrži `placeholder`, proxy pušta sve bez logina, a
`/` prikazuje probne leadove iz `lib/demo.ts` (izmene se ne čuvaju). Čim se upišu
pravi ključevi, demo se sam gasi.

## Podešavanje (TODO pre puštanja)
1. Nov Supabase projekat → popuni `.env.local` (vidi `.env.local.example`).
2. Pokreni `supabase/schema.sql` u SQL editoru.
3. Dodaj mejl vlasnika u `lib/auth.ts` i kreiraj mu nalog u Supabase Auth.
4. (Kasnije) Ugasiti javni signup u Supabase; sajt forma → `/api/lead`.

## Kasnije faze (najavljeno)
Forma sa sajta direktno u listu, analitika učinka (leadovi po izvoru, stopa
zatvaranja, učinak settera), lead tracking.
