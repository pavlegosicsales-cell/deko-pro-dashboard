"use client";

import { useState, useMemo, useTransition, useOptimistic, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, StatCard } from "@/components/ui";
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

export function LeadView({ leadovi, tabelaFali }: { leadovi: LeadRow[]; tabelaFali: boolean }) {
  const [view, setView] = useState<string>("red"); // "red" (za zvanje) | status | "svi"
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [izmeni, setIzmeni] = useState<LeadRow | null>(null);

  const [opt, apply] = useOptimistic(
    leadovi,
    (state: LeadRow[], a: { id: string; status?: string; del?: boolean }) =>
      a.del ? state.filter((l) => l.id !== a.id) : state.map((l) => (l.id === a.id ? { ...l, status: a.status! } : l)),
  );
  const [, start] = useTransition();
  const menjajStatus = (id: string, status: string) => start(() => { apply({ id, status }); promeniStatus(id, status); });
  const obrisi = (id: string) => start(() => { apply({ id, del: true }); obrisiLead(id); });

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

  const tabovi = [{ v: "red", l: "Za zvanje" }, ...STATUSI.map((s) => ({ v: s.v, l: s.l })), { v: "svi", l: "Svi" }];

  return (
    <div className="min-h-screen">
      <TopBar onDodaj={() => setModal(true)} />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:py-6">
        {tabelaFali && (
          <div className="mb-4 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm">
            <p className="font-semibold text-warn">Baza još nije podešena</p>
            <p className="mt-1 text-ink">Pokreni <code className="rounded bg-line px-1">supabase/schema.sql</code> u Supabase SQL editoru, pa dodaj prvi lead.</p>
          </div>
        )}

        {/* KPI */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatCard label="U redu" value={String(uRedu)} tone="gold" />
          <StatCard label="Dospelo danas" value={String(dospeloDanas)} tone={dospeloDanas > 0 ? "warn" : undefined} />
          <StatCard label="Zatvoreno" value={String(zatvoreno)} tone="ok" />
        </div>

        {/* Filteri */}
        <div className="mb-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {tabovi.map((t) => (
            <button key={t.v} onClick={() => setView(t.v)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${view === t.v ? "bg-navy text-white" : "border border-line bg-card text-muted hover:text-ink"}`}>
              {t.l}
            </button>
          ))}
        </div>

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga (ime, telefon, proizvod)…"
          className="mb-4 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" />

        {filtrirani.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted">{opt.length === 0 ? "Još nema leadova. Dodaj prvi." : "Nema leadova za ovaj filter."}</p>
            {opt.length === 0 && <button onClick={() => setModal(true)} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-2">Dodaj lead</button>}
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filtrirani.map((l) => (
              <LeadKartica key={l.id} l={l} danas={danas} onStatus={menjajStatus} onEdit={() => setIzmeni(l)} onDelete={() => obrisi(l.id)} />
            ))}
          </div>
        )}
      </main>

      {modal && <LeadModal onClose={() => setModal(false)} />}
      {izmeni && <LeadModal lead={izmeni} onClose={() => setIzmeni(null)} />}
    </div>
  );
}

function TopBar({ onDodaj }: { onDodaj: () => void }) {
  const router = useRouter();
  const odjava = async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); router.refresh(); };
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[linear-gradient(90deg,#0B1E3B_0%,#16324f_100%)]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} className="h-8 w-auto" />
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-white">Deko Pro · Leadovi</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDodaj} className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-bold text-navy transition-colors hover:bg-[#c0a05a]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Lead
          </button>
          <button onClick={odjava} title="Odjava" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function LeadKartica({ l, danas, onStatus, onEdit, onDelete }: { l: LeadRow; danas: string; onStatus: (id: string, s: string) => void; onEdit: () => void; onDelete: () => void }) {
  const st = STATUSI.find((s) => s.v === l.status);
  const dospeo = jeDospeo(l, danas);
  const ima = !!l.telefon;

  return (
    <Card className={`p-4 ${dospeo ? "border-warn/50 ring-1 ring-warn/20" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-ink">{punoIme(l)}</div>
          {l.telefon
            ? <a href={telLink(l.telefon)} className="text-sm text-muted hover:text-navy">{l.telefon}</a>
            : <span className="text-sm text-muted">bez broja</span>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="mr-1 text-[11px] text-muted">{pre(l.created_at)}</span>
          <button onClick={onEdit} className="rounded p-1.5 text-muted hover:bg-line" aria-label="Izmeni">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          </button>
          <button onClick={() => { if (confirm(`Obrisati lead — ${punoIme(l)}?`)) onDelete(); }} className="rounded p-1.5 text-danger hover:bg-danger/5" aria-label="Obriši">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {l.proizvod && <span className="rounded bg-navy/8 px-2 py-0.5 text-[11px] font-medium text-navy">{label(PROIZVODI, l.proizvod)}</span>}
        {l.izvor && <span className="rounded bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold-deep">{label(IZVORI, l.izvor)}</span>}
        {l.podseti_kad && <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${dospeo ? "bg-warn/15 text-warn" : "bg-line text-muted"}`}>Zvati: {new Date(l.podseti_kad + "T12:00:00").toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" })}</span>}
      </div>

      {l.info && <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">{l.info}</p>}

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
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: st?.boja }} />
        <select value={l.status} onChange={(e) => onStatus(l.id, e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-card px-2.5 py-2 text-sm font-medium text-ink outline-none focus:border-gold">
          {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
    </Card>
  );
}

function Akcija({ href, ima, label, icon, primarno, blank }: { href: string; ima: boolean; label: string; icon: React.ReactNode; primarno?: boolean; blank?: boolean }) {
  const base = "flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold transition-colors";
  const cls = primarno ? "bg-navy text-white hover:bg-navy-2" : "border border-line text-ink hover:bg-bg";
  if (!ima) return <span className={`${base} ${cls} pointer-events-none opacity-40`}><Ikona>{icon}</Ikona>{label}</span>;
  return (
    <a href={href} target={blank ? "_blank" : undefined} rel={blank ? "noreferrer" : undefined} className={`${base} ${cls}`}>
      <Ikona>{icon}</Ikona>{label}
    </a>
  );
}
function Ikona({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

/* ---------------- Modal (dodaj / izmeni) ---------------- */
const inp = "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/25";
const pocetno: LeadState = { ok: false };

function LeadModal({ lead, onClose }: { lead?: LeadRow; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(lead ? izmeniLead : dodajLead, pocetno);

  useEffect(() => { if (state.ok) onClose(); }, [state.ok, onClose]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="my-auto w-full max-w-lg rounded-2xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="h-display text-lg">{lead ? "Izmeni lead" : "Novi lead"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Zatvori">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form action={formAction} className="max-h-[72vh] space-y-4 overflow-y-auto px-5 py-4">
          {lead && <input type="hidden" name="id" value={lead.id} />}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ime"><input name="ime" defaultValue={lead?.ime ?? ""} autoFocus className={inp} /></Field>
            <Field label="Prezime"><input name="prezime" defaultValue={lead?.prezime ?? ""} className={inp} /></Field>
          </div>

          <Field label="Telefon"><input name="telefon" defaultValue={lead?.telefon ?? ""} inputMode="tel" className={inp} placeholder="06x xxx xxxx" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Proizvod / interesovanje">
              <select name="proizvod" defaultValue={lead?.proizvod ?? ""} className={inp}>
                <option value="">—</option>
                {PROIZVODI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
            <Field label="Izvor">
              <select name="izvor" defaultValue={lead?.izvor ?? ""} className={inp}>
                <option value="">—</option>
                {IZVORI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Informacije o kupcu (za vlasnika pred poziv)">
            <textarea name="info" defaultValue={lead?.info ?? ""} rows={3} className={inp} placeholder="Dužina i visina ograde, lokacija, boja, budžet, kad da ga zove…" />
          </Field>

          {lead && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ishod / status">
                  <select name="status" defaultValue={lead.status} className={inp}>
                    {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </Field>
                <Field label="Zvati ponovo (datum)"><input type="date" name="podseti_kad" defaultValue={lead.podseti_kad ?? ""} className={inp} /></Field>
              </div>
              <Field label="Beleška posle poziva"><textarea name="ishod_beleska" defaultValue={lead.ishod_beleska ?? ""} rows={2} className={inp} /></Field>
            </>
          )}

          {state.msg && !state.ok && <p className="text-sm text-danger">{state.msg}</p>}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink hover:bg-bg">Otkaži</button>
            <button type="submit" disabled={pending} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-2 disabled:opacity-60">
              {pending ? "Čuvam…" : lead ? "Sačuvaj" : "Dodaj lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{label}</span>{children}</label>;
}
