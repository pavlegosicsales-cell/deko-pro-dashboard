"use client";

import { useEffect, useState } from "react";

/*
  Dugme „Uključi obaveštenja" (Pavle, 02.10.2026.): svako na svom telefonu kaže ko je (Pavle / Luka / Paja),
  pregledač traži dozvolu, uređaj se upiše u `pretplate`. Paja dobija obaveštenje za novu šablon poruku,
  Pavle kad Paja odgovori. Na iPhone-u radi samo kad je panel dodat na početni ekran.
*/
const KO = [["pavle", "Pavle"], ["luka", "Luka"], ["paja", "Paja"]] as const;

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function Obavestenja() {
  const [ko, setKo] = useState<string>("");
  const [stanje, setStanje] = useState<"" | "radi" | "ukljuceno" | "nema" | "greska">("");
  const [poruka, setPoruka] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setKo(localStorage.getItem("deko.ko") ?? ""); } catch { /* prazno */ }
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) { setStanje("nema"); return; }
    navigator.serviceWorker.getRegistration("/sw.js").then((r) => r?.pushManager.getSubscription()).then((s) => { if (s) setStanje("ukljuceno"); }).catch(() => {});
  }, []);

  const ukljuci = async () => {
    if (!ko) { setPoruka("Prvo izaberi ko si."); return; }
    setStanje("radi"); setPoruka("");
    try {
      const dozvola = await Notification.requestPermission();
      if (dozvola !== "granted") throw new Error("Dozvola za obaveštenja nije data.");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const kljuc = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!kljuc) throw new Error("Nema VAPID ključa u env-u.");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(kljuc) });
      const r = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ko, pretplata: sub.toJSON() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Nije upisano.");
      try { localStorage.setItem("deko.ko", ko); } catch { /* prazno */ }
      setStanje("ukljuceno"); setPoruka("Uključeno. Probaj dugme Probna poruka.");
    } catch (e) { setStanje("greska"); setPoruka((e as Error).message); }
  };
  const proba = async () => {
    const r = await fetch("/api/push", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ko }) });
    const j = await r.json(); setPoruka(r.ok ? `Poslato na ${j.poslato} uređaj(a).` : j.error || "Nije poslato.");
  };
  const iskljuci = async () => {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js"); const sub = await reg?.pushManager.getSubscription();
    if (sub) { await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setStanje(""); setPoruka("Isključeno na ovom uređaju.");
  };

  if (stanje === "nema") return <p className="text-[12px] text-muted">Ovaj pregledač ne podržava obaveštenja. Na iPhone-u: Podeli → Dodaj na početni ekran, pa otvori odatle.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={ko} onChange={(e) => setKo(e.target.value)} className="inp inp-sm w-auto" aria-label="Ko si">
        <option value="">Ko si?</option>{KO.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {stanje === "ukljuceno"
        ? <><span className="tag tag-green"><span className="tag-dot" />Obaveštenja uključena</span><button type="button" onClick={proba} className="btn btn-sm btn-ghost">Probna poruka</button><button type="button" onClick={iskljuci} className="text-[12px] text-muted underline">isključi</button></>
        : <button type="button" onClick={ukljuci} disabled={stanje === "radi"} className="btn btn-sm">{stanje === "radi" ? "Uključujem…" : "Uključi obaveštenja na ovom uređaju"}</button>}
      {poruka && <span className={`text-[12px] ${stanje === "greska" ? "text-red" : "text-muted"}`}>{poruka}</span>}
    </div>
  );
}
