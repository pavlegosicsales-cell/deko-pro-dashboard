"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LeadRow } from "@/components/LeadView";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import { Sat } from "@/components/Sat";
import { OTVORENI, IZVORI, label } from "@/lib/opcije";
import { poDanu, danasKljuc, pomeriDan, brojNaDan, pozvanoNaDan, danKratko, danIme, type DanStat } from "@/lib/analitika";

// Boje serija: validirane (dataviz validator, light surface): plava = novi, bronza = pozvani
const BOJA_NOVI = "#2F5DA8";
const BOJA_POZVANI = "#A8823A";

export function AnalitikaView({ leadovi }: { leadovi: LeadRow[] }) {
  const [dana, setDana] = useState<7 | 14 | 30>(14);
  const danas = danasKljuc();
  const juce = pomeriDan(danas, -1);

  const serija = poDanu(leadovi, dana);
  const uRedu = leadovi.filter((l) => OTVORENI.has(l.status)).length;

  const ukNovi = serija.reduce((s, d) => s + d.novi, 0);
  const ukPozvani = serija.reduce((s, d) => s + d.pozvani, 0);
  const zatvoreno = leadovi.filter((l) => l.status === "zatvoren").length;
  const propalo = leadovi.filter((l) => l.status === "propao").length;
  const stopa = zatvoreno + propalo > 0 ? Math.round((zatvoreno / (zatvoreno + propalo)) * 100) : null;

  // po izvoru (svi leadovi)
  const poIzvoru = IZVORI.map((i) => ({ ...i, n: leadovi.filter((l) => l.izvor === i.v).length })).filter((i) => i.n > 0).sort((a, b) => b.n - a.n);
  const maxIzvor = Math.max(1, ...poIzvoru.map((i) => i.n));

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
                <span className="nav-sub mt-1">Analitika</span>
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
            <span className="eyebrow"><span className="eyebrow-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 15l3-4 3 3 4-6" /></svg></span>Interni panel</span>
            <h1 className="h2 lg:text-[34px]">Analitika</h1>
            <Sat className="text-sm text-white/70" />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7 lg:max-w-none lg:px-8 lg:py-6">
        {/* Hero brojevi */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Plocica label="Stiglo danas" value={brojNaDan(leadovi, danas)} sub={`juče ${brojNaDan(leadovi, juce)}`} />
          <Plocica label="Pozvano danas" value={pozvanoNaDan(leadovi, danas)} sub={`juče ${pozvanoNaDan(leadovi, juce)}`} />
          <Plocica label={`Novih za ${dana} dana`} value={ukNovi} sub={`pozvano ${ukPozvani}`} />
          <Plocica label="Stopa zatvaranja" value={stopa == null ? "—" : `${stopa}%`} sub={`${zatvoreno} kupilo · ${propalo} odustalo`} />
        </div>

        {/* Grafikon po danu */}
        <div className="card mt-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="h3 text-[16px]">Novi i pozvani po danu</h2>
              <p className="text-xs text-muted">Koliko leadova stigne u red i koliko ih Luka pomeri iz „Novi“ (= pozove).</p>
            </div>
            <div className="flex gap-1.5">
              {([7, 14, 30] as const).map((n) => (
                <button key={n} onClick={() => setDana(n)} className={`tag tag-filter ${dana === n ? "tag-accent" : ""}`}>{n} dana</button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[2px]" style={{ background: BOJA_NOVI }} />Novi</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[2px]" style={{ background: BOJA_POZVANI }} />Pozvani</span>
          </div>
          <Grafikon serija={serija} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Tabela po danu */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5 font-semibold">Dan</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Novi</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Pozvani</th>
                </tr>
              </thead>
              <tbody>
                {[...serija].reverse().map((d) => (
                  <tr key={d.dan} className={`border-b border-line last:border-0 ${d.dan === danas ? "bg-gold/8" : ""}`}>
                    <td className="px-4 py-2 text-ink">{danIme(d.dan)} {danKratko(d.dan)}{d.dan === danas && <span className="ml-2 text-[11px] text-gold-deep">danas</span>}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.novi}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.pozvani}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Po izvoru */}
          <div className="card p-4 sm:p-5">
            <h2 className="h3 text-[16px]">Odakle stižu leadovi</h2>
            <p className="text-xs text-muted">Svi leadovi, po izvoru.</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {poIzvoru.length === 0 && <p className="text-sm text-muted">Još nema podataka.</p>}
              {poIzvoru.map((i) => (
                <div key={i.v}>
                  <div className="mb-1 flex justify-between text-sm"><span className="text-ink">{label(IZVORI, i.v)}</span><span className="tabular-nums text-muted">{i.n}</span></div>
                  <div className="h-2 rounded-full bg-wash"><div className="h-2 rounded-full" style={{ width: `${(i.n / maxIzvor) * 100}%`, background: BOJA_NOVI }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Plocica({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-display text-[30px] font-bold leading-none text-navy tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

/* Grupisani stubići po danu, čist SVG, merena širina, hover tooltip. */
function Grafikon({ serija }: { serija: DanStat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  const [hov, setHov] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    setW(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const H = 220, padL = 28, padR = 8, padT = 12, padB = 30;
  const max = Math.max(1, ...serija.map((d) => Math.max(d.novi, d.pozvani)));
  const yMax = Math.max(4, Math.ceil(max / 2) * 2);
  const n = serija.length;
  const slot = (w - padL - padR) / n;
  const gap = 2;
  const barW = Math.max(3, Math.min(18, (slot - 6) / 2 - gap / 2));
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / yMax);
  const svaki = n > 16 ? 5 : n > 8 ? 2 : 1;
  const ticks = [0, yMax / 2, yMax];

  return (
    <div ref={ref} className="relative mt-3 w-full select-none">
      <svg width={w} height={H} className="block overflow-visible" onMouseLeave={() => setHov(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="#E1E5EC" strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#5B6472">{t}</text>
          </g>
        ))}
        {serija.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          const x1 = cx - barW - gap / 2, x2 = cx + gap / 2;
          const h1 = y(0) - y(d.novi), h2 = y(0) - y(d.pozvani);
          return (
            <g key={d.dan} onMouseEnter={() => setHov(i)} onTouchStart={() => setHov(i)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill={hov === i ? "rgba(11,30,59,.05)" : "transparent"} />
              {d.novi > 0 && <rect x={x1} y={y(d.novi)} width={barW} height={h1} fill={BOJA_NOVI} rx="3" />}
              {d.pozvani > 0 && <rect x={x2} y={y(d.pozvani)} width={barW} height={h2} fill={BOJA_POZVANI} rx="3" />}
              {i % svaki === 0 && <text x={cx} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="#5B6472">{danKratko(d.dan)}</text>}
            </g>
          );
        })}
        <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="#C7D2E4" strokeWidth="1" />
      </svg>
      {hov != null && serija[hov] && (
        <div className="pointer-events-none absolute -top-1 rounded-[10px] border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(w - 150, Math.max(0, padL + slot * hov + slot / 2 - 70)) }}>
          <div className="font-semibold text-ink">{danIme(serija[hov].dan)} {danKratko(serija[hov].dan)}</div>
          <div className="mt-0.5 flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px]" style={{ background: BOJA_NOVI }} />Novi: <b className="tabular-nums">{serija[hov].novi}</b></div>
          <div className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-[2px]" style={{ background: BOJA_POZVANI }} />Pozvani: <b className="tabular-nums">{serija[hov].pozvani}</b></div>
        </div>
      )}
    </div>
  );
}
