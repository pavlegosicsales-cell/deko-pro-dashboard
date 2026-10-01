"use client";

import { Fragment, useState, useMemo, useTransition, useOptimistic, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sat } from "@/components/Sat";
import { brojNaDan, danasKljuc, pomeriDan } from "@/lib/analitika";
import { Card, Logo } from "@/components/ui";
import { Shell, Obavestenje } from "@/components/Shell";
import { STATUSI, SVI_PROIZVODI, SVI_IZVORI, DETALJI, staFali, obuhvatKratko, modelKratko, modelLabel, label, normalizujProizvod, DRUGO, TEMPERATURE, TIPOVI_KUPCA, RAZLOZI, ROKOVI, temperatura, statusOd, type Detalji } from "@/lib/opcije";
import { LeadWizard } from "@/components/LeadWizard";
import { telLink, smsLink, waLink, viberLink } from "@/lib/lead";
import { pre, rsd } from "@/lib/format";
import { proceniLead, grupaTemperature, bojaNaziv, type Procena } from "@/lib/procena";
import { promeniStatus, obrisiLead, promeniBelesku, promeniPodsetnik, promeniPrioritet, promeniZaradu, promeniKvalifikaciju, type LeadState } from "@/app/leadovi/actions";

/*
  Lista leadova, redizajn 01.10.2026. (Promo Bet): belo zaglavlje, kategorije kao kartice-filteri sa bojom
  po značenju, tabela sa statusnim čipovima na kompu, kartice na telefonu. Sve što je sporedno (tip kupca,
  detalji za ponudu, dosije, ponude) živi na strani leada (/lead/<id>); ovde ostaje ono što Luka menja
  između dva poziva: ishod, datum, zarada, razlog, beleška, zvezdica, temperatura.
*/
export type LeadRow = {
  id: string; ime: string | null; prezime: string | null; telefon: string | null;
  proizvod: string | null; obuhvat?: string | null; lokacija?: string | null; duzina_m?: number | null; ispuna?: string | null; detalji?: Detalji | null;
  izvor: string | null; info: string | null; status: string;
  podseti_kad: string | null; ishod_beleska: string | null; created_at: string;
  updated_at?: string | null; pozvan_kad?: string | null; status_od?: string | null;
  prioritet?: boolean | null; zarada_rsd?: number | null;
  temperatura?: string | null; tip_kupca?: string | null; rok?: string | null; razlog_odustajanja?: string | null;
};

