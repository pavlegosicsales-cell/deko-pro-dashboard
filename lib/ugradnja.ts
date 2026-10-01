/*
  Ponuda za ugradnju (Pavle, 01.10.2026.). Paja odgovara na specifikaciju uvek istim tekstom
  („Cena ugradnje je 5900e … Avans za rezervaciju termina je 450e … Po dinamici 2725 na dan
  počinjanja radova i 2725 kada se radovi završe"). Ovde se taj tekst nalepi, pročita u polja,
  po potrebi dotera, i ide u PDF u dizajnu Gradi Lako (znanje/ponude/ponuda-214-26).
*/

export type Ugradnja = {
  broj: string;          // „215/26"
  datum: string;         // „01.10.2026."
  kupac: string;
  lokacija: string;
  cena: number | null;   // EUR, ukupna cena radova
  avans: number | null;  // EUR, rezervacija termina
  rata1: number | null;  // EUR, na dan početka radova
  rata2: number | null;  // EUR, po završetku
  uracunato: string[];
  nijeUracunato: string[];
  pocetak: string;       // „oktobar", „po dogovoru"
  trajanje: string;      // „21 dan"
  napomena: string;      // sitan tekst ispod dinamike plaćanja
  slika: string | null;  // URL slike ograde (Supabase storage)
  bezSlike?: boolean;    // ponuda bez pojasa sa slikom (Pavle, 01.10.2026.: za Paju i Luku dok se slike ne usavrše)
  dvoriste?: string | null; // fotka kupčevog dvorišta (Supabase storage); na njoj se crta vizuelizacija
  tekst: string;         // Pajin original, čuva se da se zna odakle su brojevi
  sastavio: string;
};

export const NIJE_URACUNATO_PODRAZUMEVANO = [
  "Dekorativni blok (materijal se plaća posebno, avansno).",
  "Transport i istovar (po dogovoru).",   // Luka 01.10.2026.: ne „plaća se vozaču" (prevoz se naplaćuje kroz nas)
  "Temelj i iskop.",
];

export const NAPOMENA_PODRAZUMEVANA =
  "Avans je deo ukupne cene i ne naplaćuje se dodatno. Materijal (deko blok) se uplaćuje avansno i spreman je za oko 10 dana od uplate, nakon čega čeka termin ugradnje.";

export const PRAZNA_UGRADNJA: Ugradnja = {
  broj: "", datum: "", kupac: "", lokacija: "", cena: null, avans: null, rata1: null, rata2: null,
  uracunato: ["Zidanje ograde", "Formiranje stubova", "Postavljanje kapa i okapnica"],
  nijeUracunato: [...NIJE_URACUNATO_PODRAZUMEVANO],
  pocetak: "po dogovoru", trajanje: "", napomena: NAPOMENA_PODRAZUMEVANA, slika: null, bezSlike: false, dvoriste: null, tekst: "", sastavio: "Gradi Lako",
};

