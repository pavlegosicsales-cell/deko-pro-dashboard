"use client";

import { Shell } from "@/components/Shell";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DosijeKartica, type LeadZaDosije } from "@/components/DosijeKartica";
import { obrisiPonudu } from "@/app/ponude/actions";
import { obrisiDosije } from "@/app/dosijei/actions";
import { rsd } from "@/lib/format";
import { cekaPrevoz, type Dosije } from "@/lib/dosije";
import type { SacuvanaPonuda } from "@/lib/ponuda";
import { napraviPonudaPdf, imeFajla } from "@/lib/ponudaPdf";
import { porukaMaterijal, metaPonude, telIzAdrese } from "@/lib/slanje";
import { PosaljiKlijentu } from "@/components/PosaljiKlijentu";
import { PajaTab } from "@/components/PajaTab";
import { cekaPaju } from "@/lib/dosije";
import type { LeadRow } from "@/components/LeadView";

/*
  Tab „Ponude" (Pavle, 01.10.2026.: „treba mi sve na jednom mestu"):
  - Kupci: dosije po kupcu, sa oznakama šta fali (ponuda za materijal, prevoz, ugradnja).
  - Sve ponude: svaka ponuda za materijal kako je poslata (/ponuda?id=…), odatle PDF.
  Ponude ulaze ovde same, čim se na strani ponude skine PDF.
*/
const REZIM: Record<string, string> = { ograda: "Ograda", zid: "Pun zid", obloga: "Obloga", rucno: "Ručno" };
type Filter = "svi" | "fali" | "ceka";

