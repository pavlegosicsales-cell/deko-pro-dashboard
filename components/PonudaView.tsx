"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { izracunaj, CENOVNIK, POCETNI_ULAZ, type Ulaz, type Boja, type BojaZavrsnih, type Rezim } from "@/lib/kalkulator";
import { ponudaRedovi, svegaFmt, datumPonude, dekodirajRucne, transportLinija, type PonudaMeta } from "@/lib/ponuda";
import { napraviPonudaPdf, imeFajla } from "@/lib/ponudaPdf";

/*
  Ponuda za materijal, 1:1 po templateu „PONUDA BR. 184/26" (PromoBet, 20.08.2025.).
  Svi položaji su u tačkama (pt), izmereni iz samog PDF-a, pa je raspored apsolutan.
  Tabela i uslovi teku ispod, da duži naziv proizvoda ne bi ništa isekao.
  Papir je A4; template je bio Letter, ali je širina sadržaja ista (79,2 do 527,5 pt).
*/

function izUrla(sp: URLSearchParams): { u: Ulaz; m: PonudaMeta } {
  const n = (k: string, d: number) => { const v = parseFloat(sp.get(k) ?? ""); return isNaN(v) ? d : v; };
  const boja = sp.get("boja") as Boja | null;
  const u: Ulaz = {
    ...POCETNI_ULAZ,
    rezim: (sp.get("rezim") as Rezim) ?? "ograda",
    duzina: n("duzina", POCETNI_ULAZ.duzina),
    razmak: n("razmak", POCETNI_ULAZ.razmak),
    visinaPolja: n("vp", POCETNI_ULAZ.visinaPolja),
    visinaStuba: n("vs", POCETNI_ULAZ.visinaStuba),
    sirinaKapija: n("kapije", 0),
    povrsina: n("povrsina", POCETNI_ULAZ.povrsina),
    zatvoren: sp.get("zatvoren") === "1",
    spojena: sp.get("spojena") === "1",
    saOkapnicama: sp.get("okapnice") !== null ? sp.get("okapnice") === "1" : true,
    stubniBlok: sp.get("sb") !== "0",
    boja: boja && CENOVNIK.some((c) => c.v === boja) ? boja : POCETNI_ULAZ.boja,
    bojaZavrsnih: (sp.get("bz") as BojaZavrsnih) ?? "siva",
    rucne: dekodirajRucne(sp.get("rucno")),
  };
  const t = sp.get("transport");
  const m: PonudaMeta = {
    broj: sp.get("broj") ?? "",
    datum: sp.get("datum") || datumPonude(),
    kupac: sp.get("kupac") ?? "",
    sastavio: sp.get("sastavio") || "Luka Jovanović",
    saIstovarom: sp.get("istovar") !== "0",
    transportEur: t == null || t === "" ? null : Number(t),
  };
  return { u, m };
}

