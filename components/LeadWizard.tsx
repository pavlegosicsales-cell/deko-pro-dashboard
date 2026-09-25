"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import type { LeadRow } from "@/components/LeadView";
import { ArrowIco } from "@/components/ui";
import { STATUSI, IZVORI, OBUHVATI, PROIZVODI, MODELI_OGRADE, MODELI, BOJE, DETALJI, DRUGO, staFali, TEMPERATURE, TIPOVI_KUPCA, ROKOVI, RAZLOZI, predloziTemperaturu } from "@/lib/opcije";
import { dodajLead, izmeniLead, type LeadState } from "@/app/leadovi/actions";

/*
  Wizard za unos leada (Lukin spisak informacija pred poziv), korak po korak da stane na telefon:
    1 Kontakt      ime, prezime, telefon, lokacija, izvor
    2 Šta kupuje   obuhvat: samo blokovi / blokovi + prevoz / ključ u ruke   (tap = dalje)
    3 Ograda       PRETPOSTAVLJA ogradu (Luka: 90% upita). dužina*, ispuna* (bez panela /
                   + paneli), model, boja. Sitan prekidač „Nije ograda?" (potporni zid /
                   oblaganje / drugo) zameni pitanja sa: boja, količina, opis.
    4 Za Luku      poželjni detalji + informacije pred poziv (+ ishod kod izmene) + šta fali
  Grana je „šta gradi", ne obuhvat: dužina/ispuna/model se traže za ogradu bez obzira
  kako kupuje. Obuhvat samo dodaje „pristup za kamion" kad je uključen prevoz.
*/

type Akcija = (p: LeadState, fd: FormData) => Promise<LeadState>;
const pocetno: LeadState = { ok: false };

type V = {
  ime: string; prezime: string; telefon: string; lokacija: string; izvor: string;
  obuhvat: string; proizvod: string; proizvod_tekst: string;
  duzina_m: string; ispuna: string;
  d: Record<string, string>;
  info: string; status: string; podseti_kad: string; ishod_beleska: string;
  temperatura: string; tip_kupca: string; rok: string; razlog_odustajanja: string;
};

const izLeada = (l?: LeadRow): V => {
  const poznat = !l?.proizvod || PROIZVODI.some((o) => o.v === l.proizvod);
  return {
    ime: l?.ime ?? "", prezime: l?.prezime ?? "", telefon: l?.telefon ?? "", lokacija: l?.lokacija ?? "", izvor: l?.izvor ?? "",
    obuhvat: l?.obuhvat ?? "", proizvod: l ? (poznat ? l.proizvod ?? "" : DRUGO) : "ograda", proizvod_tekst: poznat ? "" : l?.proizvod ?? "",
    duzina_m: l?.duzina_m != null ? String(l.duzina_m) : "", ispuna: l?.ispuna ?? "",
    d: { ...(l?.detalji as Record<string, string> | null | undefined ?? {}) },
    info: l?.info ?? "", status: l?.status ?? "nov", podseti_kad: l?.podseti_kad ?? "", ishod_beleska: l?.ishod_beleska ?? "",
    temperatura: l?.temperatura ?? "", tip_kupca: l?.tip_kupca ?? "", rok: l?.rok ?? "", razlog_odustajanja: l?.razlog_odustajanja ?? "",
  };
};

