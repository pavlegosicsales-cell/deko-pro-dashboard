/*
  Ponuda za materijal, po templateu „PONUDA BR. 184/26" (PromoBet, 20.08.2025.).
  Mere, tekstovi i formati brojeva su izmereni iz samog PDF-a, pa se ovde ne izmišlja ništa:
  raspored je u components/PonudaView.tsx, a ovde su samo podaci i format.
*/
import {
  bojaNaziv, zavrsnaNaziv, type Ulaz, type Rezultat, type Stavka,
} from "@/lib/kalkulator";

/** Podaci koje Pavle ili Luka upisuju pre nego što se ponuda napravi. */
export type PonudaMeta = {
  broj: string;          // „185/26"
  datum: string;         // „20.08.2025."
  kupac: string;
  transportEur: number | null;   // null = bez transporta (preuzimanje), linija se ne štampa
  sastavio: string;
};

export type PonudaRed = {
  naziv: string;
  jedinica: string;
  cena: string;       // već formatirano, npr. „1,290.00 RSD"
  kolicina: string;
  ukupno: string;     // „58800.00"
  prazan: boolean;
};

export const PONUDA_META: PonudaMeta = {
  broj: "", datum: "", kupac: "", transportEur: null, sastavio: "Luka Jovanović",
};

/* --- formati brojeva tačno kao u templateu ---
   cena po jedinici ima hiljade sa zarezom (1,290.00 RSD),
   ukupno po redu nema (58800.00), a „Svega" ima (101,480.00). */
const dve = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const cenaFmt = (n: number) => dve.format(n) + " RSD";
export const redFmt = (n: number) => n.toFixed(2);
export const svegaFmt = (n: number) => dve.format(n);

/** Datum u obliku koji stoji u templateu: 20.08.2025. */
export function datumPonude(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}.`;
}

/** Naziv proizvoda onako kako je napisan u templateu, sa bojom iz kalkulatora. */
function nazivZaPonudu(s: Stavka, u: Ulaz): string {
  const boja = bojaNaziv(u.boja).toLowerCase();
  const zav = zavrsnaNaziv(u.bojaZavrsnih).toLowerCase();
  if (s.naziv.startsWith("Zidni blok")) return `Dekorativni blok ${boja} 19x19x39cm`;
  if (s.naziv.startsWith("Stubni blok")) return `Dekorativni stubni blok ${boja} 19x39x39cm`;
  if (s.naziv.startsWith("Okapnica")) return `betonska okapnica ${zav} 50x30cm`;
  if (s.naziv.startsWith("Kapa")) return `betonska kapa ${zav} 50x50cm`;
  if (s.naziv.startsWith("Dekorativna obloga")) return `Dekorativna obloga ${boja} 5x19x39cm`;
  return s.naziv;
}

/** Redosled stavki je kao u templateu: zidni, stubni, okapnica, kapa. */
const REDOSLED = ["Zidni blok", "Stubni blok", "Okapnica", "Kapa", "Dekorativna obloga"];
const mesto = (s: Stavka) => {
  const i = REDOSLED.findIndex((p) => s.naziv.startsWith(p));
  return i < 0 ? REDOSLED.length : i;
};

export const PRAZAN_RED: PonudaRed = { naziv: "", jedinica: "", cena: "", kolicina: "", ukupno: "0.00", prazan: true };

/** Tabela ponude: uvek 6 redova, kao u templateu. */
export function ponudaRedovi(u: Ulaz, r: Rezultat, brojRedova = 6): PonudaRed[] {
  const redovi = [...r.stavke]
    .sort((a, b) => mesto(a) - mesto(b))
    .filter((s) => s.kom > 0)
    .map((s): PonudaRed => {
      const poM2 = s.jedinicaCene === "m²";
      const kolicina = poM2 ? Math.round((s.kom / 12.5) * 100) / 100 : s.kom;
      return {
        naziv: nazivZaPonudu(s, u),
        jedinica: poM2 ? "m²" : "kom",
        cena: s.cena != null ? cenaFmt(s.cena) : "",
        kolicina: String(kolicina),
        ukupno: s.ukupno != null ? redFmt(s.ukupno) : "0.00",
        prazan: false,
      };
    });
  while (redovi.length < brojRedova) redovi.push({ ...PRAZAN_RED });
  return redovi;
}

/* --- prenos kalkulatora u stranu ponude preko adrese --- */
export function uAdresu(u: Ulaz, m: PonudaMeta): string {
  const q = new URLSearchParams({
    rezim: u.rezim, duzina: String(u.duzina), razmak: String(u.razmak),
    vp: String(u.visinaPolja), vs: String(u.visinaStuba), kapije: String(u.sirinaKapija),
    povrsina: String(u.povrsina), boja: u.boja, bz: u.bojaZavrsnih,
    zatvoren: u.zatvoren ? "1" : "", spojena: u.spojena ? "1" : "", okapnice: u.saOkapnicama ? "1" : "",
    broj: m.broj, datum: m.datum, kupac: m.kupac, sastavio: m.sastavio,
    transport: m.transportEur == null ? "" : String(m.transportEur),
  });
  for (const [k, v] of [...q.entries()]) if (v === "") q.delete(k);
  return "/ponuda?" + q.toString();
}
