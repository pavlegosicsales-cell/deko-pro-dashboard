"use client";

import { useState, useMemo, useTransition, useOptimistic, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Stat, ArrowIco, PlusIco, Logo } from "@/components/ui";
import { Sidebar } from "@/components/Sidebar";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { STATUSI, OTVORENI, PROIZVODI, IZVORI, label } from "@/lib/opcije";
import { telLink, smsLink, waLink, viberLink } from "@/lib/lead";
import { pre } from "@/lib/format";
import { dodajLead, izmeniLead, promeniStatus, obrisiLead, type LeadState } from "@/app/leadovi/actions";

export type LeadRow = {
  id: string; ime: string | null; prezime: string | null; telefon: string | null;
  proizvod: string | null; izvor: string | null; info: string | null; status: string;
  podseti_kad: string | null; ishod_beleska: string | null; created_at: string;
};

const danasIso = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
const punoIme = (l: LeadRow) => [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena";
const jeDospeo = (l: LeadRow, danas: string) => l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas;
const datumKratko = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" });

export function LeadView({ leadovi, tabelaFali, demo }: { leadovi: LeadRow[]; tabelaFali: boolean; demo?: boolean }) {
  const [view, setView] = useState<string>("red"); // "red" (za zvanje) | status | "svi"
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [izmeni, setIzmeni] = useState<LeadRow | null>(null);

  // Demo (bez baze): izmene žive u lokalnom state-u umesto na serveru.
  const [lokalni, setLokalni] = useState<LeadRow[]>(leadovi);
  const osnova = demo ? lokalni : leadovi;

  const [opt, apply] = useOptimistic(
    osnova,
    (state: LeadRow[], a: { id: string; status?: string; del?: boolean }) =>
      a.del ? state.filter((l) => l.id !== a.id) : state.map((l) => (l.id === a.id ? { ...l, status: a.status! } : l)),
  );
  const [, start] = useTransition();
  const menjajStatus = (id: string, status: string) => {
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, status } : l)));
    start(() => { apply({ id, status }); promeniStatus(id, status); });
  };
  const obrisi = (id: string) => {
    if (demo) return setLokalni((a) => a.filter((l) => l.id !== id));
    start(() => { apply({ id, del: true }); obrisiLead(id); });
  };
  // Lokalno čuvanje forme u demo režimu (isti potpis kao server akcije)
  const demoSacuvaj = async (_p: LeadState, fd: FormData): Promise<LeadState> => {
    const g = (k: string) => { const v = fd.get(k); return typeof v === "string" && v.trim() ? v.trim() : null; };
    const id = g("id");
    const polja = { ime: g("ime"), prezime: g("prezime"), telefon: g("telefon"), proizvod: g("proizvod"), izvor: g("izvor"), info: g("info") };
    if (!polja.ime && !polja.prezime && !polja.telefon) return { ok: false, msg: "Unesi bar ime ili telefon." };
    setLokalni((a) => id
      ? a.map((l) => (l.id === id ? { ...l, ...polja, status: g("status") ?? l.status, podseti_kad: g("podseti_kad"), ishod_beleska: g("ishod_beleska") } : l))
      : [{ id: "d" + Date.now(), ...polja, status: "nov", podseti_kad: null, ishod_beleska: null, created_at: new Date().toISOString() }, ...a]);
    return { ok: true };
  };

  const danas = danasIso();
  const qq = q.trim().toLowerCase();

  const filtrirani = useMemo(() => {
    let arr = opt;
    if (view === "red") arr = arr.filter((l) => OTVORENI.has(l.status));
    else if (view !== "svi") arr = arr.filter((l) => l.status === view);
    if (qq) arr = arr.filter((l) => [l.ime, l.prezime, l.telefon, l.info, l.proizvod].some((x) => (x || "").toLowerCase().includes(qq)));

    if (view === "red") {
      // dospeli povratni pozivi gore, pa najstariji nov-ovi (zove se redom)
      return [...arr].sort((a, b) => {
        const ad = jeDospeo(a, danas), bd = jeDospeo(b, danas);
        if (ad !== bd) return ad ? -1 : 1;
        return a.created_at.localeCompare(b.created_at);
      });
    }
    return [...arr].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [opt, view, qq, danas]);

  const uRedu = opt.filter((l) => OTVORENI.has(l.status)).length;
  const dospeloDanas = opt.filter((l) => jeDospeo(l, danas)).length;
  const zatvoreno = opt.filter((l) => l.status === "zatvoren").length;

  const brojPo = (v: string) => (v === "red" ? uRedu : v === "svi" ? opt.length : opt.filter((l) => l.status === v).length);
  const tabovi = [{ v: "red", l: "Za zvanje" }, ...STATUSI.map((s) => ({ v: s.v, l: s.l })), { v: "svi", l: "Svi" }];

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <TopBar onDodaj={() => setModal(true)} />
      <Sidebar uRedu={uRedu} onDodaj={() => setModal(true)} />

      {/* Page head: navy + foto + preliv, kao naslovne trake unutrašnjih strana sajta */}
      <section className="page-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-bg.jpg" alt="" aria-hidden />
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-[calc(var(--nav-h)+28px)] sm:pt-[calc(var(--nav-h)+40px)] lg:max-w-none lg:px-8 lg:pb-7 lg:pt-7">
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-10">
          <div className="on-dark rise flex flex-col items-start gap-3">
            <span className="eyebrow">
              <span className="eyebrow-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              Interni panel
            </span>
            <h1 className="h2 lg:text-[34px]">Leadovi</h1>
            <p className="max-w-md text-sm sm:text-[15px]">
              Setter upisuje, vlasnik zove redom. Dospeli povratni pozivi su uvek na vrhu.
            </p>
          </div>

          {/* Stat traka — navy / bronza / navy kao na sajtu */}
          <div className="rise mt-6 grid grid-cols-3 gap-2.5 sm:gap-4 lg:mt-0 lg:w-[560px] lg:shrink-0" style={{ animationDelay: ".12s" }}>
            <Stat label="U redu" value={String(uRedu)} icon={<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>} />
            <Stat label="Dospelo danas" value={String(dospeloDanas)} alarm={dospeloDanas > 0}
              icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
            <Stat label="Zatvoreno" value={String(zatvoreno)} icon={<><path d="M20 6 9 17l-5-5" /></>} />
          </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7 lg:max-w-none lg:px-8 lg:py-6">
        {demo && (
          <div className="card mb-4 border-l-4 border-l-gold p-4 text-sm">
            <p className="h3 text-[15px]">Probni podaci</p>
            <p className="mt-1 text-muted">Supabase još nije povezan, pa se izmene ne čuvaju. Popuni <code className="rounded bg-wash px-1 text-ink">.env.local</code> i pokreni <code className="rounded bg-wash px-1 text-ink">supabase/schema.sql</code>.</p>
          </div>
        )}
        {tabelaFali && (
          <div className="card mb-4 border-l-4 border-l-gold p-4 text-sm">
            <p className="h3 text-[15px]">Baza još nije podešena</p>
            <p className="mt-1 text-muted">Pokreni <code className="rounded bg-wash px-1 text-ink">supabase/schema.sql</code> u Supabase SQL editoru, pa dodaj prvi lead.</p>
          </div>
        )}

        {/* Filteri: tag pilovi kao na sajtu; na desktopu pretraga stoji desno u istom redu */}
        <div className="lg:mb-5 lg:flex lg:items-center lg:justify-between lg:gap-6">
        <div className="mb-3 flex flex-wrap gap-2 lg:m-0">
          {tabovi.map((t) => (
            <button key={t.v} onClick={() => setView(t.v)} className={`tag tag-filter ${view === t.v ? "tag-accent" : ""}`}>
              {t.l}
              <span className={`rounded-full px-1.5 text-[11px] leading-[18px] ${view === t.v ? "bg-white/15 text-white" : "bg-wash text-muted"}`}>{brojPo(t.v)}</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4 lg:m-0 lg:w-80 lg:shrink-0">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga: ime, telefon, proizvod…" className="inp pl-11 lg:min-h-[44px] lg:py-2 lg:text-[14px]" />
        </div>
        </div>

        {filtrirani.length === 0 ? (
          <Card className="flex flex-col items-center p-10 text-center">
            <Logo size={44} />
            <p className="mt-4 text-sm text-muted">{opt.length === 0 ? "Još nema leadova. Dodaj prvi." : "Nema leadova za ovaj filter."}</p>
            {opt.length === 0 && (
              <button onClick={() => setModal(true)} className="btn btn-sm mt-5">Dodaj lead<PlusIco /></button>
            )}
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-3 lg:hidden">
              {filtrirani.map((l) => (
                <LeadKartica key={l.id} l={l} danas={danas} onStatus={menjajStatus} onEdit={() => setIzmeni(l)} onDelete={() => obrisi(l.id)} />
              ))}
            </div>
            <div className="hidden lg:block">
              <LeadTabela leadovi={filtrirani} danas={danas} onStatus={menjajStatus} onEdit={setIzmeni} onDelete={obrisi} />
            </div>
          </>
        )}

        <p className="mt-10 text-center text-xs text-muted">Deko Pro · dekorativni blok od 2015. · 062 253 140</p>
      </main>

      {/* Plutajuće „+" na telefonu, da se lead doda jednim palcem */}
      <button onClick={() => setModal(true)} aria-label="Novi lead"
        className="fixed bottom-5 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-gold text-navy shadow-[0_10px_30px_rgba(11,30,59,.35)] transition-transform active:scale-95 sm:hidden">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {modal && <LeadModal onClose={() => setModal(false)} akcija={demo ? demoSacuvaj : undefined} />}
      {izmeni && <LeadModal lead={izmeni} onClose={() => setIzmeni(null)} akcija={demo ? demoSacuvaj : undefined} />}
    </div>
  );
}

/* ---------------- Plutajući pill nav (kao na sajtu) ---------------- */
function TopBar({ onDodaj }: { onDodaj: () => void }) {
  const router = useRouter();
  const odjava = async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); router.refresh(); };
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40 sm:top-5 lg:hidden">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 sm:px-4">
        <div className="nav-bar">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={40} />
            <div className="flex min-w-0 flex-col leading-none">
              <span className="nav-wordmark">Deko Pro</span>
              <span className="nav-sub mt-1">Leadovi</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onDodaj} className="btn btn-sm btn-light hidden sm:inline-flex">Novi lead<PlusIco /></button>
            <button onClick={odjava} title="Odjava" aria-label="Odjava"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Tabela (desktop) ---------------- */