const danasIso = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
export const punoIme = (l: LeadRow) => [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena";
export const jeDospeo = (l: LeadRow, danas: string) => l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas;
const uIshodu = (l: LeadRow) => (l.status !== "nov" && l.status_od ? pre(l.status_od) : null);
export const POGLEDI = {
  pozvati: (l: LeadRow, danas: string) => l.status === "nov" || l.status === "nije_se_javio" || jeDospeo(l, danas),
  prioritet: (l: LeadRow, danas: string) => POGLEDI.pozvati(l, danas) && (!!l.prioritet || jeDospeo(l, danas) || l.temperatura === "vruc" || l.temperatura === "topao"),
  dostaviti_ponudu: (l: LeadRow) => l.status === "dostaviti_ponudu",
  ponuda: (l: LeadRow) => l.status === "ponuda",
  kupci: (l: LeadRow) => l.status === "zatvoren",
  zakazani: (l: LeadRow, danas: string) => l.status === "zvati_kasnije" && !jeDospeo(l, danas),
  odustali: (l: LeadRow) => l.status === "propao",
  svi: () => true,
} as const;
type Pogled = keyof typeof POGLEDI;
const fali = (l: LeadRow) => staFali(l);
const datumKratko = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit" });

export function LeadView({ leadovi, tabelaFali, demo, login, migracijaFali }: { leadovi: LeadRow[]; tabelaFali: boolean; demo?: boolean; login?: boolean; migracijaFali?: { fajl: string; sta: string } | null }) {
  const router = useRouter();
  const [greska, setGreska] = useState<string | null>(null);
  const [view, setView] = useState<Pogled>("pozvati");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [pocetniKorak, setPocetniKorak] = useState(0);
  useEffect(() => {
    const m = /^#novi(?::(\d))?$/.exec(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m) { setPocetniKorak(Number(m[1] ?? 0)); setModal(true); }
  }, []);
  const [izmeni, setIzmeni] = useState<LeadRow | null>(null);

  const [lokalni, setLokalni] = useState<LeadRow[]>(leadovi);
  const osnova = demo ? lokalni : leadovi;

  const [opt, apply] = useOptimistic(
    osnova,
    (state: LeadRow[], a: { id: string; status?: string; beleska?: string | null; datum?: string | null; prioritet?: boolean; zarada?: number | null; polje?: string; vrednost?: string | null; del?: boolean }) =>
      a.del ? state.filter((l) => l.id !== a.id)
        : state.map((l) => (l.id === a.id ? { ...l, ...(a.status !== undefined ? { status: a.status } : {}), ...(a.beleska !== undefined ? { ishod_beleska: a.beleska } : {}), ...(a.datum !== undefined ? { podseti_kad: a.datum } : {}), ...(a.prioritet !== undefined ? { prioritet: a.prioritet } : {}), ...(a.zarada !== undefined ? { zarada_rsd: a.zarada } : {}), ...(a.polje ? { [a.polje]: a.vrednost ?? null } : {}) } : l)),
  );
  const [, start] = useTransition();
  const snimi = (a: Parameters<typeof apply>[0], akcija: () => Promise<LeadState>) =>
    start(async () => { apply(a); const r = await akcija(); if (!r.ok) setGreska(r.msg ?? "Nije sačuvano."); else setGreska(null); });
  const menjajStatus = (id: string, status: string) => {
    const sad = new Date().toISOString();
    const izNov = opt.find((l) => l.id === id)?.status === "nov" && status !== "nov";
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, status, status_od: sad, ...(izNov ? { pozvan_kad: sad } : {}) } : l)));
    snimi({ id, status }, () => promeniStatus(id, status, izNov));
  };
  const menjajBelesku = (id: string, beleska: string) => {
    const b = beleska.trim() || null;
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, ishod_beleska: b } : l)));
    snimi({ id, beleska: b }, () => promeniBelesku(id, b));
  };
  const menjajDatum = (id: string, datum: string) => {
    const d = datum || null;
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, podseti_kad: d } : l)));
    snimi({ id, datum: d }, () => promeniPodsetnik(id, d));
  };
  const menjajPrioritet = (id: string, prioritet: boolean) => {
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, prioritet } : l)));
    snimi({ id, prioritet }, () => promeniPrioritet(id, prioritet));
  };
  const menjajKvalifikaciju = (id: string, polje: string, vrednost: string | null) => {
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, [polje]: vrednost } : l)));
    snimi({ id, polje, vrednost }, () => promeniKvalifikaciju(id, polje, vrednost));
  };
  const menjajZaradu = (id: string, zarada: string) => {
    const z = zarada.trim() === "" ? null : Number(zarada.replace(/[^\d.]/g, ""));
    if (z !== null && isNaN(z)) return;
    if (demo) return setLokalni((a) => a.map((l) => (l.id === id ? { ...l, zarada_rsd: z } : l)));
    snimi({ id, zarada: z }, () => promeniZaradu(id, z));
  };
  const obrisi = (id: string) => {
    if (demo) return setLokalni((a) => a.filter((l) => l.id !== id));
    snimi({ id, del: true }, () => obrisiLead(id));
  };
  // izmena: na strani leada (jednostavna forma); u demo režimu ostaje wizard jer nema baze
  const uredi = (l: LeadRow) => { if (demo) setIzmeni(l); else router.push(`/lead/${l.id}?uredi=1`); };

  const demoSacuvaj = async (_p: LeadState, fd: FormData): Promise<LeadState> => {
    const g = (k: string) => { const v = fd.get(k); return typeof v === "string" && v.trim() ? v.trim() : null; };
    const id = g("id");
    const polja = { ime: g("ime"), prezime: g("prezime"), telefon: g("telefon"), proizvod: g("proizvod") === DRUGO ? normalizujProizvod(g("proizvod_tekst")) : g("proizvod"), obuhvat: g("obuhvat"), lokacija: g("lokacija"), duzina_m: g("proizvod") === "ograda" && g("duzina_m") ? parseFloat(g("duzina_m")!.replace(",", ".").match(/\d+(\.\d+)?/)?.[0] ?? "") || null : null, ispuna: g("proizvod") === "ograda" ? g("ispuna") : null,
      detalji: (() => { const d: Record<string, string> = {}; for (const { k } of DETALJI) { const v = g("d_" + k); if (v) d[k] = v; } return Object.keys(d).length ? (d as Detalji) : null; })(),
      izvor: g("izvor"), info: g("info") };
    if (!polja.ime && !polja.prezime && !polja.telefon) return { ok: false, msg: "Unesi bar ime ili telefon." };
    setLokalni((a) => id
      ? a.map((l) => (l.id === id ? { ...l, ...polja, status: g("status") ?? l.status, podseti_kad: g("podseti_kad"), ishod_beleska: g("ishod_beleska") } : l))
      : [{ id: "d" + Date.now(), ...polja, status: "nov", podseti_kad: null, ishod_beleska: null, created_at: new Date().toISOString() }, ...a]);
    return { ok: true };
  };

  const danas = danasIso();
  const qq = q.trim().toLowerCase();

  const procene = useMemo(() => {
    const m = new Map<string, Procena>();
    for (const l of opt) { const p = proceniLead(l); if (p) m.set(l.id, p); }
    return m;
  }, [opt]);

  const filtrirani = useMemo(() => {
    let arr = opt;
    arr = arr.filter((l) => POGLEDI[view](l, danas));
    if (qq) arr = arr.filter((l) => [l.ime, l.prezime, l.telefon, l.info, l.proizvod, l.lokacija].some((x) => (x || "").toLowerCase().includes(qq)));
    if (view === "zakazani") return [...arr].sort((a, b) => (a.podseti_kad ?? "").localeCompare(b.podseti_kad ?? ""));
    return [...arr].sort((a, b) => {
      const hitnoA = (a.prioritet ? 2 : 0) + (jeDospeo(a, danas) ? 1 : 0), hitnoB = (b.prioritet ? 2 : 0) + (jeDospeo(b, danas) ? 1 : 0);
      if (view === "pozvati") { if (hitnoA !== hitnoB) return hitnoB - hitnoA; }
      const ga = grupaTemperature(a.temperatura), gb = grupaTemperature(b.temperatura);
      if (ga !== gb) return ga - gb;
      const va = procene.get(a.id)?.rsd ?? -1, vb = procene.get(b.id)?.rsd ?? -1;
      if (va !== vb) return vb - va;
      return a.created_at.localeCompare(b.created_at);
    });
  }, [opt, view, qq, danas, procene]);

  const stigloDanas = brojNaDan(opt, danasKljuc());
  const stigloJuce = brojNaDan(opt, pomeriDan(danasKljuc(), -1));
  const broj = (p: Pogled) => opt.filter((l) => POGLEDI[p](l, danas)).length;
  const zarada = opt.filter((l) => l.status === "zatvoren").reduce((s, l) => s + (Number(l.zarada_rsd) || 0), 0);
  const nNovi = opt.filter((l) => l.status === "nov").length;
  const nNije = opt.filter((l) => l.status === "nije_se_javio").length;
  const nDospeli = opt.filter((l) => jeDospeo(l, danas)).length;
  const nVruci = opt.filter((l) => POGLEDI.pozvati(l, danas) && l.temperatura === "vruc").length;
  const nTopli = opt.filter((l) => POGLEDI.pozvati(l, danas) && l.temperatura === "topao").length;
  const nazivPogleda: Record<Pogled, string> = { pozvati: "Pozvati", prioritet: "Prioritetni", dostaviti_ponudu: "Dostaviti ponudu", ponuda: "Čeka odgovor na ponudu", kupci: "Kupci", zakazani: "Zakazani pozivi", odustali: "Odustali", svi: "Svi leadovi" };

  const handleri: Handleri = { onStatus: menjajStatus, onBeleska: menjajBelesku, onDatum: menjajDatum, onPrioritet: menjajPrioritet, onZarada: menjajZaradu, onKval: menjajKvalifikaciju };

  return (
    <Shell naslov="Leadovi" uRedu={broj("pozvati")} onDodaj={() => setModal(true)} login={login}
      podnaslov={<><Sat /> · stiglo danas <b className="text-ink">{stigloDanas}</b>, juče <b className="text-ink">{stigloJuce}</b></>}
      deca={
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          <Kartica p="pozvati" ton="amber" aktivan={view === "pozvati"} onClick={setView} label="Pozvati" n={broj("pozvati")}
            sub={`${nNovi} nov${nNovi === 1 ? "" : "ih"}${nNije ? ` · ${nNije} nije se javio` : ""}${nDospeli ? ` · ${nDospeli} povratn${nDospeli === 1 ? "i" : "a"}` : ""}`}
            icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} />
          <Kartica p="prioritet" ton="red" aktivan={view === "prioritet"} onClick={setView} label="Prioritetni" n={broj("prioritet")}
            sub={`${nVruci} vruć${nVruci === 1 ? "" : "ih"} · ${nTopli} topl${nTopli === 1 ? "i" : "ih"}${nDospeli ? ` · ${nDospeli} za danas` : ""}`}
            icon={<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />} />
          <Kartica p="dostaviti_ponudu" ton="cyan" aktivan={view === "dostaviti_ponudu"} onClick={setView} label="Dostaviti ponudu" n={broj("dostaviti_ponudu")}
            icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></>} />
          <Kartica p="ponuda" ton="yellow" aktivan={view === "ponuda"} onClick={setView} label="Čeka odgovor" n={broj("ponuda")}
            icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />
          <Kartica p="kupci" ton="green" aktivan={view === "kupci"} onClick={setView} label="Kupci" n={broj("kupci")} sub={zarada > 0 ? rsd(zarada) : undefined}
            icon={<><path d="M20 6 9 17l-5-5" /></>} />
        </div>
      }>
      {demo && <Obavestenje ton="amber" naslov="Probni podaci">Supabase još nije povezan, pa se izmene ne čuvaju. Popuni <code className="rounded bg-white px-1">.env.local</code> i pokreni <code className="rounded bg-white px-1">supabase/schema.sql</code>.</Obavestenje>}
      {migracijaFali && <Obavestenje ton="red" naslov="Baza čeka migraciju">Ne čuva se: <b>{migracijaFali.sta}</b>. Pokreni <code className="rounded bg-white px-1">supabase/{migracijaFali.fajl}</code> u Supabase SQL editoru. Sve ostalo radi.</Obavestenje>}
      {greska && <Obavestenje ton="red" onClose={() => setGreska(null)}>{greska}</Obavestenje>}
      {tabelaFali && <Obavestenje ton="amber" naslov="Baza još nije podešena">Pokreni <code className="rounded bg-white px-1">supabase/schema.sql</code> u Supabase SQL editoru, pa dodaj prvi lead.</Obavestenje>}

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="h3">{nazivPogleda[view]} <span className="font-normal text-muted">({filtrirani.length})</span></h2>
          {(["zakazani", "odustali", "svi"] as Pogled[]).map((p) => (
            <button key={p} onClick={() => setView(p)} className={`text-[13px] underline-offset-4 transition-colors hover:text-ink ${view === p ? "font-semibold text-ink underline" : "text-muted"}`}>
              {nazivPogleda[p]} ({broj(p)})
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtriraj: ime, telefon, mesto…" className="inp inp-sm pl-9" />
        </div>
      </div>

      {filtrirani.length === 0 ? (
        <Card className="flex flex-col items-center p-10 text-center">
          <Logo size={40} />
          <p className="mt-4 text-sm text-muted">{opt.length === 0 ? "Još nema leadova. Dodaj prvi." : "Nema leadova za ovaj filter."}</p>
          {opt.length === 0 && <button onClick={() => setModal(true)} className="btn btn-sm mt-5">Dodaj lead</button>}
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:hidden">
            {filtrirani.map((l) => <LeadKartica key={l.id} l={l} procena={procene.get(l.id)} danas={danas} {...handleri} onEdit={() => uredi(l)} onDelete={() => obrisi(l.id)} />)}
          </div>
          <div className="hidden lg:block">
            <LeadTabela leadovi={filtrirani} procene={procene} danas={danas} {...handleri} onEdit={uredi} onDelete={obrisi} />
          </div>
        </>
      )}

      {/* plutajuće „+" na telefonu */}
      <button onClick={() => setModal(true)} aria-label="Novi lead"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-30 grid h-13 w-13 place-items-center rounded-full bg-ink text-white shadow-[0_8px_24px_rgba(19,19,21,.3)] transition-transform active:scale-95 sm:hidden" style={{ width: 52, height: 52 }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      {modal && <LeadWizard onClose={() => setModal(false)} akcija={demo ? demoSacuvaj : undefined} pocetniKorak={pocetniKorak} />}
      {izmeni && <LeadWizard lead={izmeni} onClose={() => setIzmeni(null)} akcija={demo ? demoSacuvaj : undefined} />}
    </Shell>
  );
}

type Handleri = { onStatus: (id: string, s: string) => void; onBeleska: (id: string, b: string) => void; onDatum: (id: string, d: string) => void; onPrioritet: (id: string, p: boolean) => void; onZarada: (id: string, z: string) => void; onKval: (id: string, polje: string, v: string | null) => void };

/* Gornja kartica-filter, boja ikonice po značenju */
function Kartica({ p, label, n, sub, icon, ton, aktivan, onClick }: { p: Pogled; label: string; n: number; sub?: string; icon: React.ReactNode; ton: string; aktivan: boolean; onClick: (p: Pogled) => void }) {
  return (
    <button type="button" onClick={() => onClick(p)} aria-pressed={aktivan} data-ton={ton}
      className={`kat ${aktivan ? "kat-aktivna" : ""} ${p === "pozvati" ? "col-span-2 lg:col-span-1" : ""}`}>
      <span className="kat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></span>
      <span className="min-w-0">
        <span className="kat-num">{n}</span>
        <span className="kat-label">{label}</span>
        {sub && <span className="kat-sub">{sub}</span>}
      </span>
    </button>
  );
}

/** Padajući meni ishoda obojen po značenju statusa. */
export function StatusSelect({ l, onStatus, mali }: { l: LeadRow; onStatus: (id: string, s: string) => void; mali?: boolean }) {
  const st = statusOd(l.status);
  return (
    <select value={l.status} onChange={(e) => onStatus(l.id, e.target.value)} aria-label="Ishod"
      className={`inp ${mali ? "inp-sm" : ""} min-w-0 font-semibold`} style={st ? { borderColor: st.boja, color: st.boja, background: "#fff" } : undefined}>
      {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
    </select>
  );
}

/* ---------------- Tabela (desktop) ---------------- */
function LeadTabela({ leadovi, procene, danas, onStatus, onBeleska, onDatum, onPrioritet, onZarada, onKval, onEdit, onDelete }: { leadovi: LeadRow[]; procene: Map<string, Procena>; danas: string; onEdit: (l: LeadRow) => void; onDelete: (id: string) => void } & Handleri) {
  return (
    <Card className="overflow-hidden">
      <table className="tbl">
        <thead>
          <tr>
            <th>Lead</th><th>Ishod</th><th>Šta kupuje</th><th>Za poziv</th><th>Izvor</th><th>Dodat</th><th className="text-right">Akcije</th>
          </tr>
        </thead>
        <tbody>
          {leadovi.map((l) => {
            const dospeo = jeDospeo(l, danas);
            const ima = !!l.telefon;
            const t = temperatura(l.temperatura);
            return (
              <tr key={l.id} className={dospeo ? "bg-amber-bg/40" : ""}>
                <td className="min-w-[210px]">
                  <div className="flex items-center gap-1.5">
                    <Zvezda on={!!l.prioritet} onClick={() => onPrioritet(l.id, !l.prioritet)} />
                    <Link href={`/lead/${l.id}`} className="font-semibold text-ink hover:underline">{punoIme(l)}</Link>
                    <Temperatura l={l} onKval={onKval} />
                  </div>
                  {l.telefon
                    ? <a href={telLink(l.telefon)} className="mt-0.5 block text-[13px] font-medium text-blue hover:underline">{l.telefon}</a>
                    : <span className="text-xs text-muted">bez broja</span>}
                  {(l.tip_kupca || l.rok) && <div className="mt-0.5 text-[11px] text-muted">{[l.tip_kupca && label(TIPOVI_KUPCA, l.tip_kupca), l.rok && label(ROKOVI, l.rok)].filter(Boolean).join(" · ")}</div>}
                  {l.podseti_kad && <div className="mt-1"><span className={`tag ${dospeo ? "tag-red" : "tag-violet"}`}>{dospeo ? "Dospelo" : "Zvati"} {datumKratko(l.podseti_kad)}</span></div>}
                  {t && !l.podseti_kad ? null : null}
                </td>
                <td className="w-[230px]">
                  <StatusSelect l={l} onStatus={onStatus} mali />
                  {l.status === "zvati_kasnije" && <input type="date" value={l.podseti_kad ?? ""} onChange={(e) => onDatum(l.id, e.target.value)} className="inp inp-sm mt-1.5 w-full" aria-label="Kog datuma pozvati" />}
                  {l.status === "zatvoren" && <Zarada id={l.id} vrednost={l.zarada_rsd} onSave={onZarada} mala />}
                  {l.status === "propao" && <Razlog l={l} onKval={onKval} mala />}
                  <Beleska id={l.id} vrednost={l.ishod_beleska} onSave={onBeleska} mala />
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {l.proizvod ? <span className="tag tag-navy">{label(SVI_PROIZVODI, l.proizvod).replace(/\s*\(.*\)$/, "")}</span> : <span className="text-muted">—</span>}
                    {obuhvatKratko(l.obuhvat) && <span className={`tag ${l.obuhvat === "kljuc_u_ruke" ? "tag-accent" : ""}`}>{obuhvatKratko(l.obuhvat)}</span>}
                  </div>
                  <ProcenaOznaka p={procene.get(l.id)} l={l} />
                </td>
                <td className="max-w-[340px]">
                  <ZaPoziv l={l} />
                  {fali(l).length > 0 && <div className="mt-1"><span className="tag tag-red max-w-full whitespace-normal text-left leading-snug">Nepotpun: {fali(l).join(", ")}</span></div>}
                  {l.info ? <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-snug text-text/85">{l.info}</p> : null}
                </td>
                <td className="whitespace-nowrap">{l.izvor ? <span className="tag tag-gold">{label(SVI_IZVORI, l.izvor)}</span> : <span className="text-muted">—</span>}</td>
                <td className="whitespace-nowrap text-xs text-muted">
                  <div>{pre(l.created_at)}</div>
                  {uIshodu(l) && <div>u ishodu {uIshodu(l)}</div>}
                </td>
                <td className="whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <MiniAkcija href={telLink(l.telefon)} ima={ima} title="Pozovi" primarno icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} />
                    <MiniAkcija href={viberLink(l.telefon)} ima={ima} title="Viber" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
                    <MiniAkcija href={waLink(l.telefon)} ima={ima} title="WhatsApp" blank icon={<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.5A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />} />
                    <Link href={`/lead/${l.id}`} className="btn btn-sm btn-ghost ml-1">Otvori</Link>
                    <button onClick={() => onEdit(l)} className="btn btn-sm btn-ghost btn-icon" aria-label="Izmeni" title="Izmeni">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    </button>
                    <button onClick={() => { if (confirm(`Obrisati lead — ${punoIme(l)}?`)) onDelete(l.id); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-bg hover:text-red" aria-label="Obriši" title="Obriši">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
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
  const cls = `grid h-8 w-8 place-items-center rounded-lg border transition-colors ${primarno ? "border-green bg-green text-white hover:bg-[#15803d]" : "border-line-strong bg-white text-ink hover:border-ink"} ${ima ? "" : "pointer-events-none opacity-40"}`;
  const svg = <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>;
  if (!ima) return <span className={cls} title={title}>{svg}</span>;
  return <a href={href} title={title} target={blank ? "_blank" : undefined} rel={blank ? "noreferrer" : undefined} className={cls}>{svg}</a>;
}

/* ---------------- Kartica leada (telefon) ---------------- */
function LeadKartica({ l, procena, danas, onStatus, onBeleska, onDatum, onPrioritet, onZarada, onKval, onEdit, onDelete }: { l: LeadRow; procena?: Procena; danas: string; onEdit: () => void; onDelete: () => void } & Handleri) {
  const dospeo = jeDospeo(l, danas);
  const ima = !!l.telefon;
  const st = statusOd(l.status);
  return (
    <Card className={`p-3.5 ${dospeo ? "card-due" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <Zvezda on={!!l.prioritet} onClick={() => onPrioritet(l.id, !l.prioritet)} />
            <Link href={`/lead/${l.id}`} className="h3 truncate">{punoIme(l)}</Link>
            <Temperatura l={l} onKval={onKval} />
          </div>
          {l.telefon
            ? <a href={telLink(l.telefon)} className="text-[14px] font-medium text-blue">{l.telefon}</a>
            : <span className="text-sm text-muted">bez broja</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {st && <span className={`tag tag-${st.ton}`}>{st.l}</span>}
          <button onClick={() => { if (confirm(`Obrisati lead — ${punoIme(l)}?`)) onDelete(); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-bg hover:text-red" aria-label="Obriši">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
          </button>
        </div>
      </div>

      <ZaPoziv l={l} />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {l.tip_kupca && <span className="tag">{label(TIPOVI_KUPCA, l.tip_kupca)}</span>}
        {l.rok && <span className="tag">{label(ROKOVI, l.rok)}</span>}
        {l.status === "propao" && l.razlog_odustajanja && <span className="tag tag-grey">Razlog: {label(RAZLOZI, l.razlog_odustajanja)}</span>}
        {fali(l).length > 0 && <span className="tag tag-red max-w-full whitespace-normal text-left leading-snug" title={"Fali: " + fali(l).join(", ")}>Nepotpun: {fali(l).join(", ")}</span>}
        {l.proizvod && <span className="tag tag-navy">{label(SVI_PROIZVODI, l.proizvod).replace(/\s*\(.*\)$/, "")}</span>}
        {obuhvatKratko(l.obuhvat) && <span className={`tag ${l.obuhvat === "kljuc_u_ruke" ? "tag-accent" : ""}`}>{obuhvatKratko(l.obuhvat)}</span>}
        {l.izvor && <span className="tag tag-gold">{label(SVI_IZVORI, l.izvor)}</span>}
        {l.podseti_kad && <span className={`tag ${dospeo ? "tag-red" : "tag-violet"}`}>{dospeo ? "Dospelo" : "Zvati"} {datumKratko(l.podseti_kad)}</span>}
        <ProcenaOznaka p={procena} l={l} />
      </div>

      {l.info && <p className="mt-2 whitespace-pre-wrap text-[13px] text-text/85">{l.info}</p>}

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <Akcija href={telLink(l.telefon)} ima={ima} label="Pozovi" primarno icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />} />
        <Akcija href={viberLink(l.telefon)} ima={ima} label="Viber" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
        <Akcija href={waLink(l.telefon)} ima={ima} label="WhatsApp" blank icon={<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.5A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />} />
        <Akcija href={smsLink(l.telefon)} ima={ima} label="SMS" icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5" />} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <span className="micro shrink-0">Ishod</span>
        <StatusSelect l={l} onStatus={onStatus} mali />
      </div>
      {l.status === "zvati_kasnije" && (
        <label className="mt-2 flex items-center gap-2">
          <span className="micro shrink-0">Kad</span>
          <input type="date" value={l.podseti_kad ?? ""} onChange={(e) => onDatum(l.id, e.target.value)} className="inp inp-sm min-w-0 flex-1" aria-label="Kog datuma pozvati" />
        </label>
      )}
      {l.status === "zatvoren" && <Zarada id={l.id} vrednost={l.zarada_rsd} onSave={onZarada} />}
      {l.status === "propao" && <Razlog l={l} onKval={onKval} />}
      <Beleska id={l.id} vrednost={l.ishod_beleska} onSave={onBeleska} />
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span>dodat {pre(l.created_at)}{uIshodu(l) ? ` · u ishodu ${uIshodu(l)}` : ""}</span>
        <span className="flex gap-1.5">
          <button onClick={onEdit} className="btn btn-sm btn-ghost">Izmeni</button>
          <Link href={`/lead/${l.id}`} className="btn btn-sm">Otvori</Link>
        </span>
      </div>
    </Card>
  );
}

/* Link ka kalkulatoru sa merama leada (iznos se ne prikazuje, samo redosled). */
export function ProcenaOznaka({ p, l }: { p?: Procena; l: LeadRow }) {
  const href = `/kalkulator?lead=${l.id}`;
  const u = p?.ulaz;
  const opis = u ? `${u.duzina} m · polje ${u.visinaPolja} · stub ${u.visinaStuba} · razmak ${u.razmak} · ${bojaNaziv(u.boja)}` : "bez mera, upisuju se ručno";
  const istaknuto = l.status === "dostaviti_ponudu";
  return (
    <Link href={href} title={`Otvori u kalkulatoru sa ovim leadom: ${opis}${p?.pretpostavke.length ? ` (pretpostavljeno: ${p.pretpostavke.join(", ")})` : ""}`}
      className={`mt-1 inline-flex items-center gap-1 text-[12px] ${istaknuto ? "tag tag-cyan font-semibold" : "text-muted underline-offset-2 hover:text-ink hover:underline"}`}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M12 11h2M8 15h2M12 15h2M16 15v3" /></svg>
      Kalkulator
    </Link>
  );
}

/* Temperatura kao tačka: tap kruži vruć → topao → hladan. Boja po značenju (crveno / narandžasto / plavo). */
export function Temperatura({ l, onKval }: { l: LeadRow; onKval: (id: string, polje: string, v: string | null) => void }) {
  const t = temperatura(l.temperatura);
  const sledeca = () => { const i = TEMPERATURE.findIndex((x) => x.v === l.temperatura); onKval(l.id, "temperatura", TEMPERATURE[(i + 1) % TEMPERATURE.length].v); };
  return (
    <button type="button" onClick={sledeca} title={t ? `${t.l}: ${t.opis} (tap menja)` : "Kvalitet leada: tap postavlja"}
      className={`tag ${t ? `tag-${t.ton}` : "tag-grey"} h-[22px] px-2 text-[11px]`}>
      <span className="tag-dot" />{t?.l ?? "Kvalitet?"}
    </button>
  );
}

/* Razlog odustajanja: obavezan kad je „Odustao" (crveno dok se ne izabere). */
export function Razlog({ l, onKval, mala }: { l: LeadRow; onKval: (id: string, polje: string, v: string | null) => void; mala?: boolean }) {
  const fali = !l.razlog_odustajanja;
  return (
    <label className={`flex items-center gap-2 ${mala ? "mt-1.5" : "mt-2"}`}>
      <span className={`micro shrink-0 ${fali ? "text-red" : ""}`}>Zašto</span>
      <select value={l.razlog_odustajanja ?? ""} onChange={(e) => onKval(l.id, "razlog_odustajanja", e.target.value || null)} className={`inp inp-sm min-w-0 flex-1 ${fali ? "border-red" : ""}`} aria-label="Razlog odustajanja">
        <option value="">Izaberi razlog…</option>
        {RAZLOZI.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
      </select>
    </label>
  );
}

export function Zvezda({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={on ? "Skini prioritet" : "Označi kao prioritet"} title={on ? "Prioritet" : "Označi kao prioritet"}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${on ? "text-amber" : "text-line-strong hover:text-amber"}`}>
      <svg viewBox="0 0 24 24" width="17" height="17" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    </button>
  );
}

export function Zarada({ id, vrednost, onSave, mala }: { id: string; vrednost: number | null | undefined; onSave: (id: string, z: string) => void; mala?: boolean }) {
  const poc = vrednost == null ? "" : String(vrednost);
  const [t, setT] = useState(poc);
  const [zadnje, setZadnje] = useState(poc);
  if (poc !== zadnje) { setZadnje(poc); setT(poc); }
  const sacuvaj = () => { if (t.trim() !== poc) onSave(id, t); };
  return (
    <label className={`flex items-center gap-2 ${mala ? "mt-1.5" : "mt-2"}`}>
      <span className="micro shrink-0">Zarada</span>
      <input inputMode="numeric" value={t} onChange={(e) => setT(e.target.value)} onBlur={sacuvaj}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder="0" className="inp inp-sm min-w-0 flex-1 text-right tabular-nums" aria-label="Zarada u dinarima" />
      <span className="text-xs text-muted">RSD</span>
    </label>
  );
}

export function Beleska({ id, vrednost, onSave, mala }: { id: string; vrednost: string | null; onSave: (id: string, b: string) => void; mala?: boolean }) {
  const [t, setT] = useState(vrednost ?? "");
  const [zadnje, setZadnje] = useState(vrednost ?? "");
  if ((vrednost ?? "") !== zadnje) { setZadnje(vrednost ?? ""); setT(vrednost ?? ""); }
  const sacuvaj = () => { if (t.trim() !== (vrednost ?? "").trim()) onSave(id, t); };
  return (
    <textarea value={t} onChange={(e) => setT(e.target.value)} onBlur={sacuvaj}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
      rows={1} placeholder="Beleška posle poziva…"
      className={`inp field-sizing-content resize-none border-dashed bg-wash/70 text-[13px] leading-snug placeholder:text-muted/70 focus:bg-white ${mala ? "mt-1.5 min-h-[32px] px-2.5 py-1.5" : "mt-2.5 min-h-[38px] px-3 py-2"}`} />
  );
}

function Akcija({ href, ima, label, icon, primarno, blank }: { href: string; ima: boolean; label: string; icon: React.ReactNode; primarno?: boolean; blank?: boolean }) {
  const cls = `akcija ${primarno ? "akcija-primary" : ""} ${ima ? "" : "akcija-off"}`;
  const inner = (<><svg className="akcija-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>{label}</>);
  if (!ima) return <span className={cls}>{inner}</span>;
  return <a href={href} target={blank ? "_blank" : undefined} rel={blank ? "noreferrer" : undefined} className={cls}>{inner}</a>;
}

/* Jedan red pred poziv: lokacija · dužina · model, + sklopivi detalji. */
export function ZaPoziv({ l, otvoriOdmah }: { l: LeadRow; otvoriOdmah?: boolean }) {
  const [otvoreno, setOtvoreno] = useState(!!otvoriOdmah);
  const glavno = [l.lokacija, l.duzina_m != null ? `${l.duzina_m} m` : null, modelKratko(l.ispuna), modelLabel(l.detalji?.model)].filter(Boolean);
  const d = l.detalji ?? {};
  const det = DETALJI.filter(({ k }) => d[k] && k !== "model").map(({ k, l: naziv, tip }) => ({ naziv, v: d[k] + (tip === "m" ? " m" : tip === "kom" ? " kom" : tip === "cm" ? " cm" : tip === "kapije" ? " m" : "") }));
  if (!glavno.length && !det.length) return null;
  return (
    <div className="mt-1.5 text-[13px] leading-snug">
      {glavno.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-1.5 text-text">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <span className="font-medium">{glavno.join(" · ")}</span>
        </div>
      )}
      {det.length > 0 && (
        <>
          {!otvoriOdmah && <button type="button" onClick={() => setOtvoreno((o) => !o)} className="mt-0.5 text-xs text-muted underline-offset-2 hover:text-ink hover:underline">{otvoreno ? "Sakrij detalje" : `Detalji za ponudu (${det.length})`}</button>}
          {otvoreno && (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-wash px-3 py-2 text-xs">
              {det.map((x) => (<Fragment key={x.naziv}><dt className="text-muted">{x.naziv}</dt><dd className="text-text">{x.v}</dd></Fragment>))}
            </dl>
          )}
        </>
      )}
    </div>
  );
}
