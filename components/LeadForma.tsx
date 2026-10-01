"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { LeadRow } from "@/components/LeadView";
import { STATUSI, IZVORI, OBUHVATI, PROIZVODI, MODELI_OGRADE, MODELI, BOJE, DETALJI, DRUGO, TEMPERATURE, TIPOVI_KUPCA, ROKOVI, RAZLOZI } from "@/lib/opcije";
import { izmeniLead, type LeadState } from "@/app/leadovi/actions";

/*
  Jednostavna forma za izmenu već unetog leada (Pavle, 01.10.2026.: wizard je za unos, izmena mora biti
  jednostavnija). Sva polja na jednoj strani, grupisana; čuva istom server akcijom kao wizard (izmeniLead),
  pa su ključevi polja isti.
*/
const pocetno: LeadState = { ok: false };

export function LeadForma({ lead, onGotovo, onOtkazi }: { lead: LeadRow; onGotovo: () => void; onOtkazi: () => void }) {
  const [state, formAction, pending] = useActionState(izmeniLead, pocetno);
  const [, start] = useTransition();
  const poznat = !lead.proizvod || PROIZVODI.some((o) => o.v === lead.proizvod);
  const [v, setV] = useState({
    ime: lead.ime ?? "", prezime: lead.prezime ?? "", telefon: lead.telefon ?? "", lokacija: lead.lokacija ?? "", izvor: lead.izvor ?? "",
    obuhvat: lead.obuhvat ?? "", proizvod: poznat ? lead.proizvod ?? "ograda" : DRUGO, proizvod_tekst: poznat ? "" : lead.proizvod ?? "",
    duzina_m: lead.duzina_m != null ? String(lead.duzina_m) : "", ispuna: lead.ispuna ?? "",
    d: { ...((lead.detalji as Record<string, string> | null | undefined) ?? {}) } as Record<string, string>,
    info: lead.info ?? "", status: lead.status, podseti_kad: lead.podseti_kad ?? "", ishod_beleska: lead.ishod_beleska ?? "",
    temperatura: lead.temperatura ?? "", tip_kupca: lead.tip_kupca ?? "", rok: lead.rok ?? "", razlog_odustajanja: lead.razlog_odustajanja ?? "",
  });
  type K = keyof typeof v;
  const set = (k: K, val: string) => setV((s) => ({ ...s, [k]: val }));
  const setD = (k: string, val: string) => setV((s) => ({ ...s, d: { ...s.d, [k]: val } }));
  useEffect(() => { if (state.ok) onGotovo(); }, [state.ok, onGotovo]);

  const ograda = v.proizvod === "ograda";
  const prevoz = v.obuhvat === "materijal_prevoz" || v.obuhvat === "kljuc_u_ruke";
  const sacuvaj = () => {
    const fd = new FormData();
    fd.set("id", lead.id); fd.set("prethodni_status", lead.status);
    for (const k of ["ime", "prezime", "telefon", "lokacija", "izvor", "obuhvat", "proizvod", "proizvod_tekst", "duzina_m", "ispuna", "info", "status", "podseti_kad", "ishod_beleska", "temperatura", "tip_kupca", "rok", "razlog_odustajanja"] as const) fd.set(k, v[k]);
    if (!ograda) { fd.set("duzina_m", ""); fd.set("ispuna", ""); }
    for (const { k } of DETALJI) if (v.d[k]) fd.set("d_" + k, v.d[k]);
    start(() => formAction(fd));
  };


  return (
    <div className="card mb-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="h3">Izmeni podatke</h2>
        <span className="text-[12px] text-muted">Sve na jednoj strani. Zvezdica = Luki obavezno pred poziv.</span>
      </div>

      <Grupa naslov="Kontakt">
        <F l="Ime" ob><input value={v.ime} onChange={(e) => set("ime", e.target.value)} className="inp inp-sm" /></F>
        <F l="Prezime"><input value={v.prezime} onChange={(e) => set("prezime", e.target.value)} className="inp inp-sm" /></F>
        <F l="Telefon" ob><input value={v.telefon} onChange={(e) => set("telefon", e.target.value)} inputMode="tel" className="inp inp-sm" /></F>
        <F l="Lokacija (gde se radi)" ob><input value={v.lokacija} onChange={(e) => set("lokacija", e.target.value)} className="inp inp-sm" /></F>
        <F l="Odakle je stigao"><Sel v={v.izvor} onChange={(x) => set("izvor", x)} opcije={IZVORI} /></F>
      </Grupa>

      <Grupa naslov="Šta kupuje">
        <F l="Obuhvat" ob><Sel v={v.obuhvat} onChange={(x) => set("obuhvat", x)} opcije={OBUHVATI} /></F>
        <F l="Šta gradi" ob><select value={v.proizvod} onChange={(e) => set("proizvod", e.target.value)} className="inp inp-sm">{PROIZVODI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}<option value={DRUGO}>Drugo</option></select></F>
        {v.proizvod === DRUGO && <F l="Šta tačno" puno><input value={v.proizvod_tekst} onChange={(e) => set("proizvod_tekst", e.target.value)} className="inp inp-sm" /></F>}
        {ograda && <>
          <F l="Dužina ograde (m)" ob><input value={v.duzina_m} onChange={(e) => set("duzina_m", e.target.value)} inputMode="decimal" className="inp inp-sm" /></F>
          <F l="Paneli" ob><Sel v={v.ispuna} onChange={(x) => set("ispuna", x)} opcije={MODELI_OGRADE} /></F>
          <F l="Model"><select value={v.d.model ?? ""} onChange={(e) => setD("model", e.target.value)} className="inp inp-sm"><option value="">—</option>{MODELI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></F>
        </>}
        <F l="Boja bloka"><select value={v.d.boja ?? ""} onChange={(e) => setD("boja", e.target.value)} className="inp inp-sm"><option value="">—</option>{BOJE.map((b) => <option key={b} value={b}>{b}</option>)}</select></F>
        {!ograda && <F l="Količina"><input value={v.d.kolicina ?? ""} onChange={(e) => setD("kolicina", e.target.value)} className="inp inp-sm" /></F>}
      </Grupa>

      <Grupa naslov="Detalji za ponudu">
        {DETALJI.filter(({ k }) => !["model", "boja", "kolicina"].includes(k) && (k !== "pristup" || prevoz)
          && (ograda || !["visina_stuba", "visina_polja", "razmak_stubova", "oblik", "kapije", "stubni_blok"].includes(k))
          && (k !== "temelj_sirina" || /^(Ima|Uradi)/.test(v.d.temelj ?? ""))).map((d) => {
          const { k, l, tip } = d; const opcije = "opcije" in d ? d.opcije : null;
          return (
            <F key={k} l={l + (tip === "m" ? " (m)" : tip === "kom" ? " (kom)" : tip === "cm" ? " (cm)" : tip === "kapije" ? " (m, npr. 1 + 5)" : "")} puno={tip === "tekst"}>
              {opcije
                ? <select value={v.d[k] ?? ""} onChange={(e) => setD(k, e.target.value)} className="inp inp-sm"><option value="">—</option>{opcije.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input value={v.d[k] ?? ""} onChange={(e) => setD(k, e.target.value)} inputMode={tip === "tekst" || tip === "kapije" ? undefined : "decimal"} className="inp inp-sm" />}
            </F>
          );
        })}
      </Grupa>

      <Grupa naslov="Kvalifikacija i ishod">
        <F l="Kvalitet leada"><Sel v={v.temperatura} onChange={(x) => set("temperatura", x)} opcije={TEMPERATURE} /></F>
        <F l="Tip kupca"><Sel v={v.tip_kupca} onChange={(x) => set("tip_kupca", x)} opcije={TIPOVI_KUPCA} /></F>
        <F l="Kad bi radio"><Sel v={v.rok} onChange={(x) => set("rok", x)} opcije={ROKOVI} /></F>
        <F l="Ishod"><select value={v.status} onChange={(e) => set("status", e.target.value)} className="inp inp-sm">{STATUSI.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></F>
        <F l="Pozvati kog datuma"><input type="date" value={v.podseti_kad} onChange={(e) => set("podseti_kad", e.target.value)} className="inp inp-sm" /></F>
        {v.status === "propao" && <F l="Zašto je odustao" ob><Sel v={v.razlog_odustajanja} onChange={(x) => set("razlog_odustajanja", x)} opcije={RAZLOZI} /></F>}
        <F l="Informacije pred poziv" puno><textarea value={v.info} onChange={(e) => set("info", e.target.value)} rows={2} className="inp inp-sm" /></F>
        <F l="Beleška posle poziva" puno><textarea value={v.ishod_beleska} onChange={(e) => set("ishod_beleska", e.target.value)} rows={2} className="inp inp-sm" /></F>
      </Grupa>

      {state.msg && !state.ok && <p className="mt-3 text-sm font-medium text-red">{state.msg}</p>}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-4">
        <button type="button" onClick={onOtkazi} className="btn btn-sm btn-ghost">Otkaži</button>
        <button type="button" onClick={sacuvaj} disabled={pending} className="btn btn-sm">{pending ? "Čuvam…" : "Sačuvaj"}</button>
      </div>
    </div>
  );
}

function Sel({ v, onChange, opcije, prazno = "—" }: { v: string; onChange: (x: string) => void; opcije: readonly { v: string; l: string }[]; prazno?: string }) {
  return (
    <select value={v} onChange={(e) => onChange(e.target.value)} className="inp inp-sm">
      <option value="">{prazno}</option>
      {opcije.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function Grupa({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="micro mb-2">{naslov}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}
function F({ l, children, ob, puno }: { l: string; children: React.ReactNode; ob?: boolean; puno?: boolean }) {
  return <label className={`field ${puno ? "col-span-2 sm:col-span-3" : ""}`}><span>{l}{ob && <span className="text-red"> *</span>}</span>{children}</label>;
}
