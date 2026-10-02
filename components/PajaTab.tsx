"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dosije } from "@/lib/dosije";
import { cekaPaju, kadFmt } from "@/lib/dosije";
import type { LeadRow } from "@/components/LeadView";
import { ulazIzLeada } from "@/lib/procena";
import { izracunaj } from "@/lib/kalkulator";
import { porukaZaPaju, pajaLink, PRAZNA_PAJA } from "@/lib/paja";
import { waLink } from "@/lib/lead";
import { sacuvajPajaPoruku, sacuvajPajaOdgovor } from "@/app/dosijei/actions";
import { Obavestenja } from "@/components/Obavestenja";

/*
  Tab „Paja" (Pavle, 02.10.2026.): Pavle kači šablon poruku (specifikaciju posla) za kupca, Paja odgovara
  tekstualnom ponudom za ugradnju. Pravilo „što manje klikova": Pavle bira kupca iz liste, poruka se sama
  sastavi iz leada, jedno dugme. Paji je na vrhu, žuto i krupno, sve što čeka njegov odgovor.
  Kupac ne mora da bude lead: može i ručno (ime, telefon, mesto, tekst).
*/
const punoIme = (l: LeadRow) => [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena";

export function PajaTab({ dosijei, leadovi, migracija8Fali }: { dosijei: Dosije[]; leadovi: LeadRow[]; migracija8Fali?: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [poruka, setPoruka] = useState<string | null>(null);
  const [nova, setNova] = useState(false);

  const saPorukom = dosijei.filter((d) => d.paja?.poruka);
  const cekaju = saPorukom.filter(cekaPaju).sort((a, b) => (a.paja!.poruka_kad < b.paja!.poruka_kad ? -1 : 1));
  const gotovi = saPorukom.filter((d) => !cekaPaju(d)).sort((a, b) => ((b.paja?.odgovor_kad ?? b.updated_at) > (a.paja?.odgovor_kad ?? a.updated_at) ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      {migracija8Fali && <div className="card border-l-4 border-l-red bg-red-bg p-3.5 text-[13px]"><b>Tab Paja još nije uključen u bazi.</b> Pokreni <code className="rounded bg-white px-1">supabase/migracija-8.sql</code> u Supabase SQL editoru (kolona paja + tabela pretplate), pa osveži.</div>}

      {/* kako radi, u tri reda */}
      <div className="card p-3.5 text-[13px] text-text">
        <b className="text-ink">Kako ide:</b> Pavle doda poruku za kupca (dole, jedan klik) → Paja dobije obaveštenje i vidi je ovde u žutom → Paja nalepi svoju ponudu u „Pajin odgovor“ → Pavle dobije obaveštenje; posle sam bira da li ide i PDF.
        <div className="mt-2"><Obavestenja /></div>
      </div>

      {/* ZA PAJU: šta čeka */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="h3">Čeka Pajin odgovor</h2>
          <span className={`tag ${cekaju.length ? "tag-yellow" : "tag-green"}`}>{cekaju.length ? `${cekaju.length} ${cekaju.length === 1 ? "kupac" : "kupca"}` : "ništa ne čeka"}</span>
        </div>
        {cekaju.length === 0 && <div className="card p-5 text-center text-[13px] text-muted">Sve je odgovoreno.</div>}
        <div className="flex flex-col gap-3">
          {cekaju.map((d) => <PajaKartica key={d.id} d={d} ceka onPoruka={setPoruka} />)}
        </div>
      </div>

      {/* ZA PAVLA: nova poruka */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="h3">Nova poruka za Paju</h2>
          {!nova && <button type="button" onClick={() => setNova(true)} className="btn btn-sm">+ Dodaj kupca</button>}
        </div>
        {nova && <NovaPoruka leadovi={leadovi} dosijei={dosijei} onGotovo={(msg) => { setPoruka(msg); setNova(false); router.refresh(); }} onOtkazi={() => setNova(false)} />}
        {!nova && <p className="mt-1 text-[12.5px] text-muted">Izabereš kupca iz leadova, poruka se sama sastavi iz onoga što je upisano posle poziva. Ako kupac nije u leadovima, upišeš ga ručno.</p>}
      </div>

      {poruka && <div className="card border-l-4 border-l-blue bg-blue-bg p-3 text-[13px]">{poruka} <button type="button" onClick={() => setPoruka(null)} className="ml-2 text-muted">×</button></div>}

      {/* odgovoreno */}
      {gotovi.length > 0 && (
        <div>
          <h2 className="h3 mb-2">Paja odgovorio <span className="font-normal text-muted">({gotovi.length})</span></h2>
          <div className="flex flex-col gap-3">{gotovi.map((d) => <PajaKartica key={d.id} d={d} onPoruka={setPoruka} />)}</div>
        </div>
      )}
    </div>
  );
}

function PajaKartica({ d, ceka, onPoruka }: { d: Dosije; ceka?: boolean; onPoruka: (m: string) => void }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [odgovor, setOdgovor] = useState(d.paja?.odgovor ?? "");
  const [otvorena, setOtvorena] = useState(!!ceka);
  const [radi, setRadi] = useState(false);
  const [kopirano, setKopirano] = useState(false);
  const p = d.paja!;
  const sacuvaj = () => {
    setRadi(true);
    start(async () => { const r = await sacuvajPajaOdgovor(d.id, odgovor); setRadi(false); onPoruka(r.msg ?? (r.ok ? "Sačuvano." : "Nije sačuvano.")); if (r.ok) router.refresh(); });
  };
  const kopiraj = async () => { try { await navigator.clipboard.writeText(p.poruka); setKopirano(true); setTimeout(() => setKopirano(false), 1500); } catch { /* prazno */ } };
  return (
    <div className={`card p-4 ${ceka ? "border-l-4 border-l-yellow bg-yellow-bg/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-ink">{d.kupac}</div>
          <div className="text-[12px] text-muted">{[d.telefon, d.mesto, d.opis].filter(Boolean).join(" · ")}</div>
        </div>
        <span className={`tag ${ceka ? "tag-yellow" : "tag-green"}`}><span className="tag-dot" />{ceka ? `čeka od ${kadFmt(p.poruka_kad)}` : `odgovoreno ${kadFmt(p.odgovor_kad ?? d.updated_at)}`}</span>
      </div>

      <div className="mt-3">
        <button type="button" onClick={() => setOtvorena((o) => !o)} className="text-[12px] font-semibold text-ink underline underline-offset-2">{otvorena ? "Sakrij poruku" : "Pokaži poruku za Paju"}</button>
        {otvorena && (
          <div className="mt-2">
            <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-[12.5px] leading-snug text-text border border-line">{p.poruka}</pre>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={pajaLink(p.poruka)} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">Pošalji Paji na WhatsApp</a>
              <button type="button" onClick={kopiraj} className="btn btn-sm btn-ghost">{kopirano ? "Kopirano ✓" : "Kopiraj"}</button>
              {d.telefon && <a href={waLink(d.telefon)} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">Kupac na WhatsApp</a>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <label className="field"><span>{ceka ? "Pajin odgovor (nalepi ponudu za ugradnju)" : "Pajin odgovor"}</span>
          <textarea value={odgovor} onChange={(e) => setOdgovor(e.target.value)} rows={ceka ? 5 : 3} className="inp inp-sm leading-snug" placeholder={"Sto se tice ugradnje...\nCena ugradnje je 5900\nU cenu ulazi\n..."} /></label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={sacuvaj} disabled={radi || odgovor.trim() === (d.paja?.odgovor ?? "")} className={`btn btn-sm ${ceka ? "btn-green" : "btn-ghost"} disabled:opacity-45`}>{radi ? "Čuvam…" : ceka ? "Sačuvaj ponudu (obavesti Pavla)" : "Sačuvaj izmenu"}</button>
          {p.odgovor && <Link href={`/ugradnja?dosije=${d.id}`} className="btn btn-sm">{d.ugradnja ? "Otvori ponudu za ugradnju" : "Napravi PDF ponude"}</Link>}
        </div>
      </div>
    </div>
  );
}

function NovaPoruka({ leadovi, dosijei, onGotovo, onOtkazi }: { leadovi: LeadRow[]; dosijei: Dosije[]; onGotovo: (msg: string) => void; onOtkazi: () => void }) {
  const [, start] = useTransition();
  const [leadId, setLeadId] = useState("");
  const [kupac, setKupac] = useState(""); const [telefon, setTelefon] = useState(""); const [mesto, setMesto] = useState("");
  const [tekst, setTekst] = useState("");
  const [radi, setRadi] = useState(false); const [greska, setGreska] = useState("");
  // leadovi koji traže ugradnju, oni bez poruke prvi
  const kandidati = useMemo(() => {
    const imaPoruku = new Set(dosijei.filter((d) => d.paja?.poruka).map((d) => d.lead_id).filter(Boolean));
    return leadovi
      .filter((l) => l.obuhvat === "kljuc_u_ruke" || !l.obuhvat || l.obuhvat === "nepoznato")
      .filter((l) => l.status !== "propao")
      .sort((a, b) => Number(imaPoruku.has(a.id)) - Number(imaPoruku.has(b.id)) || b.created_at.localeCompare(a.created_at))
      .map((l) => ({ l, ima: imaPoruku.has(l.id) }));
  }, [leadovi, dosijei]);

  const izaberi = (id: string) => {
    setLeadId(id);
    const l = leadovi.find((x) => x.id === id); if (!l) return;
    setKupac(punoIme(l)); setTelefon(l.telefon ?? ""); setMesto(l.lokacija ?? "");
    const d = (l.detalji ?? {}) as Record<string, string>;
    const polja = { ...PRAZNA_PAJA, ime: punoIme(l), lokacija: l.lokacija ?? "", temelj: d.temelj ?? "", iskop: d.iskop ?? "", cokla: d.cokla ?? "", dodatniRadovi: d.dodatni_radovi ?? "" };
    const iz = ulazIzLeada(l);
    if (iz) { const r = izracunaj(iz.ulaz); setTekst(porukaZaPaju(polja, iz.ulaz, r, false) + (d.boja ? `\n* *Boja:* ${d.boja}${d.boja_zavrsnih ? `, kape i okapnice ${d.boja_zavrsnih.toLowerCase()}` : ""}${l.ispuna === "samo_blokovi" ? ", bez panela" : l.ispuna === "blokovi_paneli" ? ", sa panelima" : ""}` : "")); }
    else setTekst(`*SPECIFIKACIJA POSLA*\n${punoIme(l)}\n\n\n* *Lokacija:* ${l.lokacija ?? ""}\n* *Ukupna dužina ograde:*\n* \n* *Visina polja:*\n* \n* *Visina stubova:*\n* \n* *Dužina polja / razmak između stubova:*\n* \n* *Da li se koristi stubni blok:*\n* *Da li je potreban temelj:*\n* *Da li postoji iskop za temelj: \n* *Da li je cokla već pripremljena:*\n* *Dodatni radovi:* \n* *Fotografije ili video terena:*`);
  };
  const sacuvaj = () => {
    setRadi(true); setGreska("");
    start(async () => {
      const r = await sacuvajPajaPoruku({ lead_id: leadId || null, kupac, telefon: telefon || null, mesto: mesto || null, poruka: tekst });
      setRadi(false);
      if (!r.ok) { setGreska(r.msg ?? "Nije sačuvano."); return; }
      // odmah i WhatsApp Paji, da bude jedan klik
      window.open(pajaLink(tekst), "_blank", "noopener");
      onGotovo(r.msg ?? "Poslato.");
    });
  };
  return (
    <div className="mt-3 grid gap-3">
      <label className="field"><span>Kupac iz leadova (poruka se sama sastavi)</span>
        <select value={leadId} onChange={(e) => izaberi(e.target.value)} className="inp inp-sm">
          <option value="">— nije u leadovima, upisujem ručno —</option>
          {kandidati.map(({ l, ima }) => <option key={l.id} value={l.id}>{punoIme(l)}{l.lokacija ? ` · ${l.lokacija}` : ""}{l.duzina_m ? ` · ${l.duzina_m} m` : ""}{ima ? " (već ima poruku)" : ""}</option>)}
        </select></label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="field"><span>Ime kupca</span><input value={kupac} onChange={(e) => setKupac(e.target.value)} className="inp inp-sm" /></label>
        <label className="field"><span>Telefon</span><input value={telefon} onChange={(e) => setTelefon(e.target.value)} inputMode="tel" className="inp inp-sm" /></label>
        <label className="field"><span>Mesto</span><input value={mesto} onChange={(e) => setMesto(e.target.value)} className="inp inp-sm" /></label>
      </div>
      <label className="field"><span>Poruka za Paju (specifikacija posla)</span>
        <textarea value={tekst} onChange={(e) => setTekst(e.target.value)} rows={10} className="inp inp-sm leading-snug font-mono text-[12px]" placeholder="Izaberi kupca gore ili nalepi specifikaciju…" /></label>
      {greska && <p className="text-[12.5px] font-medium text-red">{greska}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" onClick={onOtkazi} className="btn btn-sm btn-ghost">Otkaži</button>
        <button type="button" onClick={sacuvaj} disabled={radi || !kupac.trim() || !tekst.trim()} className="btn btn-sm btn-green disabled:opacity-45">{radi ? "Čuvam…" : "Sačuvaj i pošalji Paji"}</button>
      </div>
    </div>
  );
}
