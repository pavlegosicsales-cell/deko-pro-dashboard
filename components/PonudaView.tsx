"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { izracunaj, spojiRezultate, opisDela, CENOVNIK, POCETNI_ULAZ, type Ulaz, type Boja, type BojaZavrsnih, type Rezim } from "@/lib/kalkulator";
import { ponudaRedovi, svegaFmt, datumPonude, dekodirajRucne, dekodirajDeonice, dekodirajDelove, dekodirajIspravke, transportLinija, type PonudaMeta, type SacuvanaPonuda } from "@/lib/ponuda";
import { sacuvajPonudu } from "@/app/ponude/actions";
import { napraviPonudaPdf, imeFajla } from "@/lib/ponudaPdf";
import { porukaZaLarisu, larisaViberLink, LARISA_GRUPA } from "@/lib/paja";
import { porukaMaterijal, telIzAdrese } from "@/lib/slanje";
import { PosaljiKlijentu } from "@/components/PosaljiKlijentu";

/*
  Ponuda za materijal, 1:1 po templateu „PONUDA BR. 184/26" (PromoBet, 20.08.2025.).
  Svi položaji su u tačkama (pt), izmereni iz samog PDF-a, pa je raspored apsolutan.
  Tabela i uslovi teku ispod, da duži naziv proizvoda ne bi ništa isekao.
  Papir je A4; template je bio Letter, ali je širina sadržaja ista (79,2 do 527,5 pt).
*/

