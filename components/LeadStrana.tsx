"use client";

import { useState, useTransition, useOptimistic } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell, Obavestenje } from "@/components/Shell";
import { Ico, I } from "@/components/Sidebar";
import { DosijeKartica } from "@/components/DosijeKartica";
import { PosaljiKlijentu } from "@/components/PosaljiKlijentu";
import { LeadForma } from "@/components/LeadForma";
import { StatusSelect, Zvezda, Zarada, Razlog, Beleska, Temperatura, ZaPoziv, ProcenaOznaka, punoIme, type LeadRow } from "@/components/LeadView";
import { telLink, smsLink, waLink, viberLink } from "@/lib/lead";
import { pre, rsd } from "@/lib/format";
import { label, SVI_PROIZVODI, SVI_IZVORI, OBUHVATI, MODELI_OGRADE, TIPOVI_KUPCA, ROKOVI, RAZLOZI, statusOd, staFali } from "@/lib/opcije";
import { proceniLead } from "@/lib/procena";
import { napraviPonudaPdf, imeFajla } from "@/lib/ponudaPdf";
import { porukaMaterijal, metaPonude, telIzAdrese } from "@/lib/slanje";
import { promeniStatus, promeniBelesku, promeniPodsetnik, promeniPrioritet, promeniZaradu, promeniKvalifikaciju, obrisiLead, type LeadState } from "@/app/leadovi/actions";
import type { Dosije } from "@/lib/dosije";
import type { SacuvanaPonuda } from "@/lib/ponuda";

