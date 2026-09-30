import { citajLeadove } from "@/lib/citajLeadove";
import { citajPonude } from "@/lib/citajPonude";
import { citajDosijee } from "@/lib/citajDosijee";
import { tabelaDosijeaFali } from "@/lib/dosije";
import { KalkulatorView, type LeadKratko } from "@/components/KalkulatorView";
import { DEMO_LEADOVI } from "@/lib/demo";
import { JE_DEMO } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Kalkulator() {
  const leadovi = JE_DEMO ? DEMO_LEADOVI : (await citajLeadove()).leadovi;
  const danas = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });
  const uRedu = leadovi.filter((l) => l.status === "nov" || l.status === "nije_se_javio" || (l.status === "zvati_kasnije" && !!l.podseti_kad && l.podseti_kad <= danas)).length;
  // Kalkulatoru treba samo ono što puni ponudu: ime, mesto, mere i detalji. Odustali se ne nude.
  const zaIzbor: LeadKratko[] = leadovi
    .filter((l) => l.status !== "propao")
    .map((l) => ({
      id: l.id, ime: l.ime ?? null, prezime: l.prezime ?? null, telefon: l.telefon ?? null,
      lokacija: l.lokacija ?? null, duzina_m: l.duzina_m ?? null, proizvod: l.proizvod ?? null,
      status: l.status, detalji: l.detalji ?? null, obuhvat: l.obuhvat ?? null,
    }));
  if (JE_DEMO) return <KalkulatorView uRedu={uRedu} leadovi={zaIzbor} demo />;
  // dosijei i ponude: podtab „Čeka prevoz" i veza kalkulatora sa dosijeom kupca
  const [{ dosijei, error }, { ponude }] = await Promise.all([citajDosijee(), citajPonude()]);
  return <KalkulatorView uRedu={uRedu} leadovi={zaIzbor} dosijei={dosijei} ponude={ponude} tabelaDosijeaFali={tabelaDosijeaFali(error)} />;
}