function izUrla(sp: URLSearchParams): { u: Ulaz; m: PonudaMeta; delovi: Ulaz[] } {
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
    brojKapija: n("bk", 0),
    povrsina: n("povrsina", POCETNI_ULAZ.povrsina),
    zatvoren: sp.get("zatvoren") === "1",
    spojena: sp.get("spojena") === "1",
    saOkapnicama: sp.get("okapnice") !== null ? sp.get("okapnice") === "1" : true,
    stubniBlok: sp.get("sb") !== "0",
    stubova: n("st", 0) || null,
    ispravke: dekodirajIspravke(sp.get("isp")),
    boja: boja && CENOVNIK.some((c) => c.v === boja) ? boja : POCETNI_ULAZ.boja,
    bojaZavrsnih: (sp.get("bz") as BojaZavrsnih) ?? "siva",
    rucne: dekodirajRucne(sp.get("rucno")),
    ...(sp.get("deonice") ? { poDeonicama: true, deonice: dekodirajDeonice(sp.get("deonice")) } : {}),
  };
  const t = sp.get("transport");
  const m: PonudaMeta = {
    broj: sp.get("broj") ?? "",
    datum: sp.get("datum") || datumPonude(),
    kupac: sp.get("kupac") ?? "",
    sastavio: sp.get("sastavio") || "Luka Jovanović",
    saIstovarom: sp.get("istovar") !== "0",
    transportEur: t == null || t === "" ? null : Number(t),
    leadId: sp.get("lead") || null,
    telefon: sp.get("tel") || "",
    dosijeId: sp.get("dosije") || null,
  };
  const delovi = dekodirajDelove(sp.get("delovi"));
  return { u: delovi[0] ?? u, m, delovi: delovi.length ? delovi : [u] };
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
.omot { margin: 0 auto 24px; overflow: hidden; }
.list { position: relative; box-sizing: border-box; width: 595.28pt; min-height: 841.89pt;
  margin: 0; background: #fff; font-family: Calibri, Carlito, "Segoe UI", sans-serif;
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
  .list { margin: 0; box-shadow: none; transform: none !important; }
  .omot { width: auto !important; height: auto !important; overflow: visible; }
  .zeleno { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export function PonudaView({ sacuvana, nijeNadjena }: { sacuvana?: SacuvanaPonuda | null; nijeNadjena?: boolean }) {
  const sp = useSearchParams();
  const izracunato = izUrla(sp);
  const r = izracunato.delovi.length > 1
    ? spojiRezultate(izracunato.delovi.map((d) => izracunaj(d)), izracunato.delovi.map(opisDela))
    : izracunaj(izracunato.u);
  // Sačuvana ponuda se prikazuje TAČNO kako je poslata (redovi iz baze), a nova se računa iz adrese.
  const u = izracunato.u;
  const m: PonudaMeta = sacuvana
    ? { broj: sacuvana.broj, datum: sacuvana.datum, kupac: sacuvana.kupac, transportEur: sacuvana.transport_eur, saIstovarom: sacuvana.sa_istovarom, sastavio: sacuvana.sastavio || "Luka Jovanović" }
    : izracunato.m;
  const redovi = sacuvana ? sacuvana.redovi : ponudaRedovi(u, r);
  const ukupno = sacuvana ? Number(sacuvana.ukupno_rsd) : r.ukupno;
  const telefonKupca = sacuvana ? telIzAdrese(sacuvana.adresa) : m.telefon || null;
  // Na telefonu je list (794 px) širi od ekrana, pa se skalira da stane; na kompu ostaje 1:1.
  const [skala, setSkala] = useState(1);
  useEffect(() => {
    const meri = () => setSkala(Math.min(1, (window.innerWidth - 16) / 794));
    meri();
    window.addEventListener("resize", meri);
    return () => window.removeEventListener("resize", meri);
  }, []);
  const [uPonudama, setUPonudama] = useState<"" | "radi" | "jeste" | "greska">(sacuvana ? "jeste" : "");
  const [porukaPonude, setPorukaPonude] = useState("");

  /* Ponuda ide u tab „Ponude" SAMA, čim se napravi PDF (Pavle, 01.10.2026.); ista ponuda se prepisuje, ne dupla. */
  const staviUPonude = async () => {
    if (sacuvana || uPonudama === "radi" || uPonudama === "jeste") return;
    setUPonudama("radi");
    const q = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    const rez = await sacuvajPonudu({
      broj: m.broj, datum: m.datum, kupac: m.kupac, mesto: u.mesto.trim() || null, rezim: u.rezim,
      ukupno_rsd: ukupno, transport_eur: m.transportEur, sa_istovarom: m.saIstovarom, sastavio: m.sastavio,
      redovi: redovi.filter((x) => !x.prazan), adresa: q, lead_id: m.leadId ?? null, dosije_id: m.dosijeId ?? null,
    });
    setPorukaPonude(rez.msg ?? "");
    setUPonudama(rez.ok ? "jeste" : "greska");
  };
  const fali = [!m.kupac.trim() && "ime i prezime kupca", !m.broj.trim() && "broj ponude"].filter(Boolean);
  const [stanje, setStanje] = useState<"" | "radi" | "gotovo" | "greska">("");

  /* Larisi u Viber grupu: poruka + PDF ZAJEDNO. Viber link nosi samo tekst, pa na telefonu ide sistemski
     „Podeli" (Web Share API) sa fajlom i tekstom: Pavle bira Viber, pa grupu. Poruka se usput stavi i u
     memoriju, ako Viber uz fajl izbaci tekst. Na računaru: PDF se skine i otvori se Viber sa tekstom. */
  const [larisaStanje, setLarisaStanje] = useState<"" | "radi" | "gotovo" | "greska">("");
  const larisi = async () => {
    setLarisaStanje("radi");
    void staviUPonude();
    const tekst = porukaZaLarisu(m.kupac, m.telefon ?? "");
    try { await navigator.clipboard.writeText(tekst); } catch { /* prazno */ }
    try {
      const blob = await napraviPonudaPdf(redovi, ukupno, m);
      const fajl = new File([blob], imeFajla(m), { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [fajl] })) {
        await nav.share({ files: [fajl], text: tekst, title: imeFajla(m) });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = imeFajla(m);
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        window.location.href = larisaViberLink(tekst);
      }
      setLarisaStanje("gotovo");
      setTimeout(() => setLarisaStanje(""), 3000);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") { setLarisaStanje(""); return; }
      console.error(e);
      setLarisaStanje("greska");
    }
  };

  const sacuvaj = async () => {
    setStanje("radi");
    void staviUPonude();
    try {
      const blob = await napraviPonudaPdf(redovi, ukupno, m);
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
        {(sacuvana || uPonudama === "jeste")
          ? <Link href="/ponude" className="dug dug-tih">U Ponudama ✓</Link>
          : uPonudama === "greska"
            ? <button type="button" onClick={staviUPonude} className="dug dug-tih">Upiši u Ponude ponovo</button>
            : uPonudama === "radi" ? <span className="savet">Upisujem u Ponude…</span> : null}
        <button type="button" onClick={larisi} disabled={larisaStanje === "radi" || fali.length > 0} className="dug dug-tih" title={`Poruka + PDF u Viber grupu „${LARISA_GRUPA}“`}>
          {larisaStanje === "radi" ? "Pravim PDF…" : larisaStanje === "gotovo" ? "Poslato Larisi ✓" : larisaStanje === "greska" ? "Nije uspelo, probaj opet" : "Larisi u Viber grupu (poruka + PDF)"}
        </button>
        <span className="savet">Kupcu:</span>
        <PosaljiKlijentu telefon={telefonKupca} saPdf={false} disabled={fali.length > 0} imeFajla={imeFajla(m)}
          klase={{ glavno: "dug", tiho: "dug dug-tih" }}
          napraviPdf={() => napraviPonudaPdf(redovi, ukupno, m)}
          tekst={(url) => porukaMaterijal(m.broj, ukupno, url)}
          onPosle={() => void staviUPonude()} />
        {nijeNadjena && <span className="fali">Ta ponuda ne postoji u Ponudama.</span>}
        {uPonudama === "greska" && <span className="fali">{porukaPonude}</span>}
        {uPonudama === "jeste" && porukaPonude && <span className="savet">{porukaPonude}</span>}
        {fali.length > 0
          ? <span className="fali">Fali {fali.join(" i ")}. Vrati se u kalkulator i upiši.</span>
          : stanje === "greska"
            ? <span className="fali">PDF nije napravljen. Probaj ponovo.</span>
            : <span className="savet">Ovo ispod je pregled. „Sačuvaj u PDF“ skida fajl i ponudu sam upisuje u Ponude{m.dosijeId ? " i u dosije kupca" : ""}.</span>}
      </div>

      <div className="omot" style={{ width: Math.round(794 * skala), height: Math.round(1123 * skala) }}>
      <div className="list" style={{ transform: `scale(${skala})`, transformOrigin: "top left" }}>
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
                <td className="c5 zeleno iznos zadnji">{svegaFmt(ukupno)}</td>
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
      </div>
    </>
  );
}