function LeadTabela({ leadovi, danas, onStatus, onEdit, onDelete }: { leadovi: LeadRow[]; danas: string; onStatus: (id: string, s: string) => void; onEdit: (l: LeadRow) => void; onDelete: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted">
            <th className="px-4 py-3 font-semibold">Lead</th>
            <th className="px-4 py-3 font-semibold">Proizvod</th>
            <th className="px-4 py-3 font-semibold">Izvor</th>
            <th className="px-4 py-3 font-semibold">Info za poziv</th>
            <th className="px-4 py-3 font-semibold">Dodat</th>
            <th className="px-4 py-3 font-semibold">Kontakt</th>
            <th className="w-[220px] px-4 py-3 font-semibold">Ishod</th>
            <th className="px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {leadovi.map((l) => {
            const st = STATUSI.find((s) => s.v === l.status);
            const dospeo = jeDospeo(l, danas);
            const ima = !!l.telefon;
            return (
              <tr key={l.id} className={`border-b border-line align-top transition-colors last:border-0 hover:bg-wash/60 ${dospeo ? "bg-gold/8" : ""}`}>
                <td className="px-4 py-3">
                  <div className="font-alt font-bold tracking-[-.02em] text-ink">{punoIme(l)}</div>
                  {l.telefon
                    ? <a href={telLink(l.telefon)} className="font-display text-[14px] font-semibold text-gold-deep hover:text-navy">{l.telefon}</a>
                    : <span className="text-xs text-muted">bez broja</span>}
                  {l.podseti_kad && <div className="mt-1"><span className={`tag ${dospeo ? "tag-warn" : ""}`}>{dospeo ? "Dospelo" : "Zvati"} {datumKratko(l.podseti_kad)}</span></div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{l.proizvod ? <span className="tag tag-navy">{label(PROIZVODI, l.proizvod)}</span> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3 whitespace-nowrap">{l.izvor ? <span className="tag tag-gold">{label(IZVORI, l.izvor)}</span> : <span className="text-muted">—</span>}</td>
                <td className="max-w-[360px] px-4 py-3">
                  {l.info ? <p className="whitespace-pre-wrap text-[13px] leading-snug text-ink/85">{l.info}</p> : <span className="text-muted">—</span>}
                  {l.ishod_beleska && <p className="mt-1 border-l-2 border-gold pl-2 text-xs text-muted">{l.ishod_beleska}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{pre(l.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <MiniAkcija href={telLink(l.telefon)} ima={ima} title="Pozovi" primarno icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} />
                    <MiniAkcija href={viberLink(l.telefon)} ima={ima} title="Viber" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
                    <MiniAkcija href={waLink(l.telefon)} ima={ima} title="WhatsApp" blank icon={<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.5A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />} />
                    <MiniAkcija href={smsLink(l.telefon)} ima={ima} title="SMS" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5" />} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: st?.boja }} />
                    <select value={l.status} onChange={(e) => onStatus(l.id, e.target.value)} className="inp inp-sm min-w-0 flex-1 font-medium">
                      {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center">
                    <button onClick={() => onEdit(l)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-wash hover:text-navy" aria-label="Izmeni">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    </button>
                    <button onClick={() => { if (confirm(`Obrisati lead — ${punoIme(l)}?`)) onDelete(l.id); }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/8 hover:text-danger" aria-label="Obriši">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function MiniAkcija({ href, ima, title, icon, primarno, blank }: { href: string; ima: boolean; title: string; icon: React.ReactNode; primarno?: boolean; blank?: boolean }) {
  const cls = `grid h-9 w-9 place-items-center rounded-full border transition-colors ${primarno ? "border-navy bg-navy text-gold hover:border-gold-deep hover:bg-gold-deep hover:text-white" : "border-line text-ink hover:border-accent hover:bg-wash"} ${ima ? "" : "pointer-events-none opacity-40"}`;
  const svg = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>;
  if (!ima) return <span className={cls} title={title}>{svg}</span>;
  return <a href={href} title={title} target={blank ? "_blank" : undefined} rel={blank ? "noreferrer" : undefined} className={cls}>{svg}</a>;
}

/* ---------------- Kartica leada ---------------- */
function LeadKartica({ l, danas, onStatus, onEdit, onDelete }: { l: LeadRow; danas: string; onStatus: (id: string, s: string) => void; onEdit: () => void; onDelete: () => void }) {
  const st = STATUSI.find((s) => s.v === l.status);
  const dospeo = jeDospeo(l, danas);
  const ima = !!l.telefon;

  return (
    <Card className={`p-4 ${dospeo ? "card-due" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="h3 truncate">{punoIme(l)}</div>
          {l.telefon
            ? <a href={telLink(l.telefon)} className="font-display text-[15px] font-semibold tracking-[.01em] text-gold-deep hover:text-navy">{l.telefon}</a>
            : <span className="text-sm text-muted">bez broja</span>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="mr-1 text-[11px] text-muted">{pre(l.created_at)}</span>
          <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-wash hover:text-navy" aria-label="Izmeni">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          </button>
          <button onClick={() => { if (confirm(`Obrisati lead — ${punoIme(l)}?`)) onDelete(); }} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/8 hover:text-danger" aria-label="Obriši">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {l.proizvod && <span className="tag tag-navy">{label(PROIZVODI, l.proizvod)}</span>}
        {l.izvor && <span className="tag tag-gold">{label(IZVORI, l.izvor)}</span>}
        {l.podseti_kad && <span className={`tag ${dospeo ? "tag-warn" : ""}`}>{dospeo ? "Dospelo" : "Zvati"} {datumKratko(l.podseti_kad)}</span>}
      </div>

      {l.info && <p className="mt-2.5 whitespace-pre-wrap text-sm text-ink/85">{l.info}</p>}
      {l.ishod_beleska && <p className="mt-1.5 border-l-2 border-gold pl-2.5 text-xs text-muted">{l.ishod_beleska}</p>}

      {/* akcije komunikacije */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <Akcija href={telLink(l.telefon)} ima={ima} label="Pozovi" primarno
          icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} />
        <Akcija href={viberLink(l.telefon)} ima={ima} label="Viber"
          icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
        <Akcija href={waLink(l.telefon)} ima={ima} label="WhatsApp" blank
          icon={<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.5A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />} />
        <Akcija href={smsLink(l.telefon)} ima={ima} label="SMS"
          icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5" />} />
      </div>

      {/* ishod */}
      <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
        <span className="micro shrink-0 text-[11px] text-muted">Ishod</span>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: st?.boja }} />
        <select value={l.status} onChange={(e) => onStatus(l.id, e.target.value)} className="inp inp-sm min-w-0 flex-1 font-medium">
          {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
    </Card>
  );
}

function Akcija({ href, ima, label, icon, primarno, blank }: { href: string; ima: boolean; label: string; icon: React.ReactNode; primarno?: boolean; blank?: boolean }) {
  const cls = `akcija ${primarno ? "akcija-primary" : ""} ${ima ? "" : "akcija-off"}`;
  const inner = (
    <>
      <svg className="akcija-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      {label}
    </>
  );
  if (!ima) return <span className={cls}>{inner}</span>;
  return <a href={href} target={blank ? "_blank" : undefined} rel={blank ? "noreferrer" : undefined} className={cls}>{inner}</a>;
}

/* ---------------- Modal (dodaj / izmeni) ---------------- */
const pocetno: LeadState = { ok: false };

type Akcija = (p: LeadState, fd: FormData) => Promise<LeadState>;
function LeadModal({ lead, onClose, akcija }: { lead?: LeadRow; onClose: () => void; akcija?: Akcija }) {
  const [state, formAction, pending] = useActionState(akcija ?? (lead ? izmeniLead : dodajLead), pocetno);

  useEffect(() => { if (state.ok) onClose(); }, [state.ok, onClose]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={onClose}>
      <div className="rise flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[15px]" onClick={(e) => e.stopPropagation()}>
        {/* Navy zaglavlje kao mala page-head traka */}
        <div className="blueprint flex items-center justify-between bg-navy px-5 py-4 text-white">
          <div>
            <div className="nav-sub">{lead ? "Izmena" : "Novi unos"}</div>
            <h2 className="h-display mt-0.5 text-[20px] text-white">{lead ? "Izmeni lead" : "Novi lead"}</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Zatvori">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {lead && <input type="hidden" name="id" value={lead.id} />}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ime"><input name="ime" defaultValue={lead?.ime ?? ""} autoFocus className="inp" /></Field>
              <Field label="Prezime"><input name="prezime" defaultValue={lead?.prezime ?? ""} className="inp" /></Field>
            </div>

            <Field label="Telefon"><input name="telefon" defaultValue={lead?.telefon ?? ""} inputMode="tel" className="inp" placeholder="06x xxx xxxx" /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Proizvod">
                <select name="proizvod" defaultValue={lead?.proizvod ?? ""} className="inp">
                  <option value="">—</option>
                  {PROIZVODI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Field>
              <Field label="Izvor">
                <select name="izvor" defaultValue={lead?.izvor ?? ""} className="inp">
                  <option value="">—</option>
                  {IZVORI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Informacije za vlasnika (pred poziv)">
              <textarea name="info" defaultValue={lead?.info ?? ""} rows={3} className="inp" placeholder="Dužina i visina ograde, lokacija, boja, budžet, kad da ga zove…" />
            </Field>

            {lead && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ishod">
                    <select name="status" defaultValue={lead.status} className="inp">
                      {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Zvati ponovo"><input type="date" name="podseti_kad" defaultValue={lead.podseti_kad ?? ""} className="inp" /></Field>
                </div>
                <Field label="Beleška posle poziva"><textarea name="ishod_beleska" defaultValue={lead.ishod_beleska ?? ""} rows={2} className="inp" /></Field>
              </>
            )}

            {state.msg && !state.ok && <p className="text-sm font-medium text-danger">{state.msg}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line bg-wash px-5 py-3">
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-plain">Otkaži</button>
            <button type="submit" disabled={pending} className="btn btn-sm">
              {pending ? "Čuvam…" : lead ? "Sačuvaj" : "Dodaj lead"}
              <ArrowIco />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
