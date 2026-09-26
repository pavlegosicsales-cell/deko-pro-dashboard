"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import { izracunaj, specifikacijaTekst, CENOVNIK, PODRAZUMEVANO, type Ulaz, type Podesavanja, type Boja } from "@/lib/kalkulator";
import { rsd } from "@/lib/format";

/*
  Kalkulator materijala (Lukin zahtev 26.09.2026.). Unos: dužina, razmak (kraj do kraja
  stubnog bloka), visina polja, visina stuba, boja. Izlaz: raspored, specifikacija sa
  cenama iz cenovnika, težina/palete, tekst za ponudu. Sve pretpostavke su podesive.
*/

const POC: Ulaz = { duzina: 10, razmak: 2, visinaPolja: 0.8, visinaStuba: 1.6, otvori: 0, zatvoren: false, boja: "natur_siva" };

export function KalkulatorView({ uRedu }: { uRedu: number }) {
  const [u, setU] = useState<Ulaz>(POC);
  const [p, setP] = useState<Podesavanja>(PODRAZUMEVANO);
  const [pod, setPod] = useState(false);
  const [kopirano, setKopirano] = useState(false);
  const r = izracunaj(u, p);

  const broj = (k: keyof Ulaz) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value.replace(",", "."));
    setU((s) => ({ ...s, [k]: isNaN(n) ? 0 : n }));
  };
  const pbroj = (k: keyof Podesavanja) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value.replace(",", "."));
    setP((s) => ({ ...s, [k]: isNaN(n) ? 0 : n }));
  };
  const kopiraj = async () => {
    try { await navigator.clipboard.writeText(specifikacijaTekst(u, r)); setKopirano(true); setTimeout(() => setKopirano(false), 1500); } catch { /* prazno */ }
  };

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <Sidebar uRedu={uRedu} />

      {/* Mobilni header */}
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
            <p className="text-sm text-white/70">Materijal i cena za ogradu od dekorativnog bloka. Razmak se meri od kraja do kraja stubnog bloka.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7 lg:max-w-none lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          {/* Unos */}
          <div className="card p-4 sm:p-5">
            <h2 className="h3 text-[16px]">Ograda</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Polje label="Dužina zidanog dela (m)" hint="bez širine kapija"><input inputMode="decimal" defaultValue={u.duzina} onChange={broj("duzina")} className="inp" /></Polje>
              <Polje label="Razmak stubova (m)" hint="kraj do kraja stuba"><input inputMode="decimal" defaultValue={u.razmak} onChange={broj("razmak")} className="inp" /></Polje>
              <Polje label="Visina polja (m)"><input inputMode="decimal" defaultValue={u.visinaPolja} onChange={broj("visinaPolja")} className="inp" /></Polje>
              <Polje label="Visina stuba (m)" hint="bez kape"><input inputMode="decimal" defaultValue={u.visinaStuba} onChange={broj("visinaStuba")} className="inp" /></Polje>
              <Polje label="Kapije / otvori (kom)" hint="svaki dodaje 1 stub"><input inputMode="numeric" defaultValue={u.otvori} onChange={broj("otvori")} className="inp" /></Polje>
              <Polje label="Boja">
                <select value={u.boja} onChange={(e) => setU((s) => ({ ...s, boja: e.target.value as Boja }))} className="inp">
                  {CENOVNIK.map((c) => <option key={c.v} value={c.v}>{c.l} ({c.zidni}/{c.stubni})</option>)}
                </select>
              </Polje>
            </div>
            <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
              <input type="checkbox" checked={u.zatvoren} onChange={(e) => setU((s) => ({ ...s, zatvoren: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
              Zatvoren obim (oko placa: stubova koliko i polja)
            </label>

            <button type="button" onClick={() => setPod((o) => !o)} className="mt-4 flex w-full items-center justify-between rounded-[10px] border border-dashed border-line px-3 py-2.5 text-left text-sm font-semibold text-ink">
              Pretpostavke <span className="font-normal text-muted">(modul, cene, rezerva)</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${pod ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {pod && (
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-[10px] bg-wash p-3">
                <Polje label="Modul dužine (m)" hint="blok 0,39 + fuga"><input inputMode="decimal" defaultValue={p.modulDuzina} onChange={pbroj("modulDuzina")} className="inp inp-sm" /></Polje>
                <Polje label="Modul visine (m)" hint="red 0,19 + fuga"><input inputMode="decimal" defaultValue={p.modulVisina} onChange={pbroj("modulVisina")} className="inp inp-sm" /></Polje>
                <Polje label="Širina stuba (m)" hint="stubni blok + fuga"><input inputMode="decimal" defaultValue={p.modulStub} onChange={pbroj("modulStub")} className="inp inp-sm" /></Polje>
                <Polje label="Rezerva za lom (%)"><input inputMode="decimal" defaultValue={p.rezervaPct} onChange={pbroj("rezervaPct")} className="inp inp-sm" /></Polje>
                <Polje label="Okapnica (RSD)"><input inputMode="numeric" defaultValue={p.cenaOkapnica} onChange={pbroj("cenaOkapnica")} className="inp inp-sm" /></Polje>
                <Polje label="Kapa (RSD)"><input inputMode="numeric" defaultValue={p.cenaKapa} onChange={pbroj("cenaKapa")} className="inp inp-sm" /></Polje>
                <Polje label="Težina zidnog (kg)"><input inputMode="decimal" defaultValue={p.tezinaZidni} onChange={pbroj("tezinaZidni")} className="inp inp-sm" /></Polje>
                <Polje label="Težina stubnog (kg)" hint="procena, potvrditi"><input inputMode="decimal" defaultValue={p.tezinaStubni} onChange={pbroj("tezinaStubni")} className="inp inp-sm" /></Polje>
                <label className="col-span-2 flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={p.partnerske} onChange={(e) => setP((s) => ({ ...s, partnerske: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Partnerske cene (interno: zidni −25, stubni −10 RSD)
                </label>
              </div>
            )}
          </div>

          {/* Rezultat */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Plocica label="Polja" value={String(r.polja)} sub={`razmak ${r.stvarniRazmak} m`} />
              <Plocica label="Stubova" value={String(r.stubovi)} sub={`${r.redovaStuba} redova · ${r.stvarnaVisinaStuba} m`} />
              <Plocica label="Zid" value={`${r.duzinaZida} m`} sub={`${r.redovaPolja} redova · ${r.m2Zida} m²`} />
              <Plocica label="Ukupno" value={rsd(r.ukupno)} sub="materijal, bez prevoza" zlato />
            </div>

            {r.napomene.length > 0 && (
              <div className="card border-l-4 border-l-gold p-3 text-sm">
                {r.napomene.map((n) => <p key={n} className="text-ink">{n}</p>)}
              </div>
            )}

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-4 py-2.5 font-semibold">Naziv proizvoda</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Kom</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Cena</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  {r.stavke.map((s) => (
                    <tr key={s.naziv} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink">{s.naziv}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-semibold">{s.kom}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-muted">{s.cena}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{rsd(s.ukupno)}</td>
                    </tr>
                  ))}
                  <tr className="bg-wash/70">
                    <td className="px-4 py-2.5 font-semibold text-ink" colSpan={3}>Svega</td>
                    <td className="px-4 py-2.5 text-right font-display text-[17px] font-bold tabular-nums text-navy">{rsd(r.ukupno)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
                <span>Težina ≈ <b className="text-ink">{new Intl.NumberFormat("sr-RS").format(r.tezinaKg)} kg</b> · zidni blok <b className="text-ink">{r.paleteZidni}</b> paleta (72/paleta){p.rezervaPct ? ` · uključena rezerva ${p.rezervaPct} %` : ""}</span>
                <button type="button" onClick={kopiraj} className="btn btn-sm btn-plain">{kopirano ? "Kopirano ✓" : "Kopiraj specifikaciju"}</button>
              </div>
            </div>

            <div className="card p-4 text-xs leading-relaxed text-muted">
              <b className="text-ink">Kako računa:</b> zidni blok 19×19×39 = modul 20×40 cm sa fugom (12,5 kom/m²); stubni blok 39×39 = jedan po redu stuba, širina 40 cm sa fugom;
              stubova = polja + 1 (+ 1 po kapiji; zatvoren obim: stubova = polja); okapnica 50 cm = 2 kom/m zida; kapa 1 po stubu.
              Visine se zaokružuju na ceo red (20 cm). Cene iz cenovnika (RSD/kom); prevoz nije uključen.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Polje({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
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