/** „5900e", „5.900", „2,725" → 5900. Tačka između hiljada se briše, zapeta je decimala samo uz 1–2 cifre. */
export function eurBroj(s: string | null | undefined): number | null {
  if (!s) return null;
  let t = s.replace(/[€e]/gi, "").replace(/\s/g, "").trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  else if (/^\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, "");
  else t = t.replace(",", ".");
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

export const eurFmt = (n: number | null | undefined) => (n == null ? "" : new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(Math.round(n)));
const m = (s: string) => s.replace(".", ",") + " m";
const velikoSlovo = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Pročita Pajin tekst u polja ponude. Ono što ne nađe ostaje iz `osnova` (ili prazno). */
export function izTekstaPaje(tekst: string, osnova: Partial<Ugradnja> = {}): Ugradnja {
  const t = tekst.replace(/\r/g, "");
  const u: Ugradnja = { ...PRAZNA_UGRADNJA, ...osnova, tekst };
  const nadji = (re: RegExp) => { const x = t.match(re); return x ? x[1] : null; };

  const cena = eurBroj(nadji(/cena\s+ugradnje\s*(?:je|iznosi|:)?\s*([\d.,]+\s*[€e]?)/i));
  if (cena != null) u.cena = cena;
  const avans = eurBroj(nadji(/avans[^\n\d]{0,80}?([\d.,]+\s*[€e]?)/i));
  if (avans != null) u.avans = avans;
  const r1 = eurBroj(nadji(/dinamici\s*[:]?\s*([\d.,]+\s*[€e]?)/i));
  const r2 = eurBroj(nadji(/\bi\s*([\d.,]+\s*[€e]?)\s*(?:kada|kad)\s+se\s+radovi/i));
  if (r1 != null) u.rata1 = r1;
  if (r2 != null) u.rata2 = r2;
  if (u.cena != null && u.avans != null && (u.rata1 == null || u.rata2 == null)) {
    const ostatak = Math.max(0, u.cena - u.avans);
    if (u.rata1 == null) u.rata1 = Math.round(ostatak / 2);
    if (u.rata2 == null) u.rata2 = Math.round(ostatak - (u.rata1 ?? 0));
  }

  // „Zidanje ograde 36m visine polja 0.8m i visine stubova 1.6m"
  const duz = nadji(/zidanje\s+(?:ograde|zida)\s*([\d.,]+)\s*m/i);
  const vp = nadji(/visine?\s+polja\s*([\d.,]+)/i);
  const vs = nadji(/visine?\s+stub(?:ova|a)\s*([\d.,]+)/i);

  // stavke između „U cenu ulazi" i „Avans"
  const blok = t.match(/u\s+cenu\s+ulazi\s*:?\s*\n([\s\S]*?)(?:\n\s*avans|$)/i);
  if (blok) {
    const linije = blok[1].split("\n").map((x) => x.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
    const stavke: string[] = [];
    let repro: string[] = [];
    for (const l of linije) {
      const s = l.toLowerCase();
      if (s.startsWith("zidanje")) {
        const opis = duz ? `Zidanje ograde ${m(duz)}${vp || vs ? ` (${[vp && `polja ${m(vp)}`, vs && `stubovi ${m(vs)}`].filter(Boolean).join(", ")})` : ""}` : velikoSlovo(l);
        stavke.push(opis, "Formiranje stubova");
      } else if (s.startsWith("lepljenje") || s.startsWith("postavljanje")) stavke.push("Postavljanje kapa i okapnica");
      else if (/^(materijal|cement|gvo[zž]|armatur|pesak|pijes)/.test(s)) repro.push(s.replace(/\.+$/, "").replace("gvozdje", "gvožđe"));
      else stavke.push(velikoSlovo(l));
    }
    if (repro.length) {
      repro = repro.filter((x) => x !== "materijal");
      stavke.push(`Repromaterijal za zidanje${repro.length ? `: ${repro.join(", ")}` : ""}`);
    }
    if (stavke.length) u.uracunato = [...new Set(stavke)];
  } else if (duz) {
    u.uracunato = [`Zidanje ograde ${m(duz)}${vp || vs ? ` (${[vp && `polja ${m(vp)}`, vs && `stubovi ${m(vs)}`].filter(Boolean).join(", ")})` : ""}`, "Formiranje stubova", "Postavljanje kapa i okapnica"];
  }

  const rok = nadji(/spreman\s+za\s+([^\n.]+?)\s+od\s+uplate/i);
  if (rok) u.napomena = `Avans je deo ukupne cene i ne naplaćuje se dodatno. Materijal (deko blok) se uplaćuje avansno i spreman je za ${rok.replace("10ak", "oko 10")} od uplate, nakon čega čeka termin ugradnje.`;
  return u;
}

/** Šta fali da bi ponuda mogla u PDF. */
export function faliZaUgradnju(u: Ugradnja): string[] {
  return [
    !u.kupac.trim() && "ime kupca",
    !u.broj.trim() && "broj ponude",
    u.cena == null && "cena radova",
  ].filter(Boolean) as string[];
}

export function imeFajlaUgradnje(u: Ugradnja): string {
  const broj = u.broj.replace(/\//g, "-").trim();
  return `Ponuda za ugradnju ${broj}${u.kupac.trim() ? " " + u.kupac.trim() : ""}.pdf`.replace(/\s+/g, " ");
}
