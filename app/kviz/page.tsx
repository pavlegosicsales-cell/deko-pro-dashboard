"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui";

/*
  Kviz za Luku (25.09.2026.): stari leadovi iz IG/FB prepiske za koje ne znamo da li ih je zvao.
  Screenshot + dva dugmeta. Odgovori se pamte u telefonu (localStorage), na kraju rezime
  koji jednim tapom šalje Pavlu na WhatsApp. Bez baze, bez logina, link se samo pošalje.
*/

const LEADOVI = [
  { n: 1, ime: "Nikola (NikolaAna Jovanović Mijatović)", tel: "0677116974", info: "Zidar iz Kruševca, nudi ekipu" },
  { n: 2, ime: "Dejo", tel: "063 1402202", info: "Viber; pitao da li ga je neko zvao" },
  { n: 3, ime: "Marko (suprug Lidije Uroš…)", tel: "0649083959", info: "Siva boja bloka; traži ponudu" },
  { n: 4, ime: "Slavica Ćiri…", tel: "0648801588", info: "Ograda, cena po m², ugradnja" },
  { n: 5, ime: "Slavko (BiH)", tel: "+387 63 423 138", info: "Dva metra visine; slobodan od 11h" },
  { n: 6, ime: "Dejan Ristić", tel: "+381621615999", info: "Samo WhatsApp; 16,5 m + 16,5 m" },
  { n: 7, ime: "Dino Kozica", tel: "01739805954", info: "Nemačka; „zovite na vocap“" },
] as const;

type Odg = "zvao" | "nisam" | "nije_se_javio";
const KLJUC = "deko-kviz-odgovori";
const OZNAKA: Record<Odg, string> = { zvao: "Zvao ✅", nisam: "Nisam zvao ❌", nije_se_javio: "Zvao, nije se javio 📵" };

export default function Kviz() {
  const [i, setI] = useState(0);
  const [odg, setOdg] = useState<Record<number, Odg>>({});
  const [gotovo, setGotovo] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KLJUC);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (s) { const o = JSON.parse(s); setOdg(o); const prvi = LEADOVI.findIndex((l) => !o[l.n]); if (prvi === -1) setGotovo(true); else setI(prvi); }
    } catch { /* prazno */ }
  }, []);

  const odgovori = (o: Odg) => {
    const novo = { ...odg, [LEADOVI[i].n]: o };
    setOdg(novo);
    try { localStorage.setItem(KLJUC, JSON.stringify(novo)); } catch { /* prazno */ }
    if (i + 1 < LEADOVI.length) setI(i + 1); else setGotovo(true);
  };

  const rezime = ["Luka, stari leadovi:", ...LEADOVI.map((l) => `${l.n}. ${l.ime} (${l.tel}): ${odg[l.n] ? OZNAKA[odg[l.n]] : "—"}`)].join("\n");
  const wa = `https://wa.me/?text=${encodeURIComponent(rezime)}`;
  const l = LEADOVI[i];

  return (
    <div className="min-h-screen bg-wash">
      <header className="blueprint bg-navy px-4 pb-4 pt-5 text-white">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Logo size={40} />
          <div className="leading-none">
            <div className="nav-wordmark">Deko Pro</div>
            <div className="nav-sub mt-1">Kviz: da li si ih zvao?</div>
          </div>
          {!gotovo && <div className="ml-auto text-sm text-white/70">{i + 1} / {LEADOVI.length}</div>}
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-lg gap-1">
          {LEADOVI.map((x, k) => (
            <button key={x.n} type="button" onClick={() => { setGotovo(false); setI(k); }} aria-label={`Lead ${x.n}`}
              className={`h-1.5 flex-1 rounded-full ${odg[x.n] ? "bg-gold" : k === i && !gotovo ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-4">
        {!gotovo ? (
          <>
            <div className="card overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="h3 truncate text-[16px]">{l.ime}</div>
                  <div className="text-sm text-muted">{l.tel} · {l.info}</div>
                </div>
                <a href={`tel:${l.tel.replace(/\s/g, "")}`} className="tag tag-navy shrink-0">Pozovi</a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/kviz/${l.n}.jpg`} alt={`Prepiska: ${l.ime}`} className="max-h-[52vh] w-full bg-black object-contain object-top" />
            </div>

            <p className="mt-4 text-center text-sm text-muted">Da li si zvao ovog čoveka?</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => odgovori("zvao")} className="rounded-[10px] bg-ok px-4 py-4 text-[15px] font-semibold text-white active:scale-[.98]">Jesam, zvao sam</button>
              <button type="button" onClick={() => odgovori("nisam")} className="rounded-[10px] bg-danger px-4 py-4 text-[15px] font-semibold text-white active:scale-[.98]">Nisam zvao</button>
            </div>
            <button type="button" onClick={() => odgovori("nije_se_javio")} className="mt-2.5 w-full rounded-[10px] border border-line bg-white px-4 py-3 text-sm font-medium text-ink">Zvao sam, nije se javio</button>
            {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="mt-3 w-full text-center text-sm text-muted underline-offset-4 hover:underline">Nazad</button>}
          </>
        ) : (
          <div className="card p-5">
            <h1 className="h-display text-[22px]">Gotovo, hvala!</h1>
            <p className="mt-1 text-sm text-muted">Pošalji Pavlu rezime jednim tapom. Tap na ime menja odgovor.</p>
            <ol className="mt-4 space-y-2">
              {LEADOVI.map((x, k) => (
                <li key={x.n}>
                  <button type="button" onClick={() => { setGotovo(false); setI(k); }} className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2.5 text-left text-sm">
                    <span className="min-w-0"><b className="text-ink">{x.n}. {x.ime}</b><br /><span className="text-muted">{x.tel}</span></span>
                    <span className="shrink-0 text-[13px] font-semibold">{odg[x.n] ? OZNAKA[odg[x.n]] : "—"}</span>
                  </button>
                </li>
              ))}
            </ol>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-block mt-5" style={{ background: "#25D366" }}>
              Pošalji Pavlu na WhatsApp
              <span className="btn-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            </a>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(rezime); }} className="mt-2 w-full text-center text-sm text-muted underline-offset-4 hover:underline">ili kopiraj tekst</button>
          </div>
        )}
      </main>
    </div>
  );
}