const STIL = `
html, body { background: #6b7280; margin: 0; }
.alatke { display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 14px 18px; font-family: system-ui, sans-serif; font-size: 14px; color: #fff; }
.dug { display: inline-block; border: 0; border-radius: 8px; padding: 9px 14px; font-size: 14px;
  font-weight: 600; background: #0b1e3b; color: #fff; cursor: pointer; text-decoration: none; }
.dug-tih { background: rgba(255,255,255,0.16); }
.dug:disabled { opacity: .5; cursor: not-allowed; }
.savet { opacity: .85; font-size: 12.5px; }
.fali { background: #fde68a; color: #7c2d12; border-radius: 8px; padding: 9px 14px; font-weight: 600; }

/* ---------- list papira ---------- */
.list { position: relative; box-sizing: border-box; width: 595.28pt; min-height: 841.89pt;
  margin: 0 auto 24px; background: #fff; font-family: Calibri, Carlito, "Segoe UI", sans-serif;
  font-size: 10.1pt; line-height: 1; color: #000; box-shadow: 0 6px 24px rgba(0,0,0,.35); }
.logo { position: absolute; left: 80pt; top: 68pt; height: 69pt; width: auto; }
.naslov { position: absolute; left: 118pt; top: 146.5pt; font-size: 11pt; font-weight: 700; white-space: nowrap; }
.datum { position: absolute; left: 309pt; top: 147.4pt; font-weight: 700; white-space: nowrap; }

.okvir { position: absolute; box-sizing: border-box; border: 0.85pt solid #000; }
.firma { left: 79.2pt; top: 184.4pt; width: 172.7pt; height: 206.1pt; }
.kupac { left: 302.4pt; top: 184.4pt; width: 97.7pt; height: 96.8pt; }
.okvir > div { position: absolute; left: 0; right: 0; }
.sred { text-align: center; }
.levo { text-align: left; padding-left: 1.8pt; }
.podebljano { font-weight: 700; }
.sitno { font-size: 9.2pt; }
.r1 { top: 29.1pt; } .r2 { top: 42.4pt; } .r3 { top: 55.8pt; }
.a1 { top: 100.2pt; } .a2 { top: 118.2pt; } .a3 { top: 139.9pt; }
.a4 { top: 159.9pt; } .a5 { top: 175.9pt; } .a6 { top: 194.2pt; }
.k1 { top: 42.4pt; }

/* ---------- tabela i uslovi ---------- */
.donji { position: absolute; left: 79.2pt; top: 407.6pt; width: 447.5pt; }
.tab { border-collapse: collapse; table-layout: fixed; width: 447.5pt; }
.tab td { border: 0.85pt solid #000; padding: 0; vertical-align: middle; text-align: center; }
.c1 { width: 171.8pt; } .c2 { width: 51.4pt; } .c3 { width: 96.8pt; }
.c4 { width: 60pt; } .c5 { width: 67.5pt; }
.tab tr { height: 13.9pt; }
.zaglavlje td { height: 59.9pt; font-weight: 700; line-height: 13.35pt; }
.tab td.c1 { text-align: left; padding-left: 1.8pt; vertical-align: top; }
.zaglavlje td.c1 { text-align: center; padding-left: 0; vertical-align: middle; }
.proizvod { font-family: Arial, Helvetica, sans-serif; line-height: 13.35pt; padding-top: 0.6pt; }
.tab td.iznos { text-align: right; padding-right: 2.7pt; }
.zeleno { background: #c6efce; color: #006100; }
.tab td.levo-tekst { text-align: left; padding-left: 2pt; }
.tab td.zadnji { padding-right: 10.7pt; }
.svega td { height: 14pt; }

.uslovi { margin-top: 13pt; }
.uslovi p { margin: 0; padding-left: 1.8pt; line-height: 13.35pt; }

/* ---------- štampa ---------- */
@page { size: A4 portrait; margin: 0; }
@media print {
  html, body { background: #fff; }
  .alatke { display: none; }
  .list { margin: 0; box-shadow: none; }
  .zeleno { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export function PonudaView() {
  const sp = useSearchParams();
  const { u, m } = izUrla(sp);
  const r = izracunaj(u);
  const redovi = ponudaRedovi(u, r);
  const fali = [!m.kupac.trim() && "ime i prezime kupca", !m.broj.trim() && "broj ponude"].filter(Boolean);
  const [stanje, setStanje] = useState<"" | "radi" | "gotovo" | "greska">("");

  const sacuvaj = async () => {
    setStanje("radi");
    try {
      const blob = await napraviPonudaPdf(u, r, m);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = imeFajla(m);
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      setStanje("gotovo");
      setTimeout(() => setStanje(""), 2500);
    } catch (e) {
      console.error(e);
      setStanje("greska");
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STIL }} />

      <div className="alatke">
        <Link href="/kalkulator" className="dug dug-tih">← Kalkulator</Link>
        <button type="button" onClick={sacuvaj} disabled={stanje === "radi" || fali.length > 0} className="dug">
          {stanje === "radi" ? "Pravim PDF…" : stanje === "gotovo" ? "Sačuvano ✓" : "Sačuvaj u PDF"}
        </button>
        {fali.length > 0
          ? <span className="fali">Fali {fali.join(" i ")}. Vrati se u kalkulator i upiši.</span>
          : stanje === "greska"
            ? <span className="fali">PDF nije napravljen. Probaj ponovo.</span>
            : <span className="savet">Ovo ispod je pregled. Dugme skida gotov PDF, bez štampača.</span>}
      </div>

      <div className="list">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/promobet-logo.png" alt="PromoBet" className="logo" />

        <div className="naslov">PONUDA BR. {m.broj}</div>
        <div className="datum">Datum : {m.datum}</div>

        <div className="okvir firma">
          <div className="sred r1">Radnja za proizvodnju proizvoda od</div>
          <div className="sred r2">betona, građevinske usluge i trgovinu</div>
          <div className="sred r3 podebljano">PROMOBET</div>
          <div className="levo a1">Ive Andrića 1,</div>
          <div className="levo a2">Mladenovac</div>
          <div className="levo a3">PIB:108962996</div>
          <div className="levo a4">MB:63826782</div>
          <div className="levo a5">Kontakt telefon: 062/253-140</div>
          <div className="levo a6 sitno">E-mail: komercijalapromobet@gmail.com</div>
        </div>

        <div className="okvir kupac"><div className="sred k1">{m.kupac}</div></div>

        <div className="donji">
          <table className="tab">
            <tbody>
              <tr className="zaglavlje">
                <td className="c1">NAZIV PROIZVODA</td>
                <td className="c2">Jedinica<br />mere</td>
                <td className="c3">Cena po jedinici<br />mere/DIN</td>
                <td className="c4">Predviđena<br />količina</td>
                <td className="c5">Ukupno/<br />DIN</td>
              </tr>
              {redovi.map((x, i) => (
                <tr key={i}>
                  <td className="c1 proizvod">{x.naziv}</td>
                  <td className="c2">{x.jedinica}</td>
                  <td className="c3">{x.cena}</td>
                  <td className="c4">{x.kolicina}</td>
                  <td className="c5 iznos">{x.ukupno}</td>
                </tr>
              ))}
              <tr className="svega">
                <td className="c1" />
                <td className="c2 zeleno levo-tekst" colSpan={3}>Svega:</td>
                <td className="c5 zeleno iznos zadnji">{svegaFmt(r.ukupno)}</td>
              </tr>
            </tbody>
          </table>

          <div className="uslovi">
            <p>U cenu je uracunat PDV</p>
            <p>Način plaćanja :&nbsp; Avans</p>
            <p>Rok isporuke : 15 radnih dana od uplate avansa</p>
            <p>U prilogu ove ponude nalaze se tehnicki listovi ponudjenih proizvoda</p>
            <p>Prihvatanjem ove ponude saglasni ste sa uslovima i karakteristikama navedenim u tehnickom listu</p>
            <p>Trajanje ove ponude je 3 dana.</p>
            <p>Ponuda je važeća bez potpisa i pečata.</p>
            {m.transportEur != null && m.transportEur > 0 && <p>{transportLinija(m)}</p>}
            <p>Ponudu sastavio: {m.sastavio}</p>
          </div>
        </div>
      </div>
    </>
  );
}
