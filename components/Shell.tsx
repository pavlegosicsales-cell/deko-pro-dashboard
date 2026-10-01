"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar, Ico, I } from "@/components/Sidebar";
import { MobilniMeni } from "@/components/MobilniMeni";
import { Pretraga } from "@/components/Pretraga";
import { Logo } from "@/components/ui";

/*
  Okvir svake strane (redizajn 01.10.2026.): levi meni + gornja traka (pretraga Ctrl+K, dugme
  „Novi lead", datum) + belo zaglavlje sa naslovom i jednom rečenicom + sadržaj. Na telefonu:
  bela gornja traka sa logom, naslovom i pretragom, donji meni. Nema više foto hero-a: brže
  učitavanje i manje vizuelne buke (Promo Bet / Kendo).
*/
export function Shell({ naslov, podnaslov, akcije, deca, uRedu, login, onDodaj, siroko, children }: {
  naslov: React.ReactNode; podnaslov?: React.ReactNode; akcije?: React.ReactNode; deca?: React.ReactNode;
  uRedu: number; login?: boolean; onDodaj?: () => void; siroko?: boolean; children: React.ReactNode;
}) {
  const [pretraga, setPretraga] = useState(false);
  const danas = new Date().toLocaleDateString("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="min-h-screen bg-wash lg:pl-[var(--side-w)]">
      <Sidebar uRedu={uRedu} onDodaj={onDodaj} login={login} />
      <MobilniMeni uRedu={uRedu} />

      {/* gornja traka, desktop */}
      <header className="topbar sticky top-0 z-30 hidden h-[var(--nav-h)] items-center gap-4 px-6 lg:flex">
        <button type="button" onClick={() => setPretraga(true)} className="search-pill" aria-label="Pretraga">
          <Ico d={I.trazi} size={16} />
          <span className="flex-1">Pretraži leadove, kupce, ponude…</span>
          <span className="kbd">Ctrl K</span>
        </button>
        <span className="ml-auto text-[12.5px] capitalize text-muted">{danas}</span>
        {onDodaj
          ? <button onClick={onDodaj} className="btn btn-sm"><Ico d={I.plus} size={16} />Novi lead</button>
          : <Link href="/#novi" className="btn btn-sm"><Ico d={I.plus} size={16} />Novi lead</Link>}
      </header>

      {/* gornja traka, telefon */}
      <header className="pointer-events-none fixed inset-x-0 top-2 z-40 lg:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-3xl px-3">
          <div className="nav-bar">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Logo size={32} />
              <div className="flex min-w-0 flex-col leading-none">
                <span className="nav-wordmark">Deko Pro</span>
                <span className="nav-sub mt-0.5 truncate">{typeof naslov === "string" ? naslov : "Panel"}</span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPretraga(true)} className="btn btn-sm btn-ghost btn-icon" aria-label="Pretraga"><Ico d={I.trazi} size={17} /></button>
              {onDodaj
                ? <button onClick={onDodaj} className="btn btn-sm btn-icon" aria-label="Novi lead"><Ico d={I.plus} size={17} /></button>
                : <Link href="/#novi" className="btn btn-sm btn-icon" aria-label="Novi lead"><Ico d={I.plus} size={17} /></Link>}
            </div>
          </div>
        </div>
      </header>

      <section className="page-head">
        <div className={`mx-auto w-full px-4 pb-4 pt-[calc(var(--nav-h)+16px)] lg:px-6 lg:pb-4 lg:pt-5 ${siroko ? "" : "max-w-3xl lg:max-w-none"}`}>
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="h2">{naslov}</h1>
              {podnaslov && <p className="lead-sub mt-0.5">{podnaslov}</p>}
            </div>
            {akcije && <div className="flex flex-wrap items-center gap-2">{akcije}</div>}
          </div>
          {deca}
        </div>
      </section>

      <main className={`mx-auto w-full px-4 pb-24 pt-4 lg:px-6 lg:pb-10 lg:pt-5 ${siroko ? "" : "max-w-3xl lg:max-w-none"}`}>{children}</main>

      {pretraga && <Pretraga onClose={() => setPretraga(false)} />}
      <PrecicaPretrage onOpen={() => setPretraga(true)} />
    </div>
  );
}

/** Ctrl+K / Cmd+K otvara pretragu. */
function PrecicaPretrage({ onOpen }: { onOpen: () => void }) {
  if (typeof window !== "undefined" && !(window as Window & { __dekoPrecica?: boolean }).__dekoPrecica) {
    (window as Window & { __dekoPrecica?: boolean }).__dekoPrecica = true;
    window.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); window.dispatchEvent(new CustomEvent("deko:pretraga")); } });
  }
  if (typeof window !== "undefined") {
    const w = window as Window & { __dekoOtvori?: () => void };
    w.__dekoOtvori = onOpen;
    if (!(window as Window & { __dekoSlusa?: boolean }).__dekoSlusa) {
      (window as Window & { __dekoSlusa?: boolean }).__dekoSlusa = true;
      window.addEventListener("deko:pretraga", () => w.__dekoOtvori?.());
    }
  }
  return null;
}

/** Obaveštenje iznad sadržaja (demo, migracija, greška). `ton` bira boju po značenju. */
export function Obavestenje({ ton = "amber", naslov, children, onClose }: { ton?: "amber" | "red" | "blue" | "green"; naslov?: string; children: React.ReactNode; onClose?: () => void }) {
  const boje = { amber: "border-l-amber bg-amber-bg", red: "border-l-red bg-red-bg", blue: "border-l-blue bg-blue-bg", green: "border-l-green bg-green-bg" }[ton];
  return (
    <div role={ton === "red" ? "alert" : undefined} className={`card mb-4 flex items-start justify-between gap-3 border-l-4 p-3.5 text-[13px] ${boje}`}>
      <div className="min-w-0">{naslov && <p className="font-semibold text-ink">{naslov}</p>}<div className="text-text">{children}</div></div>
      {onClose && <button onClick={onClose} className="shrink-0 text-muted hover:text-ink" aria-label="Zatvori">×</button>}
    </div>
  );
}
