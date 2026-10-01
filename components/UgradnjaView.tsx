"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobilniMeni } from "@/components/MobilniMeni";
import { Logo } from "@/components/ui";
import { izTekstaPaje, eurFmt, eurBroj, faliZaUgradnju, imeFajlaUgradnje, PRAZNA_UGRADNJA, type Ugradnja } from "@/lib/ugradnja";
import { napraviUgradnjaPdf } from "@/lib/ugradnjaPdf";
import { datumPonude } from "@/lib/ponuda";
import { sacuvajUgradnju } from "@/app/dosijei/actions";
import { porukaUgradnja } from "@/lib/slanje";
import { PosaljiKlijentu } from "@/components/PosaljiKlijentu";
import type { Dosije } from "@/lib/dosije";

/*
  Ponuda za ugradnju (Pavle, 01.10.2026.): Pajin odgovor se nalepi, pročita u polja, izabere se slika
  ograde, i ide PDF u dizajnu Gradi Lako. Sve se čuva u dosije kupca. Pregled desno je isti list
  (794 px, na telefonu se skalira), PDF crta lib/ugradnjaPdf.ts.
*/

type Slika = { url: string; ime: string; grupa: "biblioteka" | "ugradnja" };

export function UgradnjaView({ uRedu, dosije, demo }: { uRedu: number; dosije: Dosije | null; demo?: boolean }) {
  const router = useRouter();
  const pocetna = (): Ugradnja => ({
    ...PRAZNA_UGRADNJA, ...(dosije?.ugradnja ?? {}),
    kupac: dosije?.ugradnja?.kupac || dosije?.kupac || "",
    lokacija: dosije?.ugradnja?.lokacija || dosije?.mesto || "",
    datum: dosije?.ugradnja?.datum || datumPonude(),
  });
  const [u, setU] = useState<Ugradnja>(pocetna);
  const [tekst, setTekst] = useState(dosije?.ugradnja?.tekst ?? "");
  const [slike, setSlike] = useState<Slika[]>([]);
  const [otprema, setOtprema] = useState<"" | "radi" | "greska">("");
  const [pdfStanje, setPdfStanje] = useState<"" | "radi" | "gotovo" | "greska">("");
  const [cuvanje, setCuvanje] = useState<"" | "radi" | "gotovo" | "greska">("");
  const [poruka, setPoruka] = useState("");
  const [skala, setSkala] = useState(1);
  const fajl = useRef<HTMLInputElement>(null);

  const okvir = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const meri = () => setSkala(Math.min(1, ((okvir.current?.clientWidth ?? window.innerWidth - 32)) / 794));
    meri();
    const ro = typeof ResizeObserver !== "undefined" && okvir.current ? new ResizeObserver(meri) : null;
    ro?.observe(okvir.current!);
    window.addEventListener("resize", meri);
    return () => { ro?.disconnect(); window.removeEventListener("resize", meri); };
  }, []);
  useEffect(() => {
    fetch("/api/slika?lista=1").then((r) => r.json()).then((j) => setSlike(j.slike ?? [])).catch(() => setSlike([]));
  }, []);

  const set = (izm: Partial<Ugradnja>) => setU((s) => ({ ...s, ...izm }));
  const procitaj = () => {
    if (!tekst.trim()) return;
    setU((s) => izTekstaPaje(tekst, { ...s, kupac: s.kupac, lokacija: s.lokacija, broj: s.broj, datum: s.datum, slika: s.slika }));
  };
  const fali = faliZaUgradnju(u);

  const otpremi = async (f: File) => {
    setOtprema("radi");
    const fd = new FormData(); fd.append("slika", f); fd.append("ime", u.kupac || "ograda");
    try {
      const r = await fetch("/api/slika", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Otpremanje nije uspelo.");
      setSlike((s) => [{ url: j.url, ime: f.name, grupa: "ugradnja" }, ...s]);
      set({ slika: j.url }); setOtprema("");
    } catch (e) { setOtprema("greska"); setPoruka((e as Error).message); }
  };

  const bajtoviSlike = async (): Promise<Uint8Array | null> => {
    if (!u.slika) return null;
    try {
      const r = await fetch(`/api/slika?src=${encodeURIComponent(u.slika)}`);
      if (!r.ok) return null;
      return new Uint8Array(await r.arrayBuffer());
    } catch { return null; }
  };

  const sacuvajUDosije = async (tiho = false) => {
    if (demo) return;
    if (!tiho) setCuvanje("radi");
    const rez = await sacuvajUgradnju(u, dosije?.id ?? null, dosije?.lead_id ?? null);
    if (rez.ok) { if (!tiho) { setCuvanje("gotovo"); setPoruka(rez.msg ?? ""); setTimeout(() => setCuvanje(""), 2500); } router.refresh(); if (!dosije && rez.id) router.replace(`/ugradnja?dosije=${rez.id}`); }
    else { setCuvanje("greska"); setPoruka(rez.msg ?? "Nije sačuvano."); }
  };

  const pdf = async () => {
    if (fali.length) return;
    setPdfStanje("radi");
    try {
      const blob = await napraviUgradnjaPdf(u, await bajtoviSlike());
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = imeFajlaUgradnje(u);
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      setPdfStanje("gotovo"); setTimeout(() => setPdfStanje(""), 2500);
      void sacuvajUDosije(true);
    } catch (e) { console.error(e); setPdfStanje("greska"); }
  };

  const linije = (s: string[]) => s.join("\n");
  const izLinija = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
  const telefon = dosije?.telefon ?? dosije?.stanje?.telefonKupca ?? "";

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <Sidebar uRedu={uRedu} />
      <MobilniMeni uRedu={uRedu} />
      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 sm:top-5 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 sm:px-4">
          <div className="nav-bar">
            <Link href="/" className="flex min-w-0 items-center gap-2.5"><Logo size={40} /><div className="flex min-w-0 flex-col leading-none"><span className="nav-wordmark">Deko Pro</span><span className="nav-sub mt-1">Ugradnja</span></div></Link>
            <Link href="/ponude" className="btn btn-sm btn-light btn-plain">Kupci</Link>
          </div>
        </div>
      </header>
      <section className="page-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-bg.jpg" alt="" aria-hidden />
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-[calc(var(--nav-h)+28px)] sm:pt-[calc(var(--nav-h)+40px)] lg:max-w-none lg:px-8 lg:pb-7 lg:pt-7">
          <div className="on-dark rise flex flex-col items-start gap-3">
            <span className="eyebrow"><span className="eyebrow-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6" /></svg></span>Interni panel</span>
            <h1 className="h2 lg:text-[34px]">Ponuda za ugradnju{dosije ? `: ${dosije.kupac}` : ""}</h1>
            <p className="text-sm text-white/70">Nalepi Pajin odgovor, proveri brojeve, izaberi sliku ograde. PDF je u dizajnu Gradi Lako i ide u dosije kupca.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5 sm:pt-7 lg:max-w-none lg:px-8 lg:py-6">
        {demo && <div className="card mb-4 border-l-4 border-l-gold p-3 text-sm text-ink">Demo režim: baza nije povezana, ponuda se ne čuva.</div>}
        <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
          {/* ---------- unos ---------- */}
          <div className="flex flex-col gap-4">
            <div className="card p-4 sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Pajin odgovor</div>
              <textarea value={tekst} onChange={(e) => setTekst(e.target.value)} rows={7} className="inp mt-2 text-[13px] leading-snug" placeholder={"Sto se tice ugradnje...\nCena ugradnje je 5900e\nU cenu ulazi\n..."} />
              <button type="button" onClick={procitaj} disabled={!tekst.trim()} className="btn btn-sm btn-plain mt-2 w-full justify-center disabled:opacity-45">Pročitaj brojeve iz teksta</button>
              <p className="mt-1.5 text-[11px] text-muted">Čita cenu, avans, obe rate i šta ulazi u cenu. Sve ispod posle možeš da doteraš.</p>
            </div>

            <div className="card p-4 sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Ponuda</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="field col-span-2"><span>Klijent / investitor</span><input value={u.kupac} onChange={(e) => set({ kupac: e.target.value })} className="inp inp-sm" /></label>
                <label className="field"><span>Lokacija radova</span><input value={u.lokacija} onChange={(e) => set({ lokacija: e.target.value })} className="inp inp-sm" /></label>
                <label className="field"><span>Broj ponude</span><input value={u.broj} onChange={(e) => set({ broj: e.target.value })} className="inp inp-sm" placeholder="npr. 215/26" /></label>
                <label className="field"><span>Datum</span><input value={u.datum} onChange={(e) => set({ datum: e.target.value })} className="inp inp-sm" /></label>
                <label className="field"><span>Sastavio</span><input value={u.sastavio} onChange={(e) => set({ sastavio: e.target.value })} className="inp inp-sm" /></label>
                <BrojEur label="Ukupna cena radova (€)" value={u.cena} onChange={(n) => set({ cena: n })} />
                <BrojEur label="Avans za termin (€)" value={u.avans} onChange={(n) => set({ avans: n })} />
                <BrojEur label="Na dan početka (€)" value={u.rata1} onChange={(n) => set({ rata1: n })} />
                <BrojEur label="Po završetku (€)" value={u.rata2} onChange={(n) => set({ rata2: n })} />
                <label className="field"><span>Planiran početak</span><input value={u.pocetak} onChange={(e) => set({ pocetak: e.target.value })} className="inp inp-sm" placeholder="npr. oktobar" /></label>
                <label className="field"><span>Trajanje radova</span><input value={u.trajanje} onChange={(e) => set({ trajanje: e.target.value })} className="inp inp-sm" placeholder="npr. 21 dan" /></label>
                <label className="field col-span-2"><span>U cenu je uračunato <span className="font-normal text-muted">(jedan red = jedna stavka)</span></span>
                  <textarea value={linije(u.uracunato)} onChange={(e) => set({ uracunato: izLinija(e.target.value) })} rows={4} className="inp inp-sm leading-snug" /></label>
                <label className="field col-span-2"><span>Nije uračunato u cenu</span>
                  <textarea value={linije(u.nijeUracunato)} onChange={(e) => set({ nijeUracunato: izLinija(e.target.value) })} rows={3} className="inp inp-sm leading-snug" /></label>
                <label className="field col-span-2"><span>Napomena ispod dinamike plaćanja</span>
                  <textarea value={u.napomena} onChange={(e) => set({ napomena: e.target.value })} rows={3} className="inp inp-sm leading-snug" /></label>
              </div>
              {u.cena != null && u.avans != null && u.rata1 != null && u.rata2 != null && Math.abs(u.avans + u.rata1 + u.rata2 - u.cena) > 0.5 && (
                <p className="mt-2 text-[12px] text-warn">Avans + dve rate = {eurFmt(u.avans + u.rata1 + u.rata2)} €, a cena je {eurFmt(u.cena)} €. Proveri brojeve.</p>
              )}
            </div>

            <div className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Slika ograde</div>
                <button type="button" onClick={() => fajl.current?.click()} disabled={otprema === "radi"} className="text-[12px] font-semibold text-ink underline underline-offset-2">{otprema === "radi" ? "Otpremam…" : "Otpremi svoju sliku"}</button>
                <input ref={fajl} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void otpremi(f); e.target.value = ""; }} />
              </div>
              {otprema === "greska" && <p className="mt-1 text-[12px] text-warn">{poruka}</p>}
              <p className="mt-1 text-[11px] text-muted">Biblioteka su fotografije iz zvaničnog kataloga. Slika ide preko cele širine prve strane, u boji koju je kupac izabrao.</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                <button type="button" onClick={() => set({ slika: null })} className={`aspect-[16/10] rounded-[8px] border text-[11px] text-muted ${!u.slika ? "border-navy ring-2 ring-navy/30" : "border-line"}`}>bez slike</button>
                {slike.map((s) => (
                  <button key={s.url} type="button" onClick={() => set({ slika: s.url })} title={s.ime}
                    className={`aspect-[16/10] overflow-hidden rounded-[8px] border ${u.slika === s.url ? "border-navy ring-2 ring-navy/30" : "border-line"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- pregled i dugmad ---------- */}
          <div ref={okvir} className="flex min-w-0 flex-col gap-4">
            <div className="card flex flex-wrap items-center gap-2 p-3">
              <button type="button" onClick={pdf} disabled={pdfStanje === "radi" || fali.length > 0} className="btn btn-sm btn-plain disabled:opacity-45">
                {pdfStanje === "radi" ? "Pravim PDF…" : pdfStanje === "gotovo" ? "Sačuvano ✓" : "Sačuvaj u PDF"}
              </button>
              <button type="button" onClick={() => void sacuvajUDosije()} disabled={cuvanje === "radi" || !u.kupac.trim() || !!demo} className="btn btn-sm btn-ghost btn-plain disabled:opacity-45">
                {cuvanje === "radi" ? "Čuvam…" : cuvanje === "gotovo" ? "U dosijeu ✓" : "Sačuvaj u dosije"}
              </button>
              <PosaljiKlijentu telefon={telefon} saPdf={false} disabled={fali.length > 0} imeFajla={imeFajlaUgradnje(u)}
                napraviPdf={async () => napraviUgradnjaPdf(u, await bajtoviSlike())}
                tekst={(url) => porukaUgradnja(u.broj, eurFmt(u.cena), url)}
                onPosle={() => void sacuvajUDosije(true)} />
              <span className="w-full text-[11px] text-muted sm:w-auto sm:flex-1">
                {fali.length ? <>Fali: <b className="text-ink">{fali.join(", ")}</b>.</> : cuvanje === "greska" ? <span className="text-warn">{poruka}</span> : pdfStanje === "greska" ? <span className="text-warn">PDF nije napravljen.</span> : "PDF se skida odmah i ponuda se sama upiše u dosije. WhatsApp i Viber nose poruku sa linkom na PDF."}
              </span>
            </div>

            <div className="overflow-hidden" style={{ width: Math.round(794 * skala), height: Math.round((1123 * 2 + 16) * skala) }}>
              <div style={{ transform: `scale(${skala})`, transformOrigin: "top left", width: 794 }}>
                <ListUgradnje u={u} strana={1} />
                <div style={{ height: 16 }} />
                <ListUgradnje u={u} strana={2} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Brojno polje u evrima koje pamti tekst koji se kuca (zapeta ne sme da nestane); kad vrednost promeni
   nešto drugo (npr. „Pročitaj brojeve iz teksta"), tekst se osveži. */
function BrojEur({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  const kaoTekst = (v: number | null) => (v == null ? "" : String(v).replace(".", ","));
  const [txt, setTxt] = useState(kaoTekst(value));
  const zadnji = useRef<number | null>(value);
  useEffect(() => { if (value !== zadnji.current) { zadnji.current = value; setTxt(kaoTekst(value)); } }, [value]);
  return (
    <label className="field"><span>{label}</span>
      <input value={txt} inputMode="decimal" className="inp inp-sm" placeholder="0"
        onChange={(e) => { const v = e.target.value; if (!/^[0-9]*[.,]?[0-9]*$/.test(v)) return; setTxt(v); const n = eurBroj(v); zadnji.current = n; onChange(n); }} />
    </label>
  );
}

/* Pregled lista, isti raspored kao PDF (px = pt × 1,333). */
const L = 54, D = 740;
const LABELA: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, color: "#7a6a55", letterSpacing: 0.3 };
const LIST: React.CSSProperties = { position: "relative", width: 794, height: 1123, background: "#fff", fontFamily: "'Noto Sans', 'Segoe UI', system-ui, sans-serif", color: "#2b2b2b", boxShadow: "0 6px 24px rgba(0,0,0,.18)", overflow: "hidden" };

/* Delovi lista su komponente van rendera (react-hooks/static-components). */
function PoljeLista({ l, v, x, w, top, veliko }: { l: string; v: string; x: number; w: number; top: number; veliko?: boolean }) {
  return (
    <div style={{ position: "absolute", left: x, top, width: w }}>
      <div style={LABELA}>{l}</div>
      <div style={{ marginTop: veliko ? 8 : 6, paddingLeft: 3, fontSize: veliko ? 24 : 14, color: "#2b2b2b", whiteSpace: "nowrap", overflow: "hidden" }}>{v || "\u00a0"}</div>
      <div style={{ marginTop: 6, height: 1, background: "#d6d6d6" }} />
    </div>
  );
}

function ZaglavljeLista({ strana }: { strana: 1 | 2 }) {
  return (
    <>
      <div style={{ position: "absolute", left: L, top: 44, fontWeight: 700, fontSize: 23, color: "#2b2b2b" }}>GRADI LAKO</div>
      <div style={{ position: "absolute", right: 794 - D, top: 58, fontSize: 10, color: "#6b6b6b" }}>OGRADE I GRAĐEVINSKI RADOVI</div>
      <div style={{ position: "absolute", left: L, right: 794 - D, top: 102, height: 1, background: "#d6d6d6" }} />
      <div style={{ position: "absolute", left: L, top: 101, width: 68, height: 3, background: "#b8935a" }} />
      <div style={{ position: "absolute", left: L, right: 794 - D, top: 1052, height: 1, background: "#d6d6d6" }} />
      <div style={{ position: "absolute", left: L, top: 1068, fontSize: 10.5, color: "#6b6b6b" }}>GRADI LAKO&nbsp; /&nbsp; Beograd, Srbija</div>
      <div style={{ position: "absolute", left: L, top: 1086, fontSize: 10, color: "#6b6b6b" }}>gradilakooffice@gmail.com&nbsp; |&nbsp; Instagram: @gradi_lako</div>
      <div style={{ position: "absolute", right: 794 - D, top: 1068, fontSize: 10.5, color: "#6b6b6b" }}>0{strana} / 02</div>
    </>
  );
}

function ListUgradnje({ u, strana }: { u: Ugradnja; strana: 1 | 2 }) {
  const labela = LABELA, base = LIST, Polje = PoljeLista;
  if (strana === 1) return (
    <div style={base}>
      <ZaglavljeLista strana={1} />
      <div style={{ position: "absolute", left: L, top: 130, ...labela, fontSize: 10.5 }}>PONUDA IZVOĐAČA</div>
      <div style={{ position: "absolute", left: L, top: 150, fontSize: 39, fontWeight: 700, lineHeight: 1.1 }}>Izvođenje ograde.</div>
      <div style={{ position: "absolute", left: L, top: 210, fontSize: 14, color: "#6b6b6b" }}>Pregled cene i vizuelni prikaz</div>
      <Polje l="KLIJENT / INVESTITOR" v={u.kupac} x={L} w={320} top={258} />
      <Polje l="LOKACIJA RADOVA" v={u.lokacija} x={412} w={328} top={258} />
      <Polje l="BROJ PONUDE" v={u.broj} x={L} w={320} top={322} />
      <Polje l="DATUM PONUDE" v={u.datum} x={412} w={328} top={322} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, height: 444, background: "#f3efe7", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {u.slika ? <img src={u.slika} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#6b6b6b", fontSize: 13 }}>Vizuelni prikaz ograde</div>}
      </div>
      <div style={{ position: "absolute", left: L, top: 856, fontSize: 10, color: "#6b6b6b" }}>Ilustrativni prikaz ograde. Obuhvat ponude naveden je na drugoj strani.</div>
      <div style={{ position: "absolute", left: L, right: 794 - D, top: 892, height: 133, background: "#2b2b2b", color: "#fff" }}>
        <div style={{ position: "absolute", left: 25, top: 22, fontSize: 11.5, fontWeight: 700 }}>UKUPNA CENA RADOVA</div>
        <div style={{ position: "absolute", left: 25, top: 48, fontSize: 56, fontWeight: 700, lineHeight: 1 }}>{eurFmt(u.cena) || "—"}</div>
        <div style={{ position: "absolute", left: 328, top: 78, fontSize: 21, fontWeight: 700 }}>EUR</div>
      </div>
    </div>
  );

  const redovi = [
    { n: "01", naslov: "Avans za ugradnju", opis: "Uplata za rezervaciju termina izvođenja radova.", iznos: u.avans },
    { n: "02", naslov: "Na dan početka radova", opis: "Prva polovina ostatka, uz uračunat avans.", iznos: u.rata1 },
    { n: "03", naslov: "Po završetku radova", opis: "Preostali iznos cene radova.", iznos: u.rata2 },
  ];
  return (
    <div style={base}>
      <ZaglavljeLista strana={2} />
      <div style={{ position: "absolute", left: L, top: 134, ...labela, fontSize: 10.5 }}>DETALJI PONUDE</div>
      <div style={{ position: "absolute", left: L, top: 152, fontSize: 35, fontWeight: 700, lineHeight: 1.1 }}>Obuhvat radova</div>
      <div style={{ position: "absolute", left: L, top: 205, fontSize: 14, color: "#6b6b6b" }}>Šta pokriva cena i uslovi realizacije.</div>
      <div style={{ position: "absolute", left: L, right: 794 - D, top: 250 }}>
        <div style={{ ...labela, fontSize: 10 }}>U CENU JE URAČUNATO</div>
        <div style={{ marginTop: 18 }}>
          {u.uracunato.filter((x) => x.trim()).map((x, i) => (
            <div key={i} style={{ display: "flex", gap: 0, borderBottom: "1px solid #d6d6d6", padding: "12px 0 14px" }}>
              <span style={{ width: 48, fontSize: 12, fontWeight: 700, color: "#b8935a" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 14 }}>{x}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26, background: "#f3efe7", padding: "20px 27px 18px" }}>
          <div style={{ ...labela, fontSize: 10 }}>NIJE URAČUNATO U CENU</div>
          {u.nijeUracunato.filter((x) => x.trim()).map((x, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginTop: i === 0 ? 14 : 10, fontSize: 13.5 }}><span style={{ color: "#b8935a" }}>●</span><span>{x}</span></div>
          ))}
        </div>
        <div style={{ position: "relative", height: 76, marginTop: 40 }}>
          <Polje l="PLANIRAN POČETAK RADOVA" v={u.pocetak} x={0} w={320} top={0} veliko />
          <Polje l="PLANIRANO TRAJANJE RADOVA" v={u.trajanje} x={358} w={328} top={0} veliko />
        </div>
        <div style={{ marginTop: 22, background: "#2b2b2b", color: "#fff", padding: "22px 27px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700 }}>DINAMIKA PLAĆANJA</div>
          {redovi.map((r, i) => (
            <div key={r.n} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0 12px", borderBottom: i < redovi.length - 1 ? "1px solid #505050" : "none" }}>
              <span style={{ width: 20, fontSize: 11, fontWeight: 700, color: "#c8c8c8", paddingTop: 2 }}>{r.n}</span>
              <span style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{r.naslov}</div><div style={{ fontSize: 10.5, color: "#c8c8c8", marginTop: 3 }}>{r.opis}</div></span>
              <span style={{ width: 120, fontSize: 18, fontWeight: 700 }}>{eurFmt(r.iznos) || "—"}</span>
              <span style={{ width: 40, fontSize: 10, fontWeight: 700, paddingTop: 4 }}>EUR</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 10.5, color: "#c8c8c8", lineHeight: 1.4 }}>{u.napomena}</div>
        </div>
      </div>
    </div>
  );
}
