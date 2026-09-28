"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import {
  izracunaj, ponudaTekst, internaBeleska, redoviZaVisinu, obimPlaca,
  CENOVNIK, ZAVRSNE_BOJE, PODRAZUMEVANO, POCETNI_ULAZ,
  type Ulaz, type Podesavanja, type Boja, type BojaZavrsnih, type Rezim,
} from "@/lib/kalkulator";
import { rsd } from "@/lib/format";
import { PONUDA_META, datumPonude, uAdresu, type PonudaMeta } from "@/lib/ponuda";

/*
  Kalkulator po pravilima iz „Deko Pro – pravila za računanje ograda, zidova i obloga" (27.09.2026.):
  tačna dužina, +5 % na svaku stavku, zaokruživanje na najbliži ceo broj, visine u celim redovima od 20 cm.
  Tri režima: ograda sa stubovima, pun zid bez stubova, dekorativna obloga.
*/

const REZIMI: { v: Rezim; l: string; opis: string }[] = [
  { v: "ograda", l: "Ograda", opis: "stubovi i polja" },
  { v: "zid", l: "Pun zid", opis: "bez stubova" },
  { v: "obloga", l: "Obloga", opis: "postojeći zid" },
];

function izUrla(sp: URLSearchParams): Ulaz {
  const n = (k: string, d: number) => { const v = parseFloat(sp.get(k) ?? ""); return isNaN(v) ? d : v; };
  const boja = sp.get("boja") as Boja | null;
  return {
    ...POCETNI_ULAZ,
    duzina: n("duzina", POCETNI_ULAZ.duzina),
    razmak: n("razmak", POCETNI_ULAZ.razmak),
    visinaPolja: n("vp", POCETNI_ULAZ.visinaPolja),
    visinaStuba: n("vs", POCETNI_ULAZ.visinaStuba),
    boja: boja && CENOVNIK.some((c) => c.v === boja) ? boja : POCETNI_ULAZ.boja,
    mesto: sp.get("mesto") ?? "",
  };
}

