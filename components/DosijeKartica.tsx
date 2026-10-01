"use client";

import { useState } from "react";
import Link from "next/link";
import { izracunaj, spojiRezultate, opisDela, izracunajPrevoz, PODRAZUMEVANO, POCETNI_ULAZ, type Ulaz } from "@/lib/kalkulator";
import { uAdresu, datumPonude, PONUDA_META, type SacuvanaPonuda } from "@/lib/ponuda";
import { izaberiPrevoznika, prevoznikLink, porukaPrevozu, dativ } from "@/lib/prevoznici";
import { rsd } from "@/lib/format";
import { eurFmt, imeFajlaUgradnje } from "@/lib/ugradnja";
import { napraviUgradnjaPdf } from "@/lib/ugradnjaPdf";
import { napraviPonudaPdf, imeFajla } from "@/lib/ponudaPdf";
import { porukaMaterijal, porukaUgradnja, metaPonude, telIzAdrese, bajtoviSlike } from "@/lib/slanje";
import { PosaljiKlijentu } from "@/components/PosaljiKlijentu";
import { kadFmt, cekaPrevoz, type Dosije } from "@/lib/dosije";

/*
  Kartica dosijea (Pavle, 01.10.2026.: „treba mi sve na jednom mestu, šta fali za kog klijenta").
  Tri reda statusa: ponuda za materijal, prevoz, ugradnja (Paja). Crveno = fali, zlatno = čeka se,
  tamno = gotovo. Kad se čeka cena prevoza, cena se upiše ovde i ponuda ide na jedno dugme.
*/

/** Ulaz iz baze može biti stariji (bez novijih polja): dopuni podrazumevanim. */
export const normalizujUlaz = (d: Partial<Ulaz>): Ulaz => ({
  ...POCETNI_ULAZ, ...d,
  rucne: d.rucne?.length ? d.rucne : POCETNI_ULAZ.rucne,
  deonice: d.deonice?.length ? d.deonice : POCETNI_ULAZ.deonice,
  ispravke: d.ispravke ?? {},
});

export type LeadZaDosije = { obuhvat?: string | null; status?: string | null };

type Stanje = "ok" | "ceka" | "fali" | "nema";
function Red({ naslov, stanje, tekst, akcija }: { naslov: string; stanje: Stanje; tekst: React.ReactNode; akcija?: React.ReactNode }) {
  // boje po značenju (01.10.2026.): zeleno = gotovo, žuto = čeka drugu stranu, crveno = fali, sivo = nije potrebno
  const boja = stanje === "ok" ? "tag-green" : stanje === "ceka" ? "tag-yellow" : stanje === "fali" ? "tag-red" : "tag-grey";
  const znak = stanje === "ok" ? "✓" : stanje === "ceka" ? "…" : stanje === "fali" ? "!" : "–";
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line py-2 text-[12.5px] first:border-0">
      <span className={`tag ${boja} min-w-[96px] justify-center py-0.5 text-[11px] font-semibold`}>{znak} {naslov}</span>
      <span className="min-w-0 flex-1 text-ink">{tekst}</span>
      {akcija}
    </div>
  );
}

