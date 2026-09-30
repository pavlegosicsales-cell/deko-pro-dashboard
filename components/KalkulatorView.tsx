"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import {
  izracunaj, ponudaTekst, ponudaTekstDelovi, internaBeleska, redoviZaVisinu, obimPlaca, izracunajPrevoz, spojiRezultate, opisDela,
  CENOVNIK, ZAVRSNE_BOJE, VRSTE, PODRAZUMEVANO, POCETNI_ULAZ,
  type Ulaz, type Podesavanja, type Boja, type BojaZavrsnih, type Rezim, type VrstaStavke,
} from "@/lib/kalkulator";
import { rsd } from "@/lib/format";
import { PONUDA_META, datumPonude, uAdresu, dekodirajDeonice, type PonudaMeta } from "@/lib/ponuda";
import { ulazIzLeada, type LeadZaProcenu } from "@/lib/procena";
import { porukaZaPaju, pajaLink, idePonudaPaji, PRAZNA_PAJA, porukaZaLarisu, larisaViberLink, LARISA_GRUPA, type PajaPolja } from "@/lib/paja";
import { izaberiPrevoznika, prevoznikLink } from "@/lib/prevoznici";

/*
  Kalkulator po pravilima iz „Deko Pro – pravila za računanje ograda, zidova i obloga" (27.09.2026.):
  tačna dužina, +5 % na svaku stavku, zaokruživanje na najbliži ceo broj, visine u celim redovima od 20 cm.
  Tri režima: ograda sa stubovima, pun zid bez stubova, dekorativna obloga.
*/

const KLJUC = "deko.kalkulator.v1";
const danasnjiDatum = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
type Sacuvano = { kad: string; u?: Ulaz; delovi?: Ulaz[]; aktivni?: number; p: Podesavanja; pon: PonudaMeta; bezTransporta: boolean; leadId?: string | null; paja?: PajaPolja; telefonKupca?: string };

/** Lead kako ga kalkulator vidi: dovoljno da popuni ponudu i poruku za Paju. */
export type LeadKratko = LeadZaProcenu & { id: string; ime: string | null; prezime: string | null; telefon: string | null; status: string; obuhvat?: string | null };
const imeLeada = (l: LeadKratko) => [l.ime, l.prezime].filter(Boolean).join(" ") || "Bez imena";

const REZIMI: { v: Rezim; l: string; opis: string }[] = [
  { v: "ograda", l: "Ograda", opis: "stubovi i polja" },
  { v: "zid", l: "Pun zid", opis: "bez stubova" },
  { v: "obloga", l: "Obloga", opis: "postojeći zid" },
  { v: "rucno", l: "Ručno", opis: "upišeš količine" },
];

function izUrla(sp: URLSearchParams): Ulaz {
  const n = (k: string, d: number) => { const v = parseFloat(sp.get(k) ?? ""); return isNaN(v) ? d : v; };
  const boja = sp.get("boja") as Boja | null;
  return {
    ...POCETNI_ULAZ,
    duzina: n("duzina", POCETNI_ULAZ.duzina),
    razmak: n("razmak", POCETNI_ULAZ.razmak),
    visinaPolja: n("vp", POCETNI_ULAZ.visinaPolja),
    visinaStuba: n("vs", POCETNI_ULAZ.visinaStuba),
    boja: boja && CENOVNIK.some((c) => c.v === boja) ? boja : POCETNI_ULAZ.boja,
    stubniBlok: sp.get("sb") !== "0",
    sirinaKapija: n("kapije", 0),
    brojKapija: n("bk", 0),
    zatvoren: sp.get("zatvoren") === "1",
    spojena: sp.get("spojena") === "1",
    bojaZavrsnih: (["siva", "crna", "bela"].includes(sp.get("bz") ?? "") ? sp.get("bz") : "siva") as BojaZavrsnih,
    ...(sp.get("deonice") ? { poDeonicama: true, deonice: dekodirajDeonice(sp.get("deonice")) } : {}),
    mesto: sp.get("mesto") ?? "",
  };
}

