"use client";

import { useState } from "react";
import { posaljiKlijentu, skiniPdf, type Kanal } from "@/lib/slanje";
import { normalizujTelefon } from "@/lib/lead";

/*
  Dugmad uz svaku ponudu (Pavle, 01.10.2026.): „Sačuvaj u PDF", „WhatsApp", „Viber".
  PDF se pravi na klik (napraviPdf), otprema u storage i klijentu ode poruka sa linkom; WhatsApp ide
  pravo na broj kupca. Bez broja u bazi dugmad za slanje stoje ugašena i kažu zašto.
*/
export function PosaljiKlijentu({ telefon, napraviPdf, imeFajla, tekst, onPosle, saPdf = true, mali = false, klase, disabled }: {
  telefon: string | null | undefined;
  napraviPdf: () => Promise<Blob>;
  imeFajla: string;
  tekst: (url: string | null) => string;
  onPosle?: (kanal: Kanal | "pdf", url: string | null) => void;
  saPdf?: boolean;
  mali?: boolean;
  /** klase dugmadi, kad strana ima svoj stil (list ponude) */
  klase?: { glavno: string; tiho: string };
  disabled?: boolean;
}) {
  const [radi, setRadi] = useState<"" | Kanal | "pdf">("");
  const [poruka, setPoruka] = useState("");
  const tel = normalizujTelefon(telefon);
  const g = klase?.glavno ?? (mali ? "btn btn-sm btn-plain" : "btn btn-sm btn-plain");
  const t = klase?.tiho ?? (mali ? "btn btn-sm btn-ghost btn-plain" : "btn btn-sm btn-ghost btn-plain");
  const zauzeto = radi !== "" || !!disabled;

  const pdf = async () => {
    setRadi("pdf"); setPoruka("");
    try { skiniPdf(await napraviPdf(), imeFajla); onPosle?.("pdf", null); }
    catch (e) { console.error(e); setPoruka("PDF nije napravljen."); }
    finally { setRadi(""); }
  };
  const posalji = async (kanal: Kanal) => {
    setRadi(kanal); setPoruka("");
    try { const url = await posaljiKlijentu(kanal, tel, await napraviPdf(), imeFajla, tekst); onPosle?.(kanal, url); setPoruka(kanal === "wa" ? "Otvoren WhatsApp sa kupcem, poruka i PDF link su upisani." : "Otvoren Viber, poruka sa PDF linkom je upisana, izaberi kupca."); }
    catch (e) { console.error(e); setPoruka((e as Error).message || "Slanje nije uspelo."); }
    finally { setRadi(""); }
  };

  return (
    <span className={`inline-flex flex-wrap items-center ${mali ? "gap-1.5" : "gap-2"}`}>
      {saPdf && <button type="button" onClick={pdf} disabled={zauzeto} className={`${g} disabled:opacity-45`}>{radi === "pdf" ? "Pravim PDF…" : "Sačuvaj u PDF"}</button>}
      <button type="button" onClick={() => posalji("wa")} disabled={zauzeto || !tel} title={tel ? `WhatsApp na ${tel}` : "Nema broja kupca u bazi"} className={`${t} disabled:opacity-45`}>{radi === "wa" ? "Šaljem…" : "WhatsApp"}</button>
      <button type="button" onClick={() => posalji("viber")} disabled={zauzeto || !tel} title={tel ? "Viber (izaberi kupca u listi)" : "Nema broja kupca u bazi"} className={`${t} disabled:opacity-45`}>{radi === "viber" ? "Šaljem…" : "Viber"}</button>
      {(poruka || !tel) && <span className="w-full text-[11px] text-muted sm:w-auto">{poruka || "Kupac nema broj telefona u bazi, pa slanje nije moguće."}</span>}
    </span>
  );
}