export function KalkulatorView({ uRedu }: { uRedu: number }) {
  const sp = useSearchParams();
  const [u, setU] = useState<Ulaz>(() => izUrla(sp));
  const [p, setP] = useState<Podesavanja>(PODRAZUMEVANO);
  const [pod, setPod] = useState(false);
  const [ari, setAri] = useState("");
  const [kopirano, setKopirano] = useState<"" | "ponuda" | "beleska">("");
  const [pon, setPon] = useState<PonudaMeta>(PONUDA_META);
  const [bezTransporta, setBezTransporta] = useState(false);

  // Broj ponude se NE predlaze: ponude prave i ljudi van dashboarda, pa bi predlog bio pogresan.
  // Pamti se samo ko je sastavio.
  useEffect(() => {
    let sastavio = "Luka Jovanović";
    try { sastavio = localStorage.getItem("deko.ponuda.sastavio") || sastavio; } catch { /* prazno */ }
    // Datum i potpis postoje samo u pregledacu, pa se upisuju posle montiranja (inace puca hidracija).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPon((s) => ({ ...s, sastavio, datum: datumPonude() }));
  }, []);

  const faliZaPonudu = [
    !pon.kupac.trim() && "ime i prezime kupca",
    !pon.broj.trim() && "broj ponude",
    !bezTransporta && pon.transportEur == null && "cena transporta",
  ].filter(Boolean) as string[];

  const napraviPonudu = () => {
    try { localStorage.setItem("deko.ponuda.sastavio", pon.sastavio); } catch { /* prazno */ }
    window.open(uAdresu(u, { ...pon, transportEur: bezTransporta ? null : pon.transportEur }), "_blank");
  };
  const r = izracunaj(u, p);

  const broj = (k: keyof Ulaz) => (n: number) => setU((s) => ({ ...s, [k]: n }));
  const pbroj = (k: keyof Podesavanja) => (n: number) => setP((s) => ({ ...s, [k]: n }));
  const kopiraj = async (sta: "ponuda" | "beleska") => {
    try {
      await navigator.clipboard.writeText(sta === "ponuda" ? ponudaTekst(u, r) : internaBeleska(u, r));
      setKopirano(sta); setTimeout(() => setKopirano(""), 1600);
    } catch { /* prazno */ }
  };

  const ograda = u.rezim === "ograda", zid = u.rezim === "zid", obloga = u.rezim === "obloga";
  const rp = redoviZaVisinu(u.visinaPolja), rs = redoviZaVisinu(u.visinaStuba);

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <Sidebar uRedu={uRedu} />

      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 sm:top-5 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 sm:px-4">
          <div className="nav-bar">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Logo size={40} />
              <div className="flex min-w-0 flex-col leading-none">
                <span className="nav-wordmark">Deko Pro</span>
                <span className="nav-sub mt-1">Kalkulator</span>
              </div>
            </Link>
            <Link href="/" className="btn btn-sm btn-light btn-plain">Leadovi</Link>
          </div>
        </div>
      </header>

      <section className="page-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-bg.jpg" alt="" aria-hidden />
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-[calc(var(--nav-h)+28px)] sm:pt-[calc(var(--nav-h)+40px)] lg:max-w-none lg:px-8 lg:pb-7 lg:pt-7">
          <div className="on-dark rise flex flex-col items-start gap-3">
            <span className="eyebrow"><span className="eyebrow-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" /></svg></span>Interni panel</span>
            <h1 className="h2 lg:text-[34px]">Kalkulator</h1>
            <p className="text-sm text-white/70">Tačna dužina, +5 % na svaku stavku, visine u celim redovima od 20 cm.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7 lg:max-w-none lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          {/* ---------------- Unos ---------------- */}
          <div className="card p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-1.5">
              {REZIMI.map((x) => (
                <button key={x.v} type="button" onClick={() => setU((s) => ({ ...s, rezim: x.v }))}
                  className={`rounded-[10px] border px-2 py-2 text-center transition-colors ${u.rezim === x.v ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-accent"}`}>
                  <span className="block text-[13px] font-semibold">{x.l}</span>
                  <span className={`block text-[10px] ${u.rezim === x.v ? "text-white/70" : "text-muted"}`}>{x.opis}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {!obloga && (
                <Polje label={ograda ? "Dužina ograde (m)" : "Dužina zida (m)"} hint="sa stubovima">
                  <BrojInput decimalno={true} value={u.duzina} onChange={broj("duzina")} className="inp"  />
                </Polje>
              )}
              {ograda && <Polje label="Razmak stubova (m)" hint="svetli otvor"><BrojInput decimalno={true} value={u.razmak} onChange={broj("razmak")} className="inp"  /></Polje>}
              {!obloga && (
                <Polje label={ograda ? "Visina polja (m)" : "Visina zida (m)"} hint={`${rp.redova} redova`} puno={zid}>
                  <BrojInput decimalno={true} value={u.visinaPolja} onChange={broj("visinaPolja")} className="inp"  />
                </Polje>
              )}
              {ograda && <Polje label="Visina stuba (m)" hint={`${rs.redova} redova`}><BrojInput decimalno={true} value={u.visinaStuba} onChange={broj("visinaStuba")} className="inp"  /></Polje>}
              {ograda && <Polje label="Kapije, ukupna širina (m)" hint="oduzima se od zida"><BrojInput decimalno={true} value={u.sirinaKapija} onChange={broj("sirinaKapija")} className="inp"  /></Polje>}
              {obloga && <Polje label="Površina (m²)" hint="dužina × visina, po strani"><BrojInput decimalno={true} value={u.povrsina} onChange={broj("povrsina")} className="inp"  /></Polje>}

              <Polje label="Boja bloka" puno={obloga}>
                <select value={u.boja} onChange={(e) => setU((s) => ({ ...s, boja: e.target.value as Boja }))} className="inp">
                  {CENOVNIK.map((c) => <option key={c.v} value={c.v}>{c.l} ({c.zidni}/{c.stubni})</option>)}
                </select>
              </Polje>
              {!obloga && (
                <Polje label="Boja kapa i okapnica">
                  <select value={u.bojaZavrsnih} onChange={(e) => setU((s) => ({ ...s, bojaZavrsnih: e.target.value as BojaZavrsnih }))} className="inp">
                    {ZAVRSNE_BOJE.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                </Polje>
              )}
              <Polje label="Mesto" hint="ide u naslov ponude" puno><input value={u.mesto} onChange={(e) => setU((s) => ({ ...s, mesto: e.target.value }))} className="inp" placeholder="npr. Kragujevac" /></Polje>
            </div>

            {/* opcije visine kad nije ceo broj redova */}
            {!obloga && !rp.jeCeo && (
              <Opcije naslov={ograda ? "Visina polja nije ceo broj redova" : "Visina zida nije ceo broj redova"}
                opcije={rp.opcije} izaberi={(v) => setU((s) => ({ ...s, visinaPolja: v }))} />
            )}
            {ograda && !rs.jeCeo && (
              <Opcije naslov="Visina stuba nije ceo broj redova" opcije={rs.opcije} izaberi={(v) => setU((s) => ({ ...s, visinaStuba: v }))} />
            )}

            {ograda && (
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.zatvoren} onChange={(e) => setU((s) => ({ ...s, zatvoren: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Zatvoren obim placa (stubova koliko i polja)
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.spojena} onChange={(e) => setU((s) => ({ ...s, spojena: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Nastavlja se na drugu ogradu (stub na spoju zajednički)
                </label>
              </div>
            )}
            {zid && (
              <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
                <input type="checkbox" checked={u.saOkapnicama} onChange={(e) => setU((s) => ({ ...s, saOkapnicama: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                Sa okapnicama (preporučeno)
              </label>
            )}

            {/* plac u arima */}
            {ograda && (
              <div className="mt-4 rounded-[10px] bg-wash p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Plac u arima → obim</div>
                <div className="mt-2 flex items-center gap-2">
                  <input inputMode="decimal" value={ari} onChange={(e) => setAri(e.target.value)} placeholder="npr. 5" className="inp inp-sm w-24" />
                  <span className="text-sm text-muted">ari ≈</span>
                  <b className="text-sm text-ink">{ari ? `${obimPlaca(parseFloat(ari.replace(",", ".")) || 0)} m` : "—"}</b>
                  {ari && (
                    <button type="button" onClick={() => setU((s) => ({ ...s, duzina: obimPlaca(parseFloat(ari.replace(",", ".")) || 0), zatvoren: true }))}
                      className="btn btn-sm btn-plain ml-auto">Upiši</button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Kvadratni plac. Duguljast ima veći obim, uvek tražiti stvarne mere.</p>
              </div>
            )}

            <button type="button" onClick={() => setPod((o) => !o)} className="mt-4 flex w-full items-center justify-between rounded-[10px] border border-dashed border-line px-3 py-2.5 text-left text-sm font-semibold text-ink">
              Pretpostavke <span className="font-normal text-muted">(modul, cene, rezerva)</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${pod ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {pod && (
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-[10px] bg-wash p-3">
                <Polje label="Rezerva (%)" hint="pravilo: 5"><BrojInput decimalno={true} value={p.rezervaPct} onChange={pbroj("rezervaPct")} className="inp inp-sm"  /></Polje>
                <Polje label="Modul dužine (m)" hint="blok + fuga"><BrojInput decimalno={true} value={p.modulDuzina} onChange={pbroj("modulDuzina")} className="inp inp-sm"  /></Polje>
                <Polje label="Modul visine (m)" hint="red + fuga"><BrojInput decimalno={true} value={p.modulVisina} onChange={pbroj("modulVisina")} className="inp inp-sm"  /></Polje>
                <Polje label="Širina stuba (m)"><BrojInput decimalno={true} value={p.modulStub} onChange={pbroj("modulStub")} className="inp inp-sm"  /></Polje>
                <Polje label="Okapnica (RSD)"><BrojInput decimalno={false} value={p.cenaOkapnica} onChange={pbroj("cenaOkapnica")} className="inp inp-sm"  /></Polje>
                <Polje label="Kapa (RSD)"><BrojInput decimalno={false} value={p.cenaKapa} onChange={pbroj("cenaKapa")} className="inp inp-sm"  /></Polje>
                <Polje label="Obloga (RSD/m²)" hint="1.174 sa PDV-om" puno>
                  <BrojInput decimalno value={p.cenaObloga} praznoJeNull placeholder="prazno = ne računaj"
                    onChange={(n) => setP((s) => ({ ...s, cenaObloga: n }))} className="inp inp-sm" />
                </Polje>
                <label className="col-span-2 flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={p.partnerske} onChange={(e) => setP((s) => ({ ...s, partnerske: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Partnerske cene (interno: zidni −25, stubni −10 RSD)
                </label>
              </div>
            )}
          </div>

          {/* ---------------- Rezultat ---------------- */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ograda && <>
                <Plocica label="Polja" value={String(r.polja)} sub={`razmak ${r.stvarniRazmak} m`} />
                <Plocica label="Stubova" value={String(r.stubovi)} sub={`${r.redovaStuba} redova`} />
                <Plocica label="Zidani deo" value={`${r.duzinaZida} m`} sub={`${r.redovaPolja} redova · ${r.m2} m²`} />
              </>}
              {zid && <>
                <Plocica label="Dužina" value={`${r.duzinaZida} m`} sub={`${r.redovaPolja} redova`} />
                <Plocica label="Površina" value={`${r.m2} m²`} sub="12,5 kom/m²" />
                <Plocica label="Redova" value={String(r.redovaPolja)} sub="po 20 cm" />
              </>}
              {obloga && <>
                <Plocica label="Površina" value={`${r.m2} m²`} sub="po strani" />
                <Plocica label="Obloga" value={String(r.stavke[0]?.kom ?? 0)} sub={`12,5 kom/m² + 5 % = ${r.stavke[0]?.dodatak ?? "—"}`} />
                <Plocica label="Težina" value={`≈ ${new Intl.NumberFormat("sr-RS").format(r.tezinaKg)} kg`} sub="~8 kg/kom" />
              </>}
              <Plocica label="Ukupno" value={r.cenaNepotpuna ? "—" : rsd(r.ukupno)} sub={r.cenaNepotpuna ? "cena nije potvrđena" : "materijal sa PDV-om"} zlato />
            </div>

            {r.napomene.length > 0 && (
              <div className="card border-l-4 border-l-gold p-3 text-sm">
                {r.napomene.map((n) => <p key={n} className="text-ink">{n}</p>)}
              </div>
            )}

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted [&>th]:whitespace-nowrap">
                    <th className="px-4 py-2.5 font-semibold">Naziv proizvoda</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Kom</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Cena</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  {r.stavke.map((s) => (
                    <tr key={s.naziv} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink">{s.naziv} <span className="text-muted">{s.opis}</span></td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums">{s.kom}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-muted">{s.cena ?? "—"}{s.cena != null && s.jedinicaCene ? <span className="text-[11px]"> /{s.jedinicaCene}</span> : null}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{s.ukupno != null ? rsd(s.ukupno) : "[proveriti]"}</td>
                    </tr>
                  ))}
                  <tr className="bg-wash/70">
                    <td className="px-4 py-2.5 font-semibold text-ink" colSpan={3}>Svega</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-display text-[17px] font-bold tabular-nums text-navy">{rsd(r.ukupno)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
                <span>
                  Rezerva <b className="text-ink">+{p.rezervaPct} %</b> na svaku stavku
                  {!obloga && <> · težina ≈ <b className="text-ink">{new Intl.NumberFormat("sr-RS").format(r.tezinaKg)} kg</b> · zidni blok <b className="text-ink">{r.palete}</b> paleta</>}
                </span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => kopiraj("beleska")} className="btn btn-sm btn-ghost btn-plain">{kopirano === "beleska" ? "Kopirano ✓" : "Beleška za nas"}</button>
                  <button type="button" onClick={() => kopiraj("ponuda")} className="btn btn-sm btn-plain">{kopirano === "ponuda" ? "Kopirano ✓" : "Kopiraj ponudu"}</button>
                </span>
              </div>
            </div>

            {/* zvanična ponuda po templateu 184/26 */}
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Zvanična ponuda (PDF)</div>
                <span className="text-[11px] text-muted">PromoBet, izgled kao ponuda 184/26</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Polje label="Ime i prezime kupca" puno>
                  <input value={pon.kupac} onChange={(e) => setPon((s) => ({ ...s, kupac: e.target.value }))} className="inp" placeholder="npr. Miloš Obilić" />
                </Polje>
                <Polje label="Broj ponude" hint="obavezno, upiši ručno">
                  <input value={pon.broj} onChange={(e) => setPon((s) => ({ ...s, broj: e.target.value }))} className="inp" placeholder="npr. 185/26" />
                </Polje>
                <Polje label="Datum">
                  <input value={pon.datum} onChange={(e) => setPon((s) => ({ ...s, datum: e.target.value }))} className="inp" />
                </Polje>
                <Polje label="Transport sa istovarom (€)" hint="dogovor sa dostavljačem">
                  <BrojInput decimalno praznoJeNull value={pon.transportEur} onChange={(n) => setPon((s) => ({ ...s, transportEur: n }))}
                    className={`inp ${bezTransporta ? "opacity-40" : ""}`} placeholder="npr. 260" />
                </Polje>
                <Polje label="Ponudu sastavio">
                  <input value={pon.sastavio} onChange={(e) => setPon((s) => ({ ...s, sastavio: e.target.value }))} className="inp" />
                </Polje>
              </div>
              <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
                <input type="checkbox" checked={bezTransporta} onChange={(e) => setBezTransporta(e.target.checked)} className="h-4 w-4 accent-[#0B1E3B]" />
                Bez transporta, kupac preuzima u Mladenovcu
              </label>
              <button type="button" onClick={napraviPonudu} disabled={faliZaPonudu.length > 0}
                className="btn mt-3 w-full disabled:cursor-not-allowed disabled:opacity-45">
                Napravi ponudu
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {faliZaPonudu.length > 0
                  ? <>Fali: <b className="text-ink">{faliZaPonudu.join(", ")}</b>.</>
                  : <>{"Otvara se list ponude, pa „Štampaj / Sačuvaj kao PDF“. Kapije, ispune, temelj i ugradnja se ne unose ovde."}</>}
              </p>
            </div>

            {/* pregled ponude, tačno kako se šalje */}
            <div className="card p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ponuda za DM, WhatsApp ili Viber</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-[13px] leading-snug text-ink">{ponudaTekst(u, r)}</pre>
            </div>

            <div className="card p-4 text-xs leading-relaxed text-muted">
              <b className="text-ink">Nije uključeno:</b> temelj, prevoz, ugradnja, alu paneli i ispune, kapije. To dodaje Luka.<br />
              <b className="text-ink">Kako računa:</b> polja = zaokruži((dužina − 0,4) / (razmak + 0,4)), stubova = polja + 1 (zatvoren obim: stubova = polja);
              zidani deo = dužina − stubovi × 0,4 − širina kapija; zidni blok 12,5 kom/m² (lice 20 × 40 cm), stubni 1 po redu stuba,
              okapnica 2 kom po metru, kapa 1 po stubu. Na sve ide +5 %, pa se zaokružuje na najbliži ceo broj.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Brojno polje koje pamti TEKST koji kucaš.
   Ranije je value bio broj, pa je parseFloat("2,") dao 2 i render je odmah brisao zapetu:
   nije se moglo upisati 2,8 ni 0,5. Sada se zapeta i točka drže do kraja unosa. */
function BrojInput<T extends number | null>({
  value, onChange, decimalno = true, praznoJeNull, className = "inp", placeholder, id,
}: {
  value: T;
  onChange: (n: T) => void;
  decimalno?: boolean;
  praznoJeNull?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}) {
  const kaoTekst = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  const [txt, setTxt] = useState(() => kaoTekst(value));
  const zadnji = useRef<number | null>(value);

  // Kad vrednost promeni nešto drugo (npr. dugme „Upiši" ili opcija visine), osveži tekst.
  useEffect(() => {
    if (value !== zadnji.current) { zadnji.current = value; setTxt(kaoTekst(value)); }
  }, [value]);

  const dozvoljeno = decimalno ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/;

  const menjaj = (v: string) => {
    if (!dozvoljeno.test(v)) return;           // slova i višak separatora se ignorišu
    setTxt(v);
    const n = parseFloat(v.replace(",", "."));
    const nova = (isNaN(n) ? (praznoJeNull ? null : 0) : n) as T;
    zadnji.current = nova;
    onChange(nova);
  };

  // Na izlazu iz polja počisti „2," i „,5" u „2" i „0,5".
  const pocisti = () => {
    const c = kaoTekst(zadnji.current);
    if (c !== txt) setTxt(c);
  };

  return (
    <input id={id} type="text" inputMode={decimalno ? "decimal" : "numeric"} value={txt}
      onChange={(e) => menjaj(e.target.value)} onBlur={pocisti}
      placeholder={placeholder} className={className} />
  );
}

function Opcije({ naslov, opcije, izaberi }: { naslov: string; opcije: { redova: number; visina: number }[]; izaberi: (v: number) => void }) {
  return (
    <div className="mt-3 rounded-[10px] border border-warn/30 bg-warn/5 p-3">
      <div className="text-sm font-semibold text-warn">{naslov}</div>
      <p className="mt-0.5 text-xs text-ink">Nema pola reda. Ponudi klijentu jednu od dve najbliže visine:</p>
      <div className="mt-2 flex gap-2">
        {opcije.map((o) => (
          <button key={o.redova} type="button" onClick={() => izaberi(o.visina)} className="btn btn-sm btn-ghost btn-plain">
            {o.redova} redova = {o.visina} m
          </button>
        ))}
      </div>
    </div>
  );
}

function Polje({ label, hint, children, puno }: { label: string; hint?: string; children: React.ReactNode; puno?: boolean }) {
  return (
    <label className={`field ${puno ? "col-span-2" : ""}`}>
      <span>{label}{hint && <span className="ml-1 font-normal text-muted">({hint})</span>}</span>
      {children}
    </label>
  );
}

function Plocica({ label, value, sub, zlato }: { label: string; value: string; sub?: string; zlato?: boolean }) {
  return (
    <div className={`card p-3.5 ${zlato ? "border-l-4 border-l-gold" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 font-display font-bold leading-none tabular-nums ${value.length > 9 ? "text-[20px]" : "text-[26px]"} ${zlato ? "text-gold-deep" : "text-navy"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