/*
  Strana leada: sve na jednom mestu, bez koraka. Levo stanje posla (ishod, dosije, ponude), desno podaci
  i kvalifikacija. „Izmeni" otvara jednostavnu formu sa svim poljima (LeadForma), ne wizard.
*/
export function LeadStrana({ lead, dosije, ponude, uRedu, login, urediOdmah }: { lead: LeadRow; dosije: Dosije | null; ponude: SacuvanaPonuda[]; uRedu: number; login?: boolean; urediOdmah?: boolean }) {
  const router = useRouter();
  const [uredi, setUredi] = useState(!!urediOdmah);
  const [greska, setGreska] = useState<string | null>(null);
  const [opt, apply] = useOptimistic(lead, (s: LeadRow, a: Partial<LeadRow>) => ({ ...s, ...a }));
  const [, start] = useTransition();
  const snimi = (a: Partial<LeadRow>, akcija: () => Promise<LeadState>) =>
    start(async () => { apply(a); const r = await akcija(); if (!r.ok) setGreska(r.msg ?? "Nije sačuvano."); else { setGreska(null); router.refresh(); } });

  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const l = opt;
  const st = statusOd(l.status);
  const ima = !!l.telefon;
  const fali = staFali(l);
  const procena = proceniLead(l) ?? undefined;

  const onStatus = (id: string, status: string) => { const izNov = l.status === "nov" && status !== "nov"; snimi({ status, status_od: new Date().toISOString() }, () => promeniStatus(id, status, izNov)); };
  const onBeleska = (id: string, b: string) => { const v = b.trim() || null; snimi({ ishod_beleska: v }, () => promeniBelesku(id, v)); };
  const onDatum = (id: string, d: string) => { const v = d || null; snimi({ podseti_kad: v }, () => promeniPodsetnik(id, v)); };
  const onPrioritet = (id: string, p: boolean) => snimi({ prioritet: p }, () => promeniPrioritet(id, p));
  const onZarada = (id: string, z: string) => { const n = z.trim() === "" ? null : Number(z.replace(/[^\d.]/g, "")); if (n !== null && isNaN(n)) return; snimi({ zarada_rsd: n }, () => promeniZaradu(id, n)); };
  const onKval = (id: string, polje: string, v: string | null) => snimi({ [polje]: v } as Partial<LeadRow>, () => promeniKvalifikaciju(id, polje, v));
  const obrisi = () => { if (!confirm(`Obrisati lead — ${punoIme(l)}?`)) return; start(async () => { const r = await obrisiLead(l.id); if (r.ok) router.push("/"); else setGreska(r.msg ?? "Nije obrisano."); }); };

  const telefonKupca = l.telefon ?? dosije?.telefon ?? (ponude[0] ? telIzAdrese(ponude[0].adresa) : null);
  const trebaUgradnja = l.obuhvat !== "materijal" && l.obuhvat !== "materijal_prevoz";

  return (
    <Shell uRedu={uRedu} login={login}
      naslov={<span className="flex flex-wrap items-center gap-2"><Zvezda on={!!l.prioritet} onClick={() => onPrioritet(l.id, !l.prioritet)} />{punoIme(l)}{st && <span className={`tag tag-${st.ton}`}>{st.l}</span>}<Temperatura l={l} onKval={onKval} /></span>}
      podnaslov={<>{l.telefon ? <a href={telLink(l.telefon)} className="font-medium text-blue hover:underline">{l.telefon}</a> : "bez broja"}{l.lokacija ? ` · ${l.lokacija}` : ""} · dodat {pre(l.created_at)}{l.izvor ? ` · ${label(SVI_IZVORI, l.izvor)}` : ""}</>}
      akcije={<>
        <Link href="/" className="btn btn-sm btn-ghost">← Leadovi</Link>
        <a href={telLink(l.telefon)} className={`btn btn-sm btn-green ${ima ? "" : "pointer-events-none opacity-40"}`}>Pozovi</a>
        <a href={waLink(l.telefon)} target="_blank" rel="noreferrer" className={`btn btn-sm btn-ghost ${ima ? "" : "pointer-events-none opacity-40"}`}>WhatsApp</a>
        <a href={viberLink(l.telefon)} className={`btn btn-sm btn-ghost ${ima ? "" : "pointer-events-none opacity-40"}`}>Viber</a>
        <a href={smsLink(l.telefon)} className={`btn btn-sm btn-ghost ${ima ? "" : "pointer-events-none opacity-40"}`}>SMS</a>
        <Link href={`/kalkulator?lead=${l.id}`} className="btn btn-sm btn-ghost"><Ico d={I.kalkulator} size={15} />Kalkulator</Link>
        <button type="button" onClick={() => setUredi((x) => !x)} className={`btn btn-sm ${uredi ? "btn-ghost" : ""}`}>{uredi ? "Zatvori izmenu" : "Izmeni podatke"}</button>
      </>}>
      {greska && <Obavestenje ton="red" onClose={() => setGreska(null)}>{greska}</Obavestenje>}
      {fali.length > 0 && <Obavestenje ton="amber" naslov="Nepotpun za Luku">Fali: {fali.join(", ")}. Dopuni kroz „Izmeni podatke“.</Obavestenje>}

      {uredi && <LeadForma lead={lead} onGotovo={() => { setUredi(false); router.replace(`/lead/${lead.id}`); router.refresh(); }} onOtkazi={() => setUredi(false)} />}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* ---------- levo: stanje posla ---------- */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h3">Ishod</h2>
              <span className="text-[12px] text-muted">{l.status_od ? `u ovom ishodu ${pre(l.status_od)}` : ""}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Ishod poziva</span><StatusSelect l={l} onStatus={onStatus} /></label>
              {l.status === "zvati_kasnije" && <label className="field"><span>Pozvati kog datuma</span><input type="date" value={l.podseti_kad ?? ""} onChange={(e) => onDatum(l.id, e.target.value)} className="inp" /></label>}
              {l.status === "zatvoren" && <div className="field"><span>Zarada</span><Zarada id={l.id} vrednost={l.zarada_rsd} onSave={onZarada} /></div>}
              {l.status === "propao" && <div className="field"><span>Razlog</span><Razlog l={l} onKval={onKval} /></div>}
            </div>
            <div className="mt-3 field"><span>Beleška posle poziva</span><Beleska id={l.id} vrednost={l.ishod_beleska} onSave={onBeleska} /></div>
            {l.podseti_kad && l.status === "zvati_kasnije" && l.podseti_kad <= danas && <p className="mt-2 text-[12px] font-semibold text-red">Podsetnik je dospeo.</p>}
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h3">Posao: materijal, prevoz, ugradnja</h2>
              {!dosije && <Link href={`/kalkulator?lead=${l.id}`} className="btn btn-sm">Otvori u kalkulatoru</Link>}
            </div>
            {dosije
              ? <div className="mt-3"><DosijeKartica d={dosije} ponude={ponude} lead={{ obuhvat: l.obuhvat ?? null, status: l.status }} /></div>
              : <p className="mt-2 text-[13px] text-muted">Dosije se otvori sam kad u kalkulatoru napraviš ponudu ili pošalješ poruku prevozniku ili Paji.{trebaUgradnja ? " Posle toga ovde stoji i ponuda za ugradnju." : ""}</p>}
          </div>

          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="h3">Ponude za materijal <span className="font-normal text-muted">({ponude.length})</span></h2>
              <Link href={`/kalkulator?lead=${l.id}`} className="text-[12.5px] font-semibold text-ink underline underline-offset-2">Nova ponuda</Link>
            </div>
            {ponude.length === 0 && <p className="mt-2 text-[13px] text-muted">Još nema ponude. Napravi je u kalkulatoru; čim se skine PDF, pojavi se ovde.</p>}
            <div className="mt-2 flex flex-col divide-y divide-line">
              {ponude.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/ponuda?id=${p.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">Ponuda {p.broj}</Link>
                    <div className="text-[12px] text-muted">{p.datum}{p.mesto ? ` · ${p.mesto}` : ""} · {p.transport_eur != null ? `transport ${p.transport_eur} €` : "bez transporta"} · <b className="text-ink">{rsd(Number(p.ukupno_rsd))}</b></div>
                  </div>
                  <PosaljiKlijentu mali telefon={telefonKupca ?? telIzAdrese(p.adresa)} imeFajla={imeFajla(metaPonude(p))}
                    napraviPdf={() => napraviPonudaPdf(p.redovi, Number(p.ukupno_rsd), metaPonude(p))}
                    tekst={(url) => porukaMaterijal(p.broj, Number(p.ukupno_rsd), url)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- desno: podaci ---------- */}
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <h2 className="h3">Šta kupuje</h2>
            <dl className="mt-2 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-muted">Gradi</dt><dd className="text-text">{l.proizvod ? label(SVI_PROIZVODI, l.proizvod) : "—"}</dd>
              <dt className="text-muted">Obuhvat</dt><dd className="text-text">{l.obuhvat ? label(OBUHVATI, l.obuhvat) : "—"}</dd>
              {l.proizvod === "ograda" && <><dt className="text-muted">Dužina</dt><dd className="text-text">{l.duzina_m != null ? `${l.duzina_m} m` : "—"}</dd>
                <dt className="text-muted">Paneli</dt><dd className="text-text">{l.ispuna ? label(MODELI_OGRADE, l.ispuna) : "—"}</dd></>}
              <dt className="text-muted">Lokacija</dt><dd className="text-text">{l.lokacija ?? "—"}</dd>
            </dl>
            <ZaPoziv l={l} otvoriOdmah />
            <div className="mt-2"><ProcenaOznaka p={procena} l={l} /></div>
          </div>

          <div className="card p-4">
            <h2 className="h3">Kvalifikacija</h2>
            <div className="mt-2 grid gap-3">
              <label className="field"><span>Tip kupca</span>
                <select value={l.tip_kupca ?? ""} onChange={(e) => onKval(l.id, "tip_kupca", e.target.value || null)} className="inp inp-sm">
                  <option value="">—</option>{TIPOVI_KUPCA.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                {l.tip_kupca && <span className="text-[11.5px] font-normal text-muted">{TIPOVI_KUPCA.find((o) => o.v === l.tip_kupca)?.opis}</span>}
              </label>
              <label className="field"><span>Kad bi radio</span>
                <select value={l.rok ?? ""} onChange={(e) => onKval(l.id, "rok", e.target.value || null)} className="inp inp-sm">
                  <option value="">—</option>{ROKOVI.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </label>
              {l.status === "propao" && l.razlog_odustajanja && <div className="text-[13px]"><span className="text-muted">Razlog odustajanja: </span>{label(RAZLOZI, l.razlog_odustajanja)}</div>}
            </div>
          </div>

          {l.info && <div className="card p-4"><h2 className="h3">Informacije pred poziv</h2><p className="mt-2 whitespace-pre-wrap text-[13px] text-text">{l.info}</p></div>}

          <div className="flex items-center justify-between text-[12px] text-muted">
            <span>{l.updated_at ? `menjano ${pre(l.updated_at)}` : ""}</span>
            <button type="button" onClick={obrisi} className="btn btn-sm btn-danger">Obriši lead</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