export function DosijeKartica({ d, ponude, lead, onOtvori, onObrisi }: {
  d: Dosije; ponude: SacuvanaPonuda[]; lead?: LeadZaDosije | null;
  onOtvori?: (d: Dosije) => void; onObrisi?: (d: Dosije) => void;
}) {
  const s = d.stanje;
  const delovi = (s?.delovi?.length ? s.delovi : []).map(normalizujUlaz);
  const p = { ...PODRAZUMEVANO, ...(s?.p ?? {}) };
  const rezultati = delovi.map((x) => izracunaj(x, p));
  const r = rezultati.length > 1 ? spojiRezultate(rezultati, delovi.map(opisDela)) : rezultati[0] ?? null;
  const prevoz = r ? izracunajPrevoz(r) : null;

  // polja koja se popune kad stigne cena prevoza; tekst se pamti kakav se kuca, da zapeta ne nestane
  const [broj, setBroj] = useState(s?.pon?.broj ?? "");
  const [transport, setTransport] = useState(d.transport_eur != null ? String(d.transport_eur).replace(".", ",") : "");
  const [saIstovarom, setSaIstovarom] = useState(d.sa_istovarom ?? s?.pon?.saIstovarom ?? true);
  const [bezTransporta, setBezTransporta] = useState(!!s?.bezTransporta);
  const eur = parseFloat(transport.replace(",", "."));
  const imaTransport = bezTransporta || (!isNaN(eur) && eur > 0);
  const fali = [!broj.trim() && "broj ponude", !imaTransport && "cena transporta"].filter(Boolean) as string[];

  const mesto = d.mesto ?? delovi[0]?.mesto ?? "";
  const kupac = d.kupac;
  const telefon = d.telefon ?? s?.telefonKupca ?? (ponude.length ? telIzAdrese(ponude[0].adresa) : null);
  const trebaUgradnja = !lead || (lead.obuhvat !== "materijal" && lead.obuhvat !== "materijal_prevoz");
  const ceka = cekaPrevoz(d);

  const napraviPonudu = () => {
    if (!s || fali.length) return;
    const sastavio = s.pon?.sastavio || "Luka Jovanović";
    try { localStorage.setItem("deko.ponuda.sastavio", sastavio); } catch { /* prazno */ }
    window.open(uAdresu(delovi, {
      ...PONUDA_META, ...(s.pon ?? {}), broj: broj.trim(), datum: datumPonude(), kupac: s.pon?.kupac?.trim() || kupac, sastavio,
      transportEur: bezTransporta ? null : eur, saIstovarom,
      leadId: s.leadId ?? d.lead_id ?? null, telefon: s.telefonKupca ?? d.telefon ?? "", dosijeId: d.id,
    }), "_blank");
  };

  const prevozTekst = (): React.ReactNode => {
    if (d.transport_eur != null) return <>{d.transport_eur} € {d.sa_istovarom === false ? "bez istovara" : "sa istovarom"}{d.prevoznik ? ` · ${d.prevoznik}` : ""}</>;
    if (ponude.some((x) => x.transport_eur != null)) return <>u ponudi {ponude.find((x) => x.transport_eur != null)!.transport_eur} €</>;
    if (d.prevoz_poslato_kad) return <>poslato {d.prevoznik ? `${d.prevoznik} ` : ""}{kadFmt(d.prevoz_poslato_kad)}, čeka se cena</>;
    return <>poruka prevozniku nije poslata</>;
  };
  const prevozStanje: Stanje = d.transport_eur != null || ponude.some((x) => x.transport_eur != null) ? "ok" : d.prevoz_poslato_kad ? "ceka" : "fali";
  const ugradnjaStanje: Stanje = !trebaUgradnja ? "nema" : d.ugradnja ? "ok" : d.paja_poslato_kad ? "ceka" : "fali";

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[17px] font-bold text-navy">{kupac}</div>
          <div className="mt-0.5 text-xs text-muted">{[mesto, d.opis ?? (delovi.length ? delovi.map(opisDela).join(" + ") : null), d.telefon].filter(Boolean).join(" · ")}</div>
        </div>
        {r && (
          <div className="shrink-0 text-right">
            <div className="font-display text-[17px] font-bold tabular-nums text-navy">{rsd(r.ukupno)}</div>
            <div className="text-[11px] text-muted">materijal{prevoz ? ` · ${prevoz.palete} pal. · ${new Intl.NumberFormat("sr-RS").format(prevoz.kg)} kg` : ""}</div>
          </div>
        )}
      </div>

      <div className="mt-3">
        <Red naslov="Materijal" stanje={ponude.length ? "ok" : s ? "fali" : "nema"}
          tekst={ponude.length
            ? <span className="flex flex-wrap gap-x-3 gap-y-0.5">{ponude.map((x) => <Link key={x.id} href={`/ponuda?id=${x.id}`} className="font-semibold text-ink underline underline-offset-2">Ponuda {x.broj} · {rsd(Number(x.ukupno_rsd))}</Link>)}</span>
            : s ? "ponuda za materijal nije napravljena" : "ništa nije računato u kalkulatoru"}
          akcija={ponude.length ? <PosaljiKlijentu mali telefon={telefon} imeFajla={imeFajla(metaPonude(ponude[0]))}
            napraviPdf={() => napraviPonudaPdf(ponude[0].redovi, Number(ponude[0].ukupno_rsd), metaPonude(ponude[0]))}
            tekst={(url) => porukaMaterijal(ponude[0].broj, Number(ponude[0].ukupno_rsd), url)} /> : undefined} />
        <Red naslov="Prevoz" stanje={s || d.prevoz_poslato_kad ? prevozStanje : "nema"} tekst={s || d.prevoz_poslato_kad ? prevozTekst() : "—"}
          akcija={prevoz && r ? (
            <a href={prevoznikLink(izaberiPrevoznika(prevoz.palete, prevoz.kg, bezTransporta ? undefined : saIstovarom).prevoznik, porukaPrevozu(mesto, prevoz.palete, prevoz.kg))}
              target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-ink underline underline-offset-2">
              {d.prevoz_poslato_kad ? "Pošalji ponovo" : `Pošalji ${dativ(izaberiPrevoznika(prevoz.palete, prevoz.kg).prevoznik)}`}
            </a>) : undefined} />
        <Red naslov="Ugradnja" stanje={ugradnjaStanje}
          tekst={!trebaUgradnja ? "samo materijal, ugradnja nije potrebna"
            : d.ugradnja ? <Link href={`/ugradnja?dosije=${d.id}`} className="font-semibold text-ink underline underline-offset-2">Ponuda za ugradnju {d.ugradnja.broj || ""} · {eurFmt(d.ugradnja.cena)} €</Link>
            : d.paja_poslato_kad ? <>specifikacija poslata Paji {kadFmt(d.paja_poslato_kad)}, čeka se njegov odgovor</>
            : "specifikacija Paji nije poslata"}
          akcija={trebaUgradnja && !d.ugradnja ? <Link href={`/ugradnja?dosije=${d.id}`} className="text-[11px] font-semibold text-ink underline underline-offset-2">Upiši Pajin odgovor</Link>
            : d.ugradnja && d.ugradnja.cena != null ? <PosaljiKlijentu mali telefon={telefon} imeFajla={imeFajlaUgradnje(d.ugradnja)}
                napraviPdf={async () => napraviUgradnjaPdf(d.ugradnja!, await bajtoviSlike(d.ugradnja!.slika))}
                tekst={(url) => porukaUgradnja(d.ugradnja!.broj, eurFmt(d.ugradnja!.cena), url)} /> : undefined} />
      </div>

      {ceka && s && (
        <div className="mt-3 rounded-[10px] bg-wash p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Stigla cena prevoza? Ponuda na jedno dugme</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="field"><span>Broj ponude</span><input value={broj} onChange={(e) => setBroj(e.target.value)} className="inp inp-sm" placeholder="npr. 185/26" /></label>
            <label className="field"><span>Transport (€)</span>
              <input value={transport} onChange={(e) => { if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) setTransport(e.target.value); }}
                inputMode="decimal" disabled={bezTransporta} className={`inp inp-sm ${bezTransporta ? "opacity-40" : ""}`} placeholder="npr. 260" />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
            <label className="flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" checked={saIstovarom} disabled={bezTransporta} onChange={(e) => setSaIstovarom(e.target.checked)} className="h-4 w-4 accent-[#0B1E3B]" />Sa istovarom</label>
            <label className="flex items-center gap-2 text-[13px] text-ink"><input type="checkbox" checked={bezTransporta} onChange={(e) => setBezTransporta(e.target.checked)} className="h-4 w-4 accent-[#0B1E3B]" />Bez transporta</label>
          </div>
          <button type="button" onClick={napraviPonudu} disabled={fali.length > 0} className="btn btn-sm btn-plain mt-2.5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">Napravi ponudu</button>
          <p className="mt-1.5 text-[11px] text-muted">{fali.length ? <>Fali: <b className="text-ink">{fali.join(" i ")}</b>.</> : "Otvara list ponude; čim skineš PDF, ponuda je u Ponudama i u ovom dosijeu."}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {s && (onOtvori
          ? <button type="button" onClick={() => onOtvori(d)} className="btn btn-sm btn-ghost btn-plain">Otvori u kalkulatoru</button>
          : <Link href={`/kalkulator?dosije=${d.id}`} className="btn btn-sm btn-ghost btn-plain">Otvori u kalkulatoru</Link>)}
        {!s && d.lead_id && <Link href={`/kalkulator?lead=${d.lead_id}`} className="btn btn-sm btn-ghost btn-plain">Kalkulator</Link>}
        <span className="ml-auto flex items-center gap-3 text-[11px] text-muted">
          <span>menjano {kadFmt(d.updated_at)}</span>
          {onObrisi && <button type="button" onClick={() => onObrisi(d)} className="hover:text-warn">Obriši</button>}
        </span>
      </div>
    </div>
  );
}