export function KalkulatorView({ uRedu, leadovi = [] }: { uRedu: number; leadovi?: LeadKratko[] }) {
  const sp = useSearchParams();
  /* Ponuda može imati više delova (ograda + zid, ograda drugačije visine, obloga…). Uređuje se aktivni deo;
     rezultat, prevoz i ponuda su zbir svih delova. */
  const [delovi, setDelovi] = useState<Ulaz[]>(() => [izUrla(sp)]);
  const [aktivni, setAktivni] = useState(0);
  const u = delovi[Math.min(aktivni, delovi.length - 1)];
  const setU = (f: Ulaz | ((s: Ulaz) => Ulaz)) =>
    setDelovi((d) => d.map((x, i) => (i === Math.min(aktivni, d.length - 1) ? (typeof f === "function" ? f(x) : f) : x)));
  const [p, setP] = useState<Podesavanja>(PODRAZUMEVANO);
  const [pod, setPod] = useState(false);
  const [ari, setAri] = useState("");
  const [kopirano, setKopirano] = useState<"" | "ponuda" | "beleska" | "prevoz" | "paja">("");
  const [pon, setPon] = useState<PonudaMeta>(PONUDA_META);
  const [bezTransporta, setBezTransporta] = useState(false);

  const [leadId, setLeadId] = useState<string | null>(null);
  const [trazi, setTrazi] = useState("");
  const [otvoren, setOtvoren] = useState(false);
  const [pretpostavke, setPretpostavke] = useState<string[]>([]);
  const [paja, setPaja] = useState<PajaPolja>(PRAZNA_PAJA);
  const [telefonKupca, setTelefonKupca] = useState("");
  const [vraceno, setVraceno] = useState(false);
  const prviPut = useRef(true);

  /* Izbor leada: povlači mere, boje, kapije, oblik, mesto, ime kupca i Pajina pitanja. Posle toga se sve može menjati. */
  const izabrani = leadId ? leadovi.find((l) => l.id === leadId) ?? null : null;
  const qq = trazi.trim().toLowerCase();
  const pogodjeni = qq && !(izabrani && imeLeada(izabrani).toLowerCase() === qq)
    ? leadovi.filter((l) => [imeLeada(l), l.telefon ?? "", l.lokacija ?? ""].some((x) => x.toLowerCase().includes(qq))).slice(0, 8)
    : [];
  const izaberiLead = (l: LeadKratko) => {
    const d = l.detalji ?? {};
    const x = ulazIzLeada(l);
    const rezim: Rezim = l.proizvod === "potporni_zid" ? "zid" : l.proizvod === "oblaganje" ? "obloga" : "ograda";
    setDelovi([x ? { ...x.ulaz, rezim } : { ...u, rezim, mesto: l.lokacija ?? u.mesto }]); setAktivni(0);
    setPretpostavke(x?.pretpostavke ?? (l.duzina_m ? [] : ["lead nema dužinu, mere upiši ručno"]));
    setPon((s) => ({ ...s, kupac: imeLeada(l) }));
    setPaja({ ime: imeLeada(l), lokacija: l.lokacija ?? "", temelj: d.temelj ?? "", iskop: d.iskop ?? "", cokla: d.cokla ?? "", dodatniRadovi: d.dodatni_radovi ?? "" });
    setTelefonKupca(l.telefon ?? "");
    setLeadId(l.id); setTrazi(imeLeada(l)); setOtvoren(false);
  };
  const otkaciLead = () => { setLeadId(null); setTrazi(""); setPretpostavke([]); };

  /* Unos se pamti u pregledacu, pa se vracanjem na kalkulator nista ne gubi.
     Ako adresa nosi mere (npr. klik sa kartice leada), one imaju prednost nad zapamcenim.
     Broj ponude se NE predlaze: ponude prave i ljudi van dashboarda. */
  useEffect(() => {
    // ?lead=<id> sa kartice leada: izaberi ga odmah, sve popunjeno, i ne diraj zapamćeno stanje
    const izLeada = sp.get("lead") ? leadovi.find((x) => x.id === sp.get("lead")) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (izLeada) { izaberiLead(izLeada); setPon((st) => ({ ...st, datum: datumPonude() })); return; }
    const izAdrese = ["rezim", "duzina", "razmak", "vp", "vs", "kapije", "povrsina", "boja", "mesto", "sb"]
      .some((k) => sp.get(k) !== null);
    let sacuvano: Sacuvano | null = null;
    try { sacuvano = JSON.parse(localStorage.getItem(KLJUC) || "null"); } catch { /* prazno */ }
    let sastavio = "Luka Jovanović";
    try { sastavio = localStorage.getItem("deko.ponuda.sastavio") || sastavio; } catch { /* prazno */ }
    const danas = danasnjiDatum();

    setPon((st) => ({
      ...st, ...(sacuvano?.pon ?? {}), sastavio: sacuvano?.pon?.sastavio || sastavio,
      // datum se osvezava ako je zapamceno od ranijeg dana, da se ponuda ne posalje sa starim datumom
      datum: !sacuvano || sacuvano.kad !== danas ? datumPonude() : (sacuvano.pon?.datum || datumPonude()),
    }));
    if (sacuvano) {
      if (!izAdrese && (sacuvano.delovi?.length || sacuvano.u)) {
        const lista = (sacuvano.delovi?.length ? sacuvano.delovi : [sacuvano.u as Ulaz])
          .map((d) => ({ ...POCETNI_ULAZ, ...d, rucne: d.rucne?.length ? d.rucne : POCETNI_ULAZ.rucne, deonice: d.deonice?.length ? d.deonice : POCETNI_ULAZ.deonice }));
        setDelovi(lista); setAktivni(Math.min(sacuvano.aktivni ?? 0, lista.length - 1));
      }
      if (sacuvano.p) setP((st) => ({ ...st, ...sacuvano.p }));
      setBezTransporta(!!sacuvano.bezTransporta);
      if (sacuvano.leadId) { setLeadId(sacuvano.leadId); const l = leadovi.find((x) => x.id === sacuvano!.leadId); if (l) setTrazi(imeLeada(l)); }
      if (sacuvano.paja) setPaja({ ...PRAZNA_PAJA, ...sacuvano.paja });
      if (sacuvano.telefonKupca) setTelefonKupca(sacuvano.telefonKupca);
      if (!izAdrese) setVraceno(true);
    }
  // izaberiLead se pravi u svakom renderu; u zavisnostima bi efekat vrteo setState u krug
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, leadovi]);

  // svaka izmena se odmah pamti
  useEffect(() => {
    if (prviPut.current) { prviPut.current = false; return; }
    try {
      localStorage.setItem(KLJUC, JSON.stringify({ kad: danasnjiDatum(), delovi, aktivni, p, pon, bezTransporta, leadId, paja, telefonKupca }));
    } catch { /* prazno */ }
  }, [delovi, aktivni, p, pon, bezTransporta, leadId, paja, telefonKupca]);

  const isprazni = () => {
    try { localStorage.removeItem(KLJUC); } catch { /* prazno */ }
    setDelovi([POCETNI_ULAZ]); setAktivni(0);
    setP(PODRAZUMEVANO);
    setPon({ ...PONUDA_META, datum: datumPonude(), sastavio: pon.sastavio });
    setBezTransporta(false);
    setAri("");
    setVraceno(false);
    setLeadId(null); setTrazi(""); setPaja(PRAZNA_PAJA); setPretpostavke([]); setTelefonKupca("");
  };


  const faliZaPonudu = [
    !pon.kupac.trim() && "ime i prezime kupca",
    !pon.broj.trim() && "broj ponude",
    !bezTransporta && pon.transportEur == null && "cena transporta",
  ].filter(Boolean) as string[];

  const napraviPonudu = () => {
    try { localStorage.setItem("deko.ponuda.sastavio", pon.sastavio); } catch { /* prazno */ }
    window.open(uAdresu(delovi, { ...pon, transportEur: bezTransporta ? null : pon.transportEur, leadId, telefon: telefonKupca }), "_blank");
  };
  const rDeo = izracunaj(u, p);                                   // aktivni deo, za pločice
  const rezultatiDelova = delovi.map((d) => izracunaj(d, p));
  const viseDelova = delovi.length > 1;
  const r = viseDelova ? spojiRezultate(rezultatiDelova, delovi.map(opisDela)) : rDeo;   // sve zajedno
  const tekstPonude = viseDelova ? ponudaTekstDelovi(delovi, r) : ponudaTekst(u, r);
  const uZaPaju = delovi.find((d) => d.rezim === "ograda") ?? delovi.find((d) => d.rezim === "zid") ?? u;
  const ostaliDelovi = viseDelova ? delovi.filter((d) => d !== uZaPaju).map(opisDela) : [];

  const broj = (k: keyof Ulaz) => (n: number) => setU((s) => ({ ...s, [k]: n }));
  const pbroj = (k: keyof Podesavanja) => (n: number) => setP((s) => ({ ...s, [k]: n }));
  const prevoz = izracunajPrevoz(r);
  const brFmt = (n: number) => new Intl.NumberFormat("sr-RS").format(n);
  // Poruka za prevoznika je kratka, onako kako je Pavle šalje: mesto, palete, kilaža, „Cena?“
  const prevozTekst = () => {
    const n = prevoz.palete, zadnja = n % 10, dve = n % 100;
    const rec = zadnja >= 2 && zadnja <= 4 && !(dve >= 12 && dve <= 14) ? "palete" : "paleta";
    const red: string[] = [];
    if (u.mesto.trim()) red.push(u.mesto.trim());
    red.push(`${n} ${rec}`, `${prevoz.kg}kg`, "Cena?");
    return red.join("\n");
  };

  const pajaTekst = porukaZaPaju(paja, uZaPaju, r, idePonudaPaji(paja), { eur: bezTransporta ? null : pon.transportEur, saIstovarom: pon.saIstovarom }, ostaliDelovi, tekstPonude);
  const kopiraj = async (sta: "ponuda" | "beleska" | "prevoz" | "paja") => {
    try {
      await navigator.clipboard.writeText(
        sta === "ponuda" ? tekstPonude : sta === "prevoz" ? prevozTekst() : sta === "paja" ? pajaTekst : internaBeleska(u, r));
      setKopirano(sta); setTimeout(() => setKopirano(""), 1600);
    } catch { /* prazno */ }
  };

  const ograda = u.rezim === "ograda", zid = u.rezim === "zid", obloga = u.rezim === "obloga", rucno = u.rezim === "rucno";
  const cenaBoje = CENOVNIK.find((c) => c.v === u.boja) ?? CENOVNIK[0];
  const podrazumevanaCena = (v: VrstaStavke) =>
    v === "zidni" ? cenaBoje.zidni - (p.partnerske ? 25 : 0)
    : v === "stubni" ? cenaBoje.stubni - (p.partnerske ? 10 : 0)
    : v === "kapa" ? p.cenaKapa
    : v === "okapnica" ? p.cenaOkapnica
    : (p.cenaObloga ?? 0);
  const menjajRucnu = (i: number, izmena: Partial<Ulaz["rucne"][number]>) =>
    setU((st) => ({ ...st, rucne: st.rucne.map((x, j) => (j === i ? { ...x, ...izmena } : x)) }));
  const rp = redoviZaVisinu(u.visinaPolja), rs = redoviZaVisinu(u.visinaStuba);

  return (
    <div className="min-h-screen bg-wash lg:pl-64">
      <Sidebar uRedu={uRedu} />

      <header className="pointer-events-none fixed inset-x-0 top-3 z-40 sm:top-5 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3 sm:px-4">
          <div className="nav-bar">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <Logo size={40} />
              <div className="flex min-w-0 flex-col leading-none">
                <span className="nav-wordmark">Deko Pro</span>
                <span className="nav-sub mt-1">Kalkulator</span>
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
            <span className="eyebrow"><span className="eyebrow-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4" /></svg></span>Interni panel</span>
            <h1 className="h2 lg:text-[34px]">Kalkulator</h1>
            <p className="text-sm text-white/70">{rucno ? "Sam upisuješ količine i boju, bez rezerve. Ponuda i prevoz se računaju iz toga." : "Tačna dužina, +5 % na svaku stavku, visine u celim redovima od 20 cm."}</p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-7 lg:max-w-none lg:px-8 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          {/* ---------------- Unos ---------------- */}
          <div className="card p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {REZIMI.map((x) => (
                <button key={x.v} type="button" onClick={() => setU((s) => ({ ...s, rezim: x.v }))}
                  className={`rounded-[10px] border px-2 py-2 text-center transition-colors ${u.rezim === x.v ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-accent"}`}>
                  <span className="block text-[13px] font-semibold">{x.l}</span>
                  <span className={`block text-[10px] ${u.rezim === x.v ? "text-white/70" : "text-muted"}`}>{x.opis}</span>
                </button>
              ))}
            </div>

            {viseDelova && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {delovi.map((d, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] ${i === aktivni ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}`}>
                    <button type="button" onClick={() => setAktivni(i)} className="font-semibold">{i + 1}. {opisDela(d)}</button>
                    <button type="button" aria-label="Ukloni deo" onClick={() => { setDelovi((st) => st.filter((_, j) => j !== i)); setAktivni((a) => Math.max(0, a >= i ? a - 1 : a)); }} className="opacity-70 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* izbor leada: sve što je upisano posle poziva dolazi ovde samo */}
            <div className="relative mt-4">
              <input value={trazi} onChange={(e) => { setTrazi(e.target.value); setOtvoren(true); if (leadId) setLeadId(null); }}
                onFocus={() => setOtvoren(true)} onBlur={() => setTimeout(() => setOtvoren(false), 150)}
                placeholder="Izaberi lead… (ime, telefon ili mesto)" className={`inp ${izabrani ? "pr-9 font-semibold" : ""}`} />
              {izabrani && <button type="button" onClick={otkaciLead} aria-label="Otkači lead" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-muted hover:text-ink">✕</button>}
              {otvoren && pogodjeni.length > 0 && (
                <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-[10px] border border-line bg-white shadow-lg">
                  {pogodjeni.map((l) => (
                    <button key={l.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => izaberiLead(l)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-wash">
                      <span className="text-sm font-semibold text-ink">{imeLeada(l)}</span>
                      <span className="text-[11px] text-muted">{[l.lokacija, l.duzina_m ? `${l.duzina_m} m` : null, l.telefon].filter(Boolean).join(" · ")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {izabrani && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                Povučeno iz leada. Sve ispod možeš da menjaš ručno.{pretpostavke.length > 0 && <> Pretpostavljeno: <b className="text-ink">{pretpostavke.join(", ")}</b>.</>}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              {!obloga && !rucno && !u.poDeonicama && (
                <Polje label={ograda ? "Dužina ograde (m)" : "Dužina zida (m)"} hint="sa stubovima">
                  <BrojInput decimalno={true} value={u.duzina} onChange={broj("duzina")} className="inp"  />
                </Polje>
              )}
              {ograda && <Polje label="Razmak stubova (m)" hint="svetli otvor"><BrojInput decimalno={true} value={u.razmak} onChange={broj("razmak")} className="inp"  /></Polje>}
              {!obloga && !rucno && !u.poDeonicama && (
                <Polje label={ograda ? "Visina polja (m)" : "Visina zida (m)"} hint={`${rp.redova} redova`} puno={zid}>
                  <BrojInput decimalno={true} value={u.visinaPolja} onChange={broj("visinaPolja")} className="inp"  />
                </Polje>
              )}
              {ograda && !u.poDeonicama && <Polje label="Visina stuba (m)" hint={`${rs.redova} redova`}><BrojInput decimalno={true} value={u.visinaStuba} onChange={broj("visinaStuba")} className="inp"  /></Polje>}
              {ograda && !u.poDeonicama && <Polje label="Broj kapija" hint="stub sa obe strane"><BrojInput decimalno={false} value={u.brojKapija} onChange={broj("brojKapija")} className="inp" /></Polje>}
              {ograda && !u.poDeonicama && <Polje label="Kapije, ukupna širina (m)" hint="ne zida se"><BrojInput decimalno={true} value={u.sirinaKapija} onChange={broj("sirinaKapija")} className="inp"  /></Polje>}
              {obloga && <Polje label="Površina (m²)" hint="dužina × visina, po strani"><BrojInput decimalno={true} value={u.povrsina} onChange={broj("povrsina")} className="inp"  /></Polje>}

              <Polje label="Boja bloka" puno={obloga}>
                <select value={u.boja} onChange={(e) => setU((s) => ({ ...s, boja: e.target.value as Boja }))} className="inp">
                  {CENOVNIK.map((c) => <option key={c.v} value={c.v}>{c.l} ({c.zidni}/{c.stubni})</option>)}
                </select>
              </Polje>
              {!obloga && (
                <Polje label="Boja kapa i okapnica">
                  <select value={u.bojaZavrsnih} onChange={(e) => setU((s) => ({ ...s, bojaZavrsnih: e.target.value as BojaZavrsnih }))} className="inp">
                    {ZAVRSNE_BOJE.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                </Polje>
              )}
              <Polje label="Mesto" hint="ide u naslov ponude" puno><input value={u.mesto} onChange={(e) => setU((s) => ({ ...s, mesto: e.target.value }))} className="inp" placeholder="npr. Kragujevac" /></Polje>
            </div>

            {/* ručni unos količina */}
            {rucno && (
              <div className="mt-4">
                <div className="grid grid-cols-[1fr_74px_88px_30px] gap-2 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <span>Proizvod</span><span className="text-right">Količina</span><span className="text-right">Cena</span><span />
                </div>
                <div className="mt-1.5 flex flex-col gap-2">
                  {u.rucne.map((rs, i) => (
                    <div key={i} className="grid grid-cols-[1fr_74px_88px_30px] items-center gap-2">
                      <select value={rs.vrsta} onChange={(e) => menjajRucnu(i, { vrsta: e.target.value as VrstaStavke })} className="inp inp-sm">
                        {VRSTE.map((x) => <option key={x.v} value={x.v}>{x.l} ({x.jedinica})</option>)}
                      </select>
                      <BrojInput decimalno={rs.vrsta === "obloga"} value={rs.kolicina}
                        onChange={(n) => menjajRucnu(i, { kolicina: n })} className="inp inp-sm text-right" placeholder="0" />
                      <BrojInput decimalno praznoJeNull value={rs.cena}
                        onChange={(n) => menjajRucnu(i, { cena: n })} className="inp inp-sm text-right"
                        placeholder={String(podrazumevanaCena(rs.vrsta))} />
                      <button type="button" aria-label="Ukloni stavku"
                        onClick={() => setU((st) => ({ ...st, rucne: st.rucne.filter((_, j) => j !== i) }))}
                        className="rounded-[8px] border border-line py-1.5 text-muted transition-colors hover:border-accent hover:text-ink">×</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setU((st) => ({ ...st, rucne: [...st.rucne, { vrsta: "zidni", kolicina: 0, cena: null }] }))}
                  className="btn btn-sm btn-plain mt-2 w-full">+ Dodaj stavku</button>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Količine idu tačno onako kako ih upišeš, <b className="text-ink">bez rezerve od 5 %</b>.
                  Cena je iz cenovnika za izabranu boju; upiši svoju samo ako se razlikuje. Obloga se unosi u m².
                </p>
              </div>
            )}

            {/* deonice: visina nije ista na celoj ogradi */}
            {(ograda || zid) && (
              <div className="mt-4">
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.poDeonicama} onChange={(e) => setU((s) => ({ ...s, poDeonicama: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  {ograda ? "Visina nije ista na celoj ogradi" : "Visina nije ista na celom zidu"} <span className="text-muted">(deonice)</span>
                </label>
                {u.poDeonicama && (
                  <div className="mt-2">
                    <div className={`grid gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${ograda ? "grid-cols-[1fr_1fr_1fr_56px_1fr_26px]" : "grid-cols-[1fr_1fr_26px]"}`}>
                      <span>Dužina m</span><span>{ograda ? "Polje m" : "Visina m"}</span>
                      {ograda && <><span>Stub m</span><span>Kap.</span><span>Kapije m</span></>}<span />
                    </div>
                    <div className="mt-1 flex flex-col gap-1.5">
                      {u.deonice.map((d, i) => {
                        const men = (izm: Partial<typeof d>) => setU((s) => ({ ...s, deonice: s.deonice.map((x, j) => (j === i ? { ...x, ...izm } : x)) }));
                        return (
                          <div key={i} className={`grid items-center gap-1.5 ${ograda ? "grid-cols-[1fr_1fr_1fr_56px_1fr_26px]" : "grid-cols-[1fr_1fr_26px]"}`}>
                            <BrojInput decimalno value={d.duzina} onChange={(n) => men({ duzina: n })} className="inp inp-sm" />
                            <BrojInput decimalno value={d.visinaPolja} onChange={(n) => men({ visinaPolja: n })} className="inp inp-sm" />
                            {ograda && <>
                              <BrojInput decimalno value={d.visinaStuba} onChange={(n) => men({ visinaStuba: n })} className="inp inp-sm" />
                              <BrojInput decimalno={false} value={d.brojKapija} onChange={(n) => men({ brojKapija: n })} className="inp inp-sm" />
                              <BrojInput decimalno value={d.sirinaKapija} onChange={(n) => men({ sirinaKapija: n })} className="inp inp-sm" />
                            </>}
                            <button type="button" aria-label="Ukloni deonicu" disabled={u.deonice.length <= 1}
                              onClick={() => setU((s) => ({ ...s, deonice: s.deonice.filter((_, j) => j !== i) }))}
                              className="rounded-[8px] border border-line py-1 text-muted hover:border-accent hover:text-ink disabled:opacity-30">×</button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted">Ukupno <b className="text-ink">{Math.round(u.deonice.reduce((a, d) => a + (d.duzina || 0), 0) * 100) / 100} m</b>. Stub na spoju deonica je zajednički.</span>
                      <button type="button" onClick={() => setU((s) => ({ ...s, deonice: [...s.deonice, { ...s.deonice[s.deonice.length - 1], duzina: 0 }] }))} className="btn btn-sm btn-plain">+ Deonica</button>
                    </div>
                    {u.deonice.some((d) => !redoviZaVisinu(d.visinaPolja).jeCeo || (ograda && !redoviZaVisinu(d.visinaStuba).jeCeo)) && (
                      <p className="mt-2 text-[11px] text-muted">Neka visina nije ceo broj redova od 20 cm; kalkulator uzima niži ceo broj redova.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* opcije visine kad nije ceo broj redova */}
            {!obloga && !rucno && !u.poDeonicama && !rp.jeCeo && (
              <Opcije naslov={ograda ? "Visina polja nije ceo broj redova" : "Visina zida nije ceo broj redova"}
                opcije={rp.opcije} izaberi={(v) => setU((s) => ({ ...s, visinaPolja: v }))} />
            )}
            {ograda && !u.poDeonicama && !rs.jeCeo && (
              <Opcije naslov="Visina stuba nije ceo broj redova" opcije={rs.opcije} izaberi={(v) => setU((s) => ({ ...s, visinaStuba: v }))} />
            )}

            {ograda && (
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex items-start gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.stubniBlok} onChange={(e) => setU((s) => ({ ...s, stubniBlok: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-[#0B1E3B]" />
                  <span>
                    Koristi stubni blok <span className="text-muted">(39 × 39)</span>
                    {!u.stubniBlok && <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
                      Isključeno: i stubovi se zidaju zidnim blokom. Tako se radi kad je cokla 20 ili 30 cm, pa bi stubni blok od 40 cm virio.
                    </span>}
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.zatvoren} onChange={(e) => setU((s) => ({ ...s, zatvoren: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Zatvoren obim placa (stubova koliko i polja)
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={u.spojena} onChange={(e) => setU((s) => ({ ...s, spojena: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Nastavlja se na drugu ogradu (stub na spoju zajednički)
                </label>
              </div>
            )}
            {zid && (
              <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
                <input type="checkbox" checked={u.saOkapnicama} onChange={(e) => setU((s) => ({ ...s, saOkapnicama: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                Sa okapnicama (preporučeno)
              </label>
            )}

            {/* plac u arima */}
            {ograda && (
              <div className="mt-4 rounded-[10px] bg-wash p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Plac u arima → obim</div>
                <div className="mt-2 flex items-center gap-2">
                  <input inputMode="decimal" value={ari} onChange={(e) => setAri(e.target.value)} placeholder="npr. 5" className="inp inp-sm w-24" />
                  <span className="text-sm text-muted">ari ≈</span>
                  <b className="text-sm text-ink">{ari ? `${obimPlaca(parseFloat(ari.replace(",", ".")) || 0)} m` : "—"}</b>
                  {ari && (
                    <button type="button" onClick={() => setU((s) => ({ ...s, duzina: obimPlaca(parseFloat(ari.replace(",", ".")) || 0), zatvoren: true }))}
                      className="btn btn-sm btn-plain ml-auto">Upiši</button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Kvadratni plac. Duguljast ima veći obim, uvek tražiti stvarne mere.</p>
              </div>
            )}

            {vraceno && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-wash px-3 py-2.5 text-[12px] text-muted">
                <span>Vraćeno ono što si poslednji put upisao.</span>
                <button type="button" onClick={isprazni} className="font-semibold text-ink underline underline-offset-2">Isprazni</button>
              </div>
            )}

            <button type="button" onClick={() => setPod((o) => !o)} className="mt-4 flex w-full items-center justify-between rounded-[10px] border border-dashed border-line px-3 py-2.5 text-left text-sm font-semibold text-ink">
              Pretpostavke <span className="font-normal text-muted">(modul, cene, rezerva)</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${pod ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {pod && (
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-[10px] bg-wash p-3">
                <Polje label="Rezerva (%)" hint="pravilo: 5"><BrojInput decimalno={true} value={p.rezervaPct} onChange={pbroj("rezervaPct")} className="inp inp-sm"  /></Polje>
                <Polje label="Modul dužine (m)" hint="blok + fuga"><BrojInput decimalno={true} value={p.modulDuzina} onChange={pbroj("modulDuzina")} className="inp inp-sm"  /></Polje>
                <Polje label="Modul visine (m)" hint="red + fuga"><BrojInput decimalno={true} value={p.modulVisina} onChange={pbroj("modulVisina")} className="inp inp-sm"  /></Polje>
                <Polje label="Širina stuba (m)"><BrojInput decimalno={true} value={p.modulStub} onChange={pbroj("modulStub")} className="inp inp-sm"  /></Polje>
                <Polje label="Zidnih u redu stuba" hint="kad nema stubnog"><BrojInput decimalno={false} value={p.blokovaPoReduStuba} onChange={pbroj("blokovaPoReduStuba")} className="inp inp-sm" /></Polje>
                <Polje label="Okapnica (RSD)"><BrojInput decimalno={false} value={p.cenaOkapnica} onChange={pbroj("cenaOkapnica")} className="inp inp-sm"  /></Polje>
                <Polje label="Kapa (RSD)"><BrojInput decimalno={false} value={p.cenaKapa} onChange={pbroj("cenaKapa")} className="inp inp-sm"  /></Polje>
                <Polje label="Obloga (RSD/m²)" hint="1.174 sa PDV-om" puno>
                  <BrojInput decimalno value={p.cenaObloga} praznoJeNull placeholder="prazno = ne računaj"
                    onChange={(n) => setP((s) => ({ ...s, cenaObloga: n }))} className="inp inp-sm" />
                </Polje>
                <label className="col-span-2 flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={p.partnerske} onChange={(e) => setP((s) => ({ ...s, partnerske: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Partnerske cene (interno: zidni −25, stubni −10 RSD)
                </label>
              </div>
            )}

            {/* još jedan deo u istoj ponudi: ograda + zid, ili ograda drugačije visine (Pavle, 30.09.2026.) */}
            <div className="mt-4 rounded-[10px] border border-dashed border-line p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Dodaj deo u ovu ponudu</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Kad kupac ima i zid i ogradu, ili ogradu različitih visina. Stavke svih delova se sabiraju u jednu ponudu.</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {REZIMI.map((x) => (
                  <button key={x.v} type="button"
                    onClick={() => { setDelovi((st) => [...st, { ...POCETNI_ULAZ, rezim: x.v, boja: u.boja, bojaZavrsnih: u.bojaZavrsnih, mesto: u.mesto }]); setAktivni(delovi.length); }}
                    className="rounded-[10px] border border-line bg-white px-2 py-2 text-[13px] font-semibold text-ink hover:border-accent">+ {x.l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ---------------- Rezultat ---------------- */}
          <div className="flex flex-col gap-4">
            {viseDelova && (
              <div className="card flex flex-wrap gap-x-4 gap-y-1 p-3 text-xs text-muted">
                {delovi.map((d, i) => (
                  <button key={i} type="button" onClick={() => setAktivni(i)} className={i === aktivni ? "text-ink" : ""}>
                    {i + 1}. <b className="text-ink">{opisDela(d)}</b> · {rsd(rezultatiDelova[i].ukupno)}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ograda && <>
                <Plocica label="Polja" value={String(rDeo.polja)} sub={`razmak ${rDeo.stvarniRazmak} m`} />
                <Plocica label="Stubova" value={String(rDeo.stubovi)} sub={`${rDeo.redovaStuba} redova`} />
                <Plocica label="Zidani deo" value={`${rDeo.duzinaZida} m`} sub={`${rDeo.redovaPolja} redova · ${rDeo.m2} m²`} />
              </>}
              {zid && <>
                <Plocica label="Dužina" value={`${rDeo.duzinaZida} m`} sub={`${rDeo.redovaPolja} redova`} />
                <Plocica label="Površina" value={`${rDeo.m2} m²`} sub="12,5 kom/m²" />
                <Plocica label="Redova" value={String(rDeo.redovaPolja)} sub="po 20 cm" />
              </>}
              {obloga && <>
                <Plocica label="Površina" value={`${rDeo.m2} m²`} sub="po strani" />
                <Plocica label="Obloga" value={String(rDeo.stavke[0]?.kom ?? 0)} sub={`12,5 kom/m² + 5 % = ${rDeo.stavke[0]?.dodatak ?? "—"}`} />
                <Plocica label="Težina" value={`≈ ${new Intl.NumberFormat("sr-RS").format(rDeo.tezinaKg)} kg`} sub="6 kg/kom" />
              </>}
              {rucno && <>
                <Plocica label="Stavki" value={String(rDeo.stavke.length)} sub="u ponudi" />
                <Plocica label="Komada" value={new Intl.NumberFormat("sr-RS").format(rDeo.stavke.reduce((a, x) => a + x.kom, 0))} sub="svih stavki" />
                <Plocica label="Težina" value={`≈ ${new Intl.NumberFormat("sr-RS").format(rDeo.tezinaKg)} kg`} sub={`${rDeo.palete} paleta`} />
              </>}
              <Plocica label="Ukupno" value={r.cenaNepotpuna ? "—" : rsd(r.ukupno)} sub={r.cenaNepotpuna ? "cena nije potvrđena" : "materijal sa PDV-om"} zlato />
            </div>

            {r.napomene.length > 0 && (
              <div className="card border-l-4 border-l-gold p-3 text-sm">
                {r.napomene.map((n) => <p key={n} className="text-ink">{n}</p>)}
              </div>
            )}

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted [&>th]:whitespace-nowrap">
                    <th className="px-4 py-2.5 font-semibold">Naziv proizvoda</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Kom</th>
                    <th className="px-2 py-2.5 text-right font-semibold">Cena</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  {r.stavke.map((s) => (
                    <tr key={s.naziv} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink">{s.naziv} <span className="text-muted">{s.opis}</span></td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums">{s.kom}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-muted">{s.cena ?? "—"}{s.cena != null && s.jedinicaCene ? <span className="text-[11px]"> /{s.jedinicaCene}</span> : null}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{s.ukupno != null ? rsd(s.ukupno) : "[proveriti]"}</td>
                    </tr>
                  ))}
                  <tr className="bg-wash/70">
                    <td className="px-4 py-2.5 font-semibold text-ink" colSpan={3}>Svega</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-display text-[17px] font-bold tabular-nums text-navy">{rsd(r.ukupno)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
                <span>
                  {rucno ? <>Količine su upisane ručno, <b className="text-ink">bez rezerve</b></> : <>Rezerva <b className="text-ink">+{p.rezervaPct} %</b> na svaku stavku</>}
                </span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => kopiraj("beleska")} className="btn btn-sm btn-ghost btn-plain">{kopirano === "beleska" ? "Kopirano ✓" : "Beleška za nas"}</button>
                  <button type="button" onClick={() => kopiraj("ponuda")} className="btn btn-sm btn-plain">{kopirano === "ponuda" ? "Kopirano ✓" : "Kopiraj ponudu"}</button>
                </span>
              </div>
            </div>

            {/* prevoz: palete i kilogrami, za dogovor sa prevoznikom */}
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Prevoz — za dostavljača</div>
                <span className="text-[11px] text-muted">palete se zaokružuju naviše</span>
              </div>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-y border-line bg-wash/70 text-left text-[11px] uppercase tracking-wider text-muted [&>th]:whitespace-nowrap">
                    <th className="px-4 py-2 font-semibold">Proizvod</th>
                    <th className="px-2 py-2 text-right font-semibold">Kom</th>
                    <th className="px-2 py-2 text-right font-semibold">Palete</th>
                    <th className="px-4 py-2 text-right font-semibold">Kg</th>
                  </tr>
                </thead>
                <tbody>
                  {prevoz.redovi.map((x) => (
                    <tr key={x.naziv} className="border-b border-line last:border-0">
                      <td className="px-4 py-2 text-ink">{x.naziv} <span className="text-muted">{x.poPaleti}/paleta · {x.kgPoKom} kg</span></td>
                      <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{brFmt(x.kom)}</td>
                      <td className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums">{x.palete}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{brFmt(x.kg)}</td>
                    </tr>
                  ))}
                  <tr className="bg-wash/70">
                    <td className="px-4 py-2.5 font-semibold text-ink">Svega</td>
                    <td />
                    <td className="whitespace-nowrap px-2 py-2.5 text-right font-display text-[17px] font-bold tabular-nums text-navy">{prevoz.palete}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-display text-[17px] font-bold tabular-nums text-navy">{brFmt(prevoz.kg)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-line px-4 py-3 text-xs text-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>≈ <b className="text-ink">{(prevoz.kg / 1000).toFixed(1).replace(".", ",")} t</b>. Pošalji prevozniku, pa cenu upiši dole u ponudu.</span>
                  <button type="button" onClick={() => kopiraj("prevoz")} className="btn btn-sm btn-ghost btn-plain">{kopirano === "prevoz" ? "Kopirano ✓" : "Kopiraj"}</button>
                </div>
                {/* kalkulator sam bira prevoznika po paletama i kilaži (Pavle, 30.09.2026.): bez nuđenja opcija */}
                {(() => {
                  const iz = izaberiPrevoznika(prevoz.palete, prevoz.kg, bezTransporta ? undefined : pon.saIstovarom);
                  return (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-wash px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-ink">Ide {iz.prevoznik.vokativ === "Marko" ? "Marku" : iz.prevoznik.vokativ === "Miloše" ? "Milošu" : "Rocku"} <span className="font-normal text-muted">· {iz.prevoznik.opis}</span></div>
                        <div className="text-[11px] text-muted">{iz.razlog}{iz.viseTura ? "" : "."}</div>
                      </div>
                      <a href={prevoznikLink(iz.prevoznik, prevozTekst())} target="_blank" rel="noreferrer" className="btn btn-sm">
                        Pošalji {iz.prevoznik.ime === "Miloš" ? "Milošu" : iz.prevoznik.ime === "Marko" ? "Marku" : "Rocku"} na WhatsApp
                      </a>
                    </div>
                  );
                })()}
              </div>
              {prevoz.napomene.length > 0 && (
                <div className="border-t border-line bg-wash/50 px-4 py-2.5 text-[11px] leading-relaxed text-muted">
                  {prevoz.napomene.map((n) => <p key={n}>{n}</p>)}
                </div>
              )}
            </div>

            {/* poruka za Paju: ponude za ugradnju (WhatsApp) */}
            {(ograda || zid) && (
              <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Poruka za Paju</div>
                  <span className="text-[11px] text-muted">ponude za ugradnju · WhatsApp +381 63 1781032</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Polje label="Ime i prezime kupca" hint="naslov poruke"><input value={paja.ime} onChange={(e) => setPaja((s) => ({ ...s, ime: e.target.value }))} className="inp inp-sm" /></Polje>
                  <Polje label="Lokacija"><input value={paja.lokacija} onChange={(e) => setPaja((s) => ({ ...s, lokacija: e.target.value }))} className="inp inp-sm" /></Polje>
                  <Polje label="Temelj">
                    <select value={paja.temelj} onChange={(e) => setPaja((s) => ({ ...s, temelj: e.target.value }))} className="inp inp-sm">
                      <option value="">—</option>
                      {["Ima temelj", "Uradiće sam", "Treba mu temelj"].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Polje>
                  <Polje label="Postoji iskop">
                    <select value={paja.iskop} onChange={(e) => setPaja((s) => ({ ...s, iskop: e.target.value }))} className="inp inp-sm">
                      <option value="">—</option><option value="Da">Da</option><option value="Ne">Ne</option>
                    </select>
                  </Polje>
                  <Polje label="Cokla pripremljena">
                    <select value={paja.cokla} onChange={(e) => setPaja((s) => ({ ...s, cokla: e.target.value }))} className="inp inp-sm">
                      <option value="">—</option><option value="Da">Da</option><option value="Ne">Ne</option>
                    </select>
                  </Polje>
                  <Polje label="Dodatni radovi"><input value={paja.dodatniRadovi} onChange={(e) => setPaja((s) => ({ ...s, dodatniRadovi: e.target.value }))} className="inp inp-sm" placeholder="nista" /></Polje>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  {idePonudaPaji(paja)
                    ? <>Klijent ima temelj ili ga radi sam: uz specifikaciju ide i <b className="text-ink">ponuda za materijal i dostavu</b> (Pajino pravilo).</>
                    : paja.temelj ? <>Klijentu treba temelj: Paji ide <b className="text-ink">samo specifikacija</b>.</> : <>Izaberi temelj da se zna ide li i ponuda za materijal.</>}
                </p>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-[10px] bg-wash p-3 font-sans text-[12px] leading-snug text-ink">{pajaTekst}</pre>
                <div className="mt-3 flex gap-2">
                  <a href={pajaLink(pajaTekst)} target="_blank" rel="noreferrer" className="btn btn-sm flex-1 justify-center text-center">Pošalji Paji na WhatsApp</a>
                  <button type="button" onClick={() => kopiraj("paja")} className="btn btn-sm btn-plain">{kopirano === "paja" ? "Kopirano ✓" : "Kopiraj"}</button>
                </div>
                <p className="mt-2 text-[11px] text-muted">WhatsApp link nosi samo tekst. PDF ponude, ako treba, prikači u razgovoru posle „Sačuvaj u PDF“.</p>
              </div>
            )}

            {/* zvanična ponuda po templateu 184/26 */}
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Zvanična ponuda (PDF)</div>
                <span className="text-[11px] text-muted">PromoBet, izgled kao ponuda 184/26</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Polje label="Ime i prezime kupca" puno>
                  <input value={pon.kupac} onChange={(e) => setPon((s) => ({ ...s, kupac: e.target.value }))} className="inp" placeholder="npr. Miloš Obilić" />
                </Polje>
                <Polje label="Broj ponude" hint="obavezno, upiši ručno">
                  <input value={pon.broj} onChange={(e) => setPon((s) => ({ ...s, broj: e.target.value }))} className="inp" placeholder="npr. 185/26" />
                </Polje>
                <Polje label="Datum">
                  <input value={pon.datum} onChange={(e) => setPon((s) => ({ ...s, datum: e.target.value }))} className="inp" />
                </Polje>
                <Polje label="Transport (€)" hint="dogovor sa dostavljačem">
                  <BrojInput decimalno praznoJeNull value={pon.transportEur} onChange={(n) => setPon((s) => ({ ...s, transportEur: n }))}
                    className={`inp ${bezTransporta ? "opacity-40" : ""}`} placeholder="npr. 260" />
                </Polje>
                <Polje label="Ponudu sastavio">
                  <input value={pon.sastavio} onChange={(e) => setPon((s) => ({ ...s, sastavio: e.target.value }))} className="inp" />
                </Polje>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={pon.saIstovarom} disabled={bezTransporta}
                    onChange={(e) => setPon((s) => ({ ...s, saIstovarom: e.target.checked }))} className="h-4 w-4 accent-[#0B1E3B]" />
                  Sa istovarom <span className="text-muted">{pon.saIstovarom ? "(u ponudi: „sa istovarom“)" : "(u ponudi: „bez istovara“)"}</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input type="checkbox" checked={bezTransporta} onChange={(e) => setBezTransporta(e.target.checked)} className="h-4 w-4 accent-[#0B1E3B]" />
                  Bez transporta, kupac preuzima u Mladenovcu
                </label>
              </div>
              <button type="button" onClick={napraviPonudu} disabled={faliZaPonudu.length > 0}
                className="btn mt-3 w-full disabled:cursor-not-allowed disabled:opacity-45">
                Napravi ponudu
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {faliZaPonudu.length > 0
                  ? <>Fali: <b className="text-ink">{faliZaPonudu.join(", ")}</b>.</>
                  : <>{"Otvara se list ponude, pa „Štampaj / Sačuvaj kao PDF“. Kapije, ispune, temelj i ugradnja se ne unose ovde."}</>}
              </p>
            </div>

            {/* Larisa: predračun za kupca kad je posao samo materijal i prevoz */}
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Poruka za Larisu</div>
                <span className="text-[11px] text-muted">finansije · predračun za kupca</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                {izabrani?.obuhvat === "kljuc_u_ruke"
                  ? <>Ovaj lead je <b className="text-ink">ključ u ruke</b>: prvo Paji za ugradnju, pa kad stigne i ta ponuda, kupcu.</>
                  : <>Kad je posao <b className="text-ink">samo materijal i prevoz</b>: poruka + PDF ponude idu u Viber grupu „{LARISA_GRUPA}“, Larisa pravi predračun, predračun ide kupcu.</>}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Polje label="Ime i prezime kupca"><input value={pon.kupac} onChange={(e) => setPon((s) => ({ ...s, kupac: e.target.value }))} className="inp inp-sm" /></Polje>
                <Polje label="Telefon kupca"><input value={telefonKupca} onChange={(e) => setTelefonKupca(e.target.value)} inputMode="tel" className="inp inp-sm" placeholder="06x xxx xxxx" /></Polje>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-[10px] bg-wash p-3 font-sans text-[12px] leading-snug text-ink">{porukaZaLarisu(pon.kupac, telefonKupca)}</pre>
              <div className="mt-3 flex gap-2">
                <a href={larisaViberLink(porukaZaLarisu(pon.kupac, telefonKupca))} className="btn btn-sm flex-1 justify-center text-center">Pošalji u Viber grupu</a>
                <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(porukaZaLarisu(pon.kupac, telefonKupca)); setKopirano("beleska"); setTimeout(() => setKopirano(""), 1600); } catch { /* prazno */ } }}
                  className="btn btn-sm btn-plain">Kopiraj</button>
              </div>
              <p className="mt-2 text-[11px] text-muted">Poruka i PDF <b className="text-ink">zajedno</b> idu sa strane ponude: „Napravi ponudu“ → „Larisi u Viber grupu (poruka + PDF)“. Ovo dugme šalje samo tekst u grupu „{LARISA_GRUPA}“.</p>
            </div>

            <div className="card p-4 text-xs leading-relaxed text-muted">
              <b className="text-ink">Nije uključeno:</b> temelj, prevoz, ugradnja, alu paneli i ispune, kapije. To dodaje Luka.<br />
              <b className="text-ink">Kako računa:</b> polja = zaokruži((dužina − 0,4) / (razmak + 0,4)), stubova = polja + 1 (zatvoren obim: stubova = polja);
              zidani deo = dužina − stubovi × 0,4 − širina kapija; zidni blok 12,5 kom/m² (lice 20 × 40 cm), stubni 1 po redu stuba,
              okapnica 2 kom po metru, kapa 1 po stubu. Na sve ide +5 %, pa se zaokružuje na najbliži ceo broj.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Brojno polje koje pamti TEKST koji kucaš.
   Ranije je value bio broj, pa je parseFloat("2,") dao 2 i render je odmah brisao zapetu:
   nije se moglo upisati 2,8 ni 0,5. Sada se zapeta i točka drže do kraja unosa. */
function BrojInput<T extends number | null>({
  value, onChange, decimalno = true, praznoJeNull, className = "inp", placeholder, id,
}: {
  value: T;
  onChange: (n: T) => void;
  decimalno?: boolean;
  praznoJeNull?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}) {
  const kaoTekst = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  const [txt, setTxt] = useState(() => kaoTekst(value));
  const zadnji = useRef<number | null>(value);

  // Kad vrednost promeni nešto drugo (npr. dugme „Upiši" ili opcija visine), osveži tekst.
  useEffect(() => {
    if (value !== zadnji.current) { zadnji.current = value; setTxt(kaoTekst(value)); }
  }, [value]);

  const dozvoljeno = decimalno ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/;

  const menjaj = (v: string) => {
    if (!dozvoljeno.test(v)) return;           // slova i višak separatora se ignorišu
    setTxt(v);
    const n = parseFloat(v.replace(",", "."));
    const nova = (isNaN(n) ? (praznoJeNull ? null : 0) : n) as T;
    zadnji.current = nova;
    onChange(nova);
  };

  // Na izlazu iz polja počisti „2," i „,5" u „2" i „0,5".
  const pocisti = () => {
    const c = kaoTekst(zadnji.current);
    if (c !== txt) setTxt(c);
  };

  return (
    <input id={id} type="text" inputMode={decimalno ? "decimal" : "numeric"} value={txt}
      onChange={(e) => menjaj(e.target.value)} onBlur={pocisti}
      placeholder={placeholder} className={className} />
  );
}

function Opcije({ naslov, opcije, izaberi }: { naslov: string; opcije: { redova: number; visina: number }[]; izaberi: (v: number) => void }) {
  return (
    <div className="mt-3 rounded-[10px] border border-warn/30 bg-warn/5 p-3">
      <div className="text-sm font-semibold text-warn">{naslov}</div>
      <p className="mt-0.5 text-xs text-ink">Nema pola reda. Ponudi klijentu jednu od dve najbliže visine:</p>
      <div className="mt-2 flex gap-2">
        {opcije.map((o) => (
          <button key={o.redova} type="button" onClick={() => izaberi(o.visina)} className="btn btn-sm btn-ghost btn-plain">
            {o.redova} redova = {o.visina} m
          </button>
        ))}
      </div>
    </div>
  );
}

function Polje({ label, hint, children, puno }: { label: string; hint?: string; children: React.ReactNode; puno?: boolean }) {
  return (
    <label className={`field ${puno ? "col-span-2" : ""}`}>
      <span>{label}{hint && <span className="ml-1 font-normal text-muted">({hint})</span>}</span>
      {children}
    </label>
  );
}

function Plocica({ label, value, sub, zlato }: { label: string; value: string; sub?: string; zlato?: boolean }) {
  return (
    <div className={`card p-3.5 ${zlato ? "border-l-4 border-l-gold" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 font-display font-bold leading-none tabular-nums ${value.length > 9 ? "text-[20px]" : "text-[26px]"} ${zlato ? "text-gold-deep" : "text-navy"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