export function LeadWizard({ lead, onClose, akcija, pocetniKorak = 0 }: { lead?: LeadRow; onClose: () => void; akcija?: Akcija; pocetniKorak?: number }) {
  const [state, formAction, pending] = useActionState(akcija ?? (lead ? izmeniLead : dodajLead), pocetno);
  const [, start] = useTransition();
  const [v, setV] = useState<V>(() => izLeada(lead));
  const [korak, setKorak] = useState(pocetniKorak);
  const set = (k: keyof V, val: string) => setV((s) => ({ ...s, [k]: val }));
  const setD = (k: string, val: string) => setV((s) => ({ ...s, d: { ...s.d, [k]: val } }));

  useEffect(() => { if (state.ok) onClose(); }, [state.ok, onClose]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  const ograda = v.proizvod === "ograda";
  const prevoz = v.obuhvat === "materijal_prevoz" || v.obuhvat === "kljuc_u_ruke";
  const koraci = useMemo(() => ["Kontakt", "Šta kupuje", ograda ? "Ograda" : "Materijal", "Za Luku"], [ograda]);
  const zadnji = korak === koraci.length - 1;

  // šta fali od Lukinog obaveznog spiska (isti kriterijum kao oznaka „Nepotpun" na kartici)
  const fali = staFali({
    ime: v.ime, prezime: v.prezime, telefon: v.telefon, lokacija: v.lokacija, obuhvat: v.obuhvat,
    proizvod: v.proizvod === DRUGO ? v.proizvod_tekst : v.proizvod,
    duzina_m: v.duzina_m ? parseFloat(v.duzina_m.replace(",", ".")) || null : null, ispuna: v.ispuna,
  });

  const predlog = predloziTemperaturu({ rok: v.rok, duzina_m: v.duzina_m ? parseFloat(v.duzina_m.replace(",", ".")) || null : null, lokacija: v.lokacija, obuhvat: v.obuhvat });
  const temp = v.temperatura || predlog; // dok Pavle ne izabere ručno, važi predlog

  const sacuvaj = () => {
    const fd = new FormData();
    if (lead) { fd.set("id", lead.id); fd.set("prethodni_status", lead.status); }
    for (const k of ["ime", "prezime", "telefon", "lokacija", "izvor", "obuhvat", "proizvod", "proizvod_tekst", "duzina_m", "ispuna", "info", "status", "podseti_kad", "ishod_beleska", "temperatura", "tip_kupca", "rok", "razlog_odustajanja"] as const) fd.set(k, v[k]);
    fd.set("temperatura", temp);
    for (const { k } of DETALJI) if (v.d[k]) fd.set("d_" + k, v.d[k]);
    start(() => formAction(fd));
  };

  const dalje = () => setKorak((k) => Math.min(k + 1, koraci.length - 1));
  const nazad = () => setKorak((k) => Math.max(k - 1, 0));
  const izaberi = (k: keyof V, val: string) => { set(k, val); setTimeout(dalje, 120); };

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={onClose}>
      <div className="rise flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[15px]" onClick={(e) => e.stopPropagation()}>
        {/* Navy zaglavlje + tačkice napretka (klik na tačkicu skače na korak) */}
        <div className="blueprint bg-navy px-5 pb-4 pt-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="nav-sub">{lead ? "Izmena" : "Novi lead"} · korak {korak + 1} od {koraci.length}</div>
              <h2 className="h-display mt-0.5 text-[20px] text-white">{koraci[korak]}</h2>
            </div>
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Zatvori">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Koraci">
            {koraci.map((n, i) => (
              <button key={n} type="button" role="tab" aria-selected={i === korak} aria-label={n} onClick={() => setKorak(i)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < korak ? "bg-gold" : i === korak ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {korak === 0 && (
            <div className="space-y-4">
              <Pitaj>Ime i mesto gde se radi, plus telefon za Luku.</Pitaj>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ime"><input value={v.ime} onChange={(e) => set("ime", e.target.value)} autoFocus className="inp" /></Field>
                <Field label="Prezime"><input value={v.prezime} onChange={(e) => set("prezime", e.target.value)} className="inp" /></Field>
              </div>
              <Field label="Telefon"><input value={v.telefon} onChange={(e) => set("telefon", e.target.value)} inputMode="tel" className="inp" placeholder="06x xxx xxxx" /></Field>
              <Field label="Lokacija (gde se radi)"><input value={v.lokacija} onChange={(e) => set("lokacija", e.target.value)} className="inp" placeholder="Mesto, opština" /></Field>
              <Field label="Odakle je stigao">
                <div className="flex flex-wrap gap-1.5">
                  {IZVORI.map((o) => <Cip key={o.v} on={v.izvor === o.v} onClick={() => set("izvor", o.v)}>{o.l}</Cip>)}
                </div>
              </Field>
            </div>
          )}

          {korak === 1 && (
            <div className="space-y-2.5">
              <Pitaj>„Da li vas zanima samo materijal, ili i prevoz i ugradnja?“</Pitaj>
              {OBUHVATI.filter((o) => o.v !== "nepoznato").map((o) => (
                <Kartica key={o.v} on={v.obuhvat === o.v} onClick={() => izaberi("obuhvat", o.v)} naslov={o.k} opis={o.l} />
              ))}
              <Kartica on={v.obuhvat === "nepoznato"} onClick={() => izaberi("obuhvat", "nepoznato")} naslov="Još ne zna" opis="Luka će mu objasniti opcije" mala />
            </div>
          )}

          {korak === 2 && ograda && (
            <div className="space-y-4">
              <Pitaj>„Kakvu vrstu ograde želite?“ Ako kaže da ne zida ogradu, prebaci ovde:</Pitaj>
              <StaGradi v={v} set={set} />
              <Field label="Ukupna dužina ograde (m)" obavezno>
                <input value={v.duzina_m} onChange={(e) => set("duzina_m", e.target.value)} inputMode="decimal" autoFocus className="inp" placeholder="npr. 28" />
              </Field>
              <Field label="Ograda sa panelima ili bez" obavezno>
                <div className="grid grid-cols-2 gap-2">
                  {MODELI_OGRADE.map((o) => <Cip key={o.v} on={v.ispuna === o.v} onClick={() => set("ispuna", o.v)} velik>{o.l}</Cip>)}
                </div>
              </Field>
              <Field label="Model (ako zna)">
                <div className="flex flex-wrap gap-1.5">
                  {MODELI.map((o) => <Cip key={o.v} on={v.d.model === o.v} onClick={() => setD("model", v.d.model === o.v ? "" : o.v)}>{o.l}</Cip>)}
                </div>
              </Field>
              <Field label="Boja bloka (ako zna)">
                <select value={v.d.boja ?? ""} onChange={(e) => setD("boja", e.target.value)} className="inp">
                  <option value="">—</option>
                  {BOJE.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>
          )}

          {korak === 2 && !ograda && (
            <div className="space-y-4">
              <Pitaj>„Šta tačno radite i koliko vam materijala treba?“</Pitaj>
              <StaGradi v={v} set={set} />
              {v.proizvod === DRUGO && (
                <input value={v.proizvod_tekst} onChange={(e) => set("proizvod_tekst", e.target.value)} autoFocus className="inp" placeholder="Šta gradi? npr. pomoćni objekat, letnja kuhinja…" />
              )}
              <Field label="Boja bloka (ako zna)">
                <select value={v.d.boja ?? ""} onChange={(e) => setD("boja", e.target.value)} className="inp">
                  <option value="">—</option>
                  {BOJE.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Količina (blokova, m² ili m)">
                <input value={v.d.kolicina ?? ""} onChange={(e) => setD("kolicina", e.target.value)} className="inp" placeholder="npr. 300 kom ili 35 m²" />
              </Field>
              <Field label="Šta tačno radi (mere, opis)">
                <textarea value={v.d.spec_materijala ?? ""} onChange={(e) => setD("spec_materijala", e.target.value)} rows={3} className="inp" placeholder="npr. potporni zid 12 m, visina do 1 m" />
              </Field>
            </div>
          )}

          {korak === 3 && (
            <div className="space-y-4">
              <Pitaj>„Kad vam odgovara da vas Luka pozove?“ Sve ostalo je bonus za ponudu.</Pitaj>
              {fali.length > 0 ? (
                <div className="rounded-[10px] border border-warn/30 bg-warn/5 px-3 py-2.5 text-sm">
                  <b className="text-warn">Nepotpun za Luku.</b> Fali: {fali.join(", ")}. Može da se sačuva i dopuni kasnije.
                </div>
              ) : (
                <div className="rounded-[10px] border border-ok/30 bg-ok/5 px-3 py-2.5 text-sm text-ok">Ima sve što Luki treba pred poziv.</div>
              )}

              <Field label="Kad bi radio">
                <div className="flex flex-wrap gap-1.5">
                  {ROKOVI.map((o) => <Cip key={o.v} on={v.rok === o.v} onClick={() => set("rok", v.rok === o.v ? "" : o.v)}>{o.l}</Cip>)}
                </div>
              </Field>

              <Field label={v.temperatura ? "Kvalitet leada" : "Kvalitet leada (predlog iz podataka, promeni ako misliš drugačije)"}>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPERATURE.map((t) => (
                    <button key={t.v} type="button" onClick={() => set("temperatura", t.v)} aria-pressed={temp === t.v} title={t.opis}
                      className={`rounded-[10px] border px-2 py-2 text-center text-sm font-semibold transition-colors ${temp === t.v ? "text-white" : "border-line bg-white text-ink hover:border-accent"}`}
                      style={temp === t.v ? { background: t.boja, borderColor: t.boja } : undefined}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Tip kupca (ako možeš da proceniš; Luka doteruje posle poziva)">
                <div className="flex flex-wrap gap-1.5">
                  {TIPOVI_KUPCA.map((o) => <Cip key={o.v} on={v.tip_kupca === o.v} onClick={() => set("tip_kupca", v.tip_kupca === o.v ? "" : o.v)}>{o.l}</Cip>)}
                </div>
                {v.tip_kupca && <p className="mt-1 text-xs text-muted">{TIPOVI_KUPCA.find((o) => o.v === v.tip_kupca)?.opis}</p>}
              </Field>

              <Field label="Informacije pred poziv">
                <textarea value={v.info} onChange={(e) => set("info", e.target.value)} rows={3} className="inp" placeholder="Kad da ga zove, šta ga muči, ko odlučuje…" />
              </Field>

              <details className="rounded-[10px] border border-dashed border-line" open={Object.entries(v.d).some(([k, x]) => x && !["model", "boja", "kolicina", "spec_materijala"].includes(k))}>
                <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-ink">Detalji za ponudu <span className="font-normal text-muted">(poželjno)</span></summary>
                <div className="grid grid-cols-2 gap-3 border-t border-line px-3 py-3">
                  {DETALJI.filter(({ k }) => !["model", "boja", "kolicina"].includes(k) && (k !== "pristup" || prevoz) && (ograda || !["visina_stuba", "visina_polja", "razmak_stubova"].includes(k))).map(({ k, l, tip }) => (
                    <Field key={k} label={l + (tip === "m" ? " (m)" : tip === "kom" ? " (kom)" : "")} puno={tip === "tekst"}>
                      {tip === "tekst"
                        ? <input value={v.d[k] ?? ""} onChange={(e) => setD(k, e.target.value)} className="inp inp-sm" />
                        : <input value={v.d[k] ?? ""} onChange={(e) => setD(k, e.target.value)} inputMode="decimal" className="inp inp-sm" />}
                    </Field>
                  ))}
                </div>
              </details>

              {lead && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ishod">
                      <select value={v.status} onChange={(e) => set("status", e.target.value)} className="inp">
                        {STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                      </select>
                    </Field>
                    <Field label="Pozvati kog datuma"><input type="date" value={v.podseti_kad} onChange={(e) => set("podseti_kad", e.target.value)} className="inp" /></Field>
                  </div>
                  {v.status === "propao" && (
                    <Field label="Zašto je odustao" obavezno>
                      <select value={v.razlog_odustajanja} onChange={(e) => set("razlog_odustajanja", e.target.value)} className="inp">
                        <option value="">—</option>
                        {RAZLOZI.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                      </select>
                    </Field>
                  )}
                  <Field label="Beleška posle poziva"><textarea value={v.ishod_beleska} onChange={(e) => set("ishod_beleska", e.target.value)} rows={2} className="inp" /></Field>
                </>
              )}

              {state.msg && !state.ok && <p className="text-sm font-medium text-danger">{state.msg}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line bg-wash px-5 py-3">
          {korak > 0
            ? <button type="button" onClick={nazad} className="btn btn-sm btn-ghost btn-plain">Nazad</button>
            : <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-plain">Otkaži</button>}
          {zadnji
            ? <button type="button" onClick={sacuvaj} disabled={pending} className="btn btn-sm">{pending ? "Čuvam…" : lead ? "Sačuvaj" : "Dodaj lead"}<ArrowIco /></button>
            : <button type="button" onClick={dalje} className="btn btn-sm">Dalje<ArrowIco /></button>}
        </div>
      </div>
    </div>
  );
}

/* Sitan podsetnik šta pitati kupca u prepisci (Lukine formulacije). */
function Pitaj({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] bg-wash px-3 py-2 text-[13px] leading-snug text-muted">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-gold-deep"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      <span><b className="font-semibold text-ink">Pitaj kupca:</b> {children}</span>
    </p>
  );
}

/* „Šta gradi" kao sitan prekidač na vrhu koraka: pretpostavka je ograda, ostalo je izuzetak. */
function StaGradi({ v, set }: { v: V; set: (k: keyof V, val: string) => void }) {
  const opcije = [...PROIZVODI.map((o) => ({ v: o.v, l: o.l })), { v: DRUGO, l: "Drugo" }];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
      <span className="text-muted">Gradi:</span>
      {opcije.map((o) => <Cip key={o.v} on={v.proizvod === o.v} onClick={() => set("proizvod", o.v)}>{o.l}</Cip>)}
    </div>
  );
}

/* Velika kartica-izbor (tap = izbor). */
function Kartica({ naslov, opis, on, onClick, mala }: { naslov: string; opis?: string; on: boolean; onClick: () => void; mala?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`flex w-full items-center justify-between gap-3 rounded-[10px] border text-left transition-colors ${mala ? "px-3 py-2.5" : "px-4 py-3.5"} ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-accent hover:bg-wash"}`}>
      <span className="min-w-0">
        <span className={`block font-semibold ${mala ? "text-sm" : "text-[15px]"}`}>{naslov}</span>
        {opis && <span className={`block text-xs ${on ? "text-white/70" : "text-muted"}`}>{opis}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-gold bg-gold text-navy" : "border-line text-transparent"}`}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </span>
    </button>
  );
}

/* Čip-izbor (manji, u redu). */
function Cip({ children, on, onClick, velik }: { children: React.ReactNode; on: boolean; onClick: () => void; velik?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`rounded-full border text-center font-medium transition-colors ${velik ? "px-3 py-2.5 text-sm" : "px-3 py-1.5 text-[13px]"} ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-accent"}`}>
      {children}
    </button>
  );
}

function Field({ label, children, obavezno, puno }: { label: string; children: React.ReactNode; obavezno?: boolean; puno?: boolean }) {
  return (
    <label className={`field ${puno ? "col-span-2" : ""}`}>
      <span>{label}{obavezno && <span className="text-warn"> *</span>}</span>
      {children}
    </label>
  );
}