export function PonudeView({ uRedu, ponude, dosijei = [], leadovi = {}, leadoviPuni = [], demo, tabelaFali, tabelaDosijeaFali, greska, pocetniTab }: {
  uRedu: number; ponude: SacuvanaPonuda[]; dosijei?: Dosije[]; leadovi?: Record<string, LeadZaDosije>; leadoviPuni?: LeadRow[];
  demo?: boolean; tabelaFali?: boolean; tabelaDosijeaFali?: boolean; greska?: string | null; pocetniTab?: "kupci" | "sve" | "paja";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"kupci" | "sve" | "paja">(pocetniTab ?? "kupci");
  const nCekaPaju = dosijei.filter(cekaPaju).length;
  const [filter, setFilter] = useState<Filter>("svi");
  const [q, setQ] = useState("");
  const [obrisane, setObrisane] = useState<Set<string>>(new Set());
  const [poruka, setPoruka] = useState<string | null>(null);
  const [, start] = useTransition();
  // kad se Pavle vrati na ovaj tab (posle PDF-a u drugom), lista se osveži
  useEffect(() => { const f = () => router.refresh(); window.addEventListener("focus", f); return () => window.removeEventListener("focus", f); }, [router]);

  const qq = q.trim().toLowerCase();
  const lista = ponude
    .filter((p) => !obrisane.has(p.id))
    .filter((p) => !qq || [p.kupac, p.broj, p.mesto ?? "", p.sastavio ?? ""].some((x) => x.toLowerCase().includes(qq)));
  const zbir = lista.reduce((a, p) => a + Number(p.ukupno_rsd), 0);

  const ponudeDosijea = (d: Dosije) => ponude.filter((x) => !obrisane.has(x.id) && (x.dosije_id === d.id || (!!d.lead_id && x.lead_id === d.lead_id)));
  const trebaUgradnja = (d: Dosije) => { const l = d.lead_id ? leadovi[d.lead_id] : null; return !l || (l.obuhvat !== "materijal" && l.obuhvat !== "materijal_prevoz"); };
  const fali = (d: Dosije) => { const r = d.ugradnja?.rucno ?? {}; const ug = !!d.ugradnja?.cena || !!d.ugradnja?.tekst || !!r.ugradnja; return (!ug && !r.materijal && ponudeDosijea(d).length === 0) || (!ug && !r.prevoz && d.transport_eur == null && !d.prevoz_poslato_kad && !ponudeDosijea(d).some((x) => x.transport_eur != null)) || (trebaUgradnja(d) && !ug && !d.paja_poslato_kad); };
  const kupci = dosijei
    .filter((d) => !obrisane.has(d.id))
    .filter((d) => !qq || [d.kupac, d.mesto ?? "", d.telefon ?? "", d.opis ?? ""].some((x) => x.toLowerCase().includes(qq)))
    .filter((d) => filter === "svi" || (filter === "ceka" ? cekaPrevoz(d) : fali(d)));
  const nFali = dosijei.filter(fali).length, nCeka = dosijei.filter(cekaPrevoz).length;

  const obrisi = (p: SacuvanaPonuda) => {
    if (!confirm(`Obrisati ponudu ${p.broj} za ${p.kupac}?`)) return;
    setObrisane((s) => new Set(s).add(p.id));
    start(async () => {
      const r = await obrisiPonudu(p.id);
      if (!r.ok) { setPoruka(r.msg ?? "Nije obrisano."); setObrisane((s) => { const n = new Set(s); n.delete(p.id); return n; }); }
    });
  };
  const obrisiD = (d: Dosije) => {
    if (!confirm(`Obrisati dosije za ${d.kupac}? Ponude u „Sve ponude" ostaju.`)) return;
    setObrisane((s) => new Set(s).add(d.id));
    start(async () => {
      const r = await obrisiDosije(d.id);
      if (!r.ok) { setPoruka(r.msg ?? "Nije obrisano."); setObrisane((s) => { const n = new Set(s); n.delete(d.id); return n; }); }
    });
  };

  return (
    <Shell naslov="Ponude i kupci" podnaslov="Svaki kupac ima dosije: šta je urađeno, šta fali, šta se čeka. Ponude ulaze same čim se skine PDF." uRedu={uRedu}
      akcije={<>
        <Link href="/kalkulator" className="btn btn-sm btn-ghost">Kalkulator</Link>
        <Link href="/ugradnja?bezslike=1" className="btn btn-sm btn-ghost">Ponuda za ugradnju bez slike</Link>
        <Link href="/ugradnja" className="btn btn-sm btn-gold">Ponuda za ugradnju</Link>
      </>}>
        {demo && <div className="card mb-4 border-l-4 border-l-gold p-3 text-sm text-ink">Demo režim: baza nije povezana, pa nema sačuvanih ponuda.</div>}
        {tabelaFali && <div className="card mb-4 border-l-4 border-l-gold p-3 text-sm text-ink">Tabela za ponude još ne postoji. Pokreni <b>supabase/migracija-6.sql</b> u Supabase SQL editoru, pa osveži stranu.</div>}
        {tabelaDosijeaFali && <div className="card mb-4 border-l-4 border-l-gold p-3 text-sm text-ink">Dosijei kupaca još ne postoje u bazi. Pokreni <b>supabase/migracija-7.sql</b> u Supabase SQL editoru, pa osveži stranu.</div>}
        {greska && <div className="card mb-4 border-l-4 border-l-red-500 p-3 text-sm text-ink">{greska}</div>}
        {poruka && <div className="card mb-4 border-l-4 border-l-red-500 p-3 text-sm text-ink">{poruka}</div>}

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setTab("kupci")} className={`tag tag-filter ${tab === "kupci" ? "tag-accent" : ""}`}>Kupci{dosijei.length > 0 && <span className="opacity-70"> · {dosijei.length}</span>}</button>
          <button type="button" onClick={() => setTab("sve")} className={`tag tag-filter ${tab === "sve" ? "tag-accent" : ""}`}>Sve ponude{ponude.length > 0 && <span className="opacity-70"> · {ponude.length}</span>}</button>
          <button type="button" onClick={() => setTab("paja")} className={`tag tag-filter ${tab === "paja" ? "tag-accent" : nCekaPaju ? "tag-yellow" : ""}`}>Paja{nCekaPaju > 0 && <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yellow px-1 text-[10px] font-bold text-white">{nCekaPaju}</span>}</button>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Traži kupca, broj, mesto…" className="inp inp-sm ml-auto w-full sm:w-64" />
        </div>

        {tab === "kupci" && (
          <>
            <p className="mb-3 text-[12.5px] text-muted"><span className="tag tag-green mr-1">✓</span>gotovo <span className="tag tag-yellow mx-1">…</span>čeka se druga strana <span className="tag tag-red mx-1">!</span>fali naš korak. Ponuda za ugradnju znači da su materijal i prevoz već spremni; Pajin tekst znači da je ugradnja rešena, PDF je po želji.</p>
            <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px]">
              {([["svi", "Svi"], ["fali", `Nešto fali · ${nFali}`], ["ceka", `Čeka cenu prevoza · ${nCeka}`]] as [Filter, string][]).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setFilter(v)} className={`tag tag-filter ${filter === v ? (v === "fali" ? "tag-warn" : v === "ceka" ? "tag-gold" : "tag-navy") : ""}`}>{l}</button>
              ))}
              <Link href="/ugradnja" className="ml-auto text-[12px] font-semibold text-ink underline underline-offset-2">+ Ponuda za ugradnju bez dosijea</Link>
            </div>
            {kupci.length === 0 && !tabelaDosijeaFali && !demo && (
              <div className="card p-6 text-center text-sm text-muted">
                {dosijei.length === 0 ? <>Još nema dosijea. Dosije se sam otvori kad u kalkulatoru pošalješ poruku prevozniku ili Paji, ili napraviš ponudu.</> : "Nijedan kupac ne odgovara filteru."}
              </div>
            )}
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-3">
              {kupci.map((d) => <DosijeKartica key={d.id} d={d} ponude={ponudeDosijea(d)} lead={d.lead_id ? leadovi[d.lead_id] ?? null : null} onObrisi={obrisiD} />)}
            </div>
          </>
        )}

        {tab === "paja" && <PajaTab dosijei={dosijei.filter((x) => !obrisane.has(x.id))} leadovi={leadoviPuni} />}

        {tab === "sve" && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">
                <b className="text-ink">{lista.length}</b> {lista.length === 1 ? "ponuda" : lista.length >= 2 && lista.length <= 4 ? "ponude" : "ponuda"}
                {lista.length > 0 && <> · ukupno <b className="text-ink">{rsd(zbir)}</b></>}
              </span>
              <Link href="/ugradnja" className="btn btn-sm btn-ghost btn-plain ml-auto">Ponuda za ugradnju</Link>
              <Link href="/kalkulator" className="btn btn-sm btn-plain">Nova ponuda</Link>
            </div>
            {lista.length === 0 && !tabelaFali && !demo && (
              <div className="card p-6 text-center text-sm text-muted">Još nema ponuda. Napravi je u kalkulatoru; čim na strani ponude skineš PDF, ponuda se sama upiše ovde.</div>
            )}
            <div className="flex flex-col gap-3 lg:hidden">
              {lista.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-[17px] font-bold text-navy">{p.kupac}</div>
                      <div className="mt-0.5 text-xs text-muted">Ponuda {p.broj} · {p.datum}{p.mesto ? ` · ${p.mesto}` : ""}</div>
                    </div>
                    <div className="text-right font-display text-[17px] font-bold tabular-nums text-navy">{rsd(Number(p.ukupno_rsd))}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted">{REZIM[p.rezim ?? ""] ?? p.rezim} · {p.transport_eur != null ? `transport ${p.transport_eur} € ${p.sa_istovarom ? "sa istovarom" : "bez istovara"}` : "bez transporta"} · {p.sastavio}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/ponuda?id=${p.id}`} className="btn btn-sm">Otvori</Link>
                    <PosaljiKlijentu mali telefon={telIzAdrese(p.adresa)} imeFajla={imeFajla(metaPonude(p))}
                      napraviPdf={() => napraviPonudaPdf(p.redovi, Number(p.ukupno_rsd), metaPonude(p))}
                      tekst={(url) => porukaMaterijal(p.broj, Number(p.ukupno_rsd), url)} />
                    <button type="button" onClick={() => obrisi(p)} className="btn btn-sm btn-ghost btn-plain">Obriši</button>
                  </div>
                </div>
              ))}
            </div>
            {lista.length > 0 && (
              <div className="card hidden overflow-hidden lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted [&>th]:whitespace-nowrap">
                      <th className="px-4 py-2.5 font-semibold">Datum</th><th className="px-2 py-2.5 font-semibold">Broj</th><th className="px-2 py-2.5 font-semibold">Kupac</th>
                      <th className="px-2 py-2.5 font-semibold">Mesto</th><th className="px-2 py-2.5 font-semibold">Vrsta</th><th className="px-2 py-2.5 font-semibold">Transport</th>
                      <th className="px-2 py-2.5 text-right font-semibold">Iznos</th><th className="px-2 py-2.5 font-semibold">Sastavio</th><th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0 hover:bg-wash/50">
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted">{p.datum}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 font-semibold text-ink">{p.broj}</td>
                        <td className="px-2 py-2.5 text-ink">{p.kupac}</td>
                        <td className="px-2 py-2.5 text-muted">{p.mesto ?? "—"}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-muted">{REZIM[p.rezim ?? ""] ?? p.rezim}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-muted">{p.transport_eur != null ? `${p.transport_eur} € ${p.sa_istovarom ? "sa istovarom" : "bez istovara"}` : "bez transporta"}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums text-navy">{rsd(Number(p.ukupno_rsd))}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-muted">{p.sastavio}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <span className="inline-flex flex-wrap items-center justify-end gap-2">
                            <Link href={`/ponuda?id=${p.id}`} className="btn btn-sm">Otvori</Link>
                            <PosaljiKlijentu mali telefon={telIzAdrese(p.adresa)} imeFajla={imeFajla(metaPonude(p))}
                              napraviPdf={() => napraviPonudaPdf(p.redovi, Number(p.ukupno_rsd), metaPonude(p))}
                              tekst={(url) => porukaMaterijal(p.broj, Number(p.ukupno_rsd), url)} />
                            <button type="button" onClick={() => obrisi(p)} className="btn btn-sm btn-ghost btn-plain">Obriši</button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
    </Shell>
  );
}
