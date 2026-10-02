/*
  Nacrt ograde (elevacija + pogled odozgo) kao predložak za Higgsfield, nacrtan u pregledaču (canvas).
  Isto što radi Deko-Pro-Biznis/.secrets/slike/nacrt-ograde.py, ali bez Pythona, pa radi na jedan klik
  sa strane ponude. Pavlova pravila (01.10.2026.): svi zidni blokovi celi i isti (stack bond, bez polovina),
  stubni blok „ne" = stub širine jednog bloka u ravni zida; „da" = stub 40 cm, viri. Uvek paneli.
*/
export type SpecSlike = {
  boja: string;            // ključ cenovnika (kapucino, natur_siva…)
  visinaPolja: number;     // m
  visinaStuba: number;     // m
  razmak: number;          // m (svetli otvor; blokova u polju = razmak / 0,40)
  stubniBlok: boolean;
  bojaZavrsnih: "siva" | "crna" | "bela";
  brojKapija: number;
  sirinaKapija: number;    // ukupno m
  paneli: boolean;
  napomena?: string;
};

export const PODRAZUMEVANA_SPEC: SpecSlike = { boja: "natur_siva", visinaPolja: 0.8, visinaStuba: 1.6, razmak: 2.0, stubniBlok: true, bojaZavrsnih: "siva", brojKapija: 1, sirinaKapija: 3, paneli: true };

const S = 160, MB = 0.4, MH = 0.2;
const BLOK = "#b8ae9c", STUBNI = "#aaa08e", FUGA = "#968e80", PANEL = "#3c4046", OKV = "#282828";
const KAPE: Record<string, string> = { siva: "#c9c9c4", crna: "#2b2b2b", bela: "#f5f5f0" };

export async function nacrtajOgradu(sp: SpecSlike): Promise<Blob> {
  const RP = Math.max(1, Math.round(sp.visinaPolja / MH)), RS = Math.max(RP, Math.round(sp.visinaStuba / MH));
  const N = Math.max(1, Math.round(sp.razmak / MB)), FW = N * MB;
  const kapije: number[] = [];
  if (sp.brojKapija > 0 && sp.sirinaKapija > 0) {
    if (sp.brojKapija >= 2) { kapije.push(1, Math.max(1, sp.sirinaKapija - 1)); } else kapije.push(sp.sirinaKapija);
  }
  // segmenti: F F [G...] F
  const seg: ({ t: "P" } | { t: "F"; w: number } | { t: "G"; w: number })[] = [{ t: "P" }, { t: "F", w: FW }, { t: "P" }, { t: "F", w: FW }, { t: "P" }];
  for (const g of kapije) seg.push({ t: "G", w: g }, { t: "P" });
  seg.push({ t: "F", w: FW }, { t: "P" });
  const W = seg.reduce((a, s) => a + (s.t === "P" ? MB : s.w), 0);
  const visEl = (sp.visinaStuba + 1.0) * S, visPlan = 0.9 * S;
  const c = document.createElement("canvas"); c.width = Math.round((W + 1) * S); c.height = Math.round(visEl + visPlan);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ebf0f5"; g.fillRect(0, 0, c.width, c.height);
  const ground = Math.round((sp.visinaStuba + 0.6) * S);
  g.fillStyle = "#cdcdc8"; g.fillRect(0, ground, c.width, visEl - ground);
  const kapa = KAPE[sp.bojaZavrsnih] ?? KAPE.siva;
  const blok = (x: number, y: number, w: number, h: number, boja = BLOK) => { g.fillStyle = boja; g.fillRect(x, y, w - 2, h - 2); g.strokeStyle = FUGA; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 4, h - 4); };
  const yRed = (r: number) => ground - (r + 1) * MH * S;
  const stub = (x: number) => {
    for (let r = 0; r < RS; r++) blok(x, yRed(r), MB * S, MH * S, sp.stubniBlok ? STUBNI : BLOK);
    const cx = x + MB * S / 2; g.fillStyle = kapa; g.fillRect(cx - 0.25 * S, ground - RS * MH * S - 0.06 * S, 0.5 * S, 0.06 * S); g.strokeStyle = OKV; g.lineWidth = 1; g.strokeRect(cx - 0.25 * S, ground - RS * MH * S - 0.06 * S, 0.5 * S, 0.06 * S);
  };
  const polje = (x: number, w: number) => {
    const n = Math.round(w / MB);
    for (let r = 0; r < RP; r++) for (let i = 0; i < n; i++) blok(x + i * MB * S, yRed(r), MB * S, MH * S);
    g.fillStyle = kapa; g.fillRect(x - 0.03 * S, ground - RP * MH * S - 0.04 * S, w * S + 0.06 * S, 0.04 * S); g.strokeStyle = OKV; g.strokeRect(x - 0.03 * S, ground - RP * MH * S - 0.04 * S, w * S + 0.06 * S, 0.04 * S);
    if (sp.paneli && RS > RP) {
      const y0 = ground - RP * MH * S - 0.04 * S, y1 = ground - RS * MH * S + 0.02 * S;
      g.fillStyle = PANEL;
      for (let lx = x + 0.03 * S; lx < x + w * S - 0.03 * S; lx += 0.10 * S) g.fillRect(lx, y1, 0.06 * S, y0 - y1);
      g.fillRect(x + 0.01 * S, y1 - 0.02 * S, w * S - 0.02 * S, 0.02 * S); g.fillRect(x + 0.01 * S, y0, w * S - 0.02 * S, 0.02 * S);
    }
  };
  const kapija = (x: number, w: number) => {
    const y1 = ground - RS * MH * S + 0.02 * S;
    g.fillStyle = PANEL; g.fillRect(x + 0.01 * S, y1, w * S - 0.02 * S, ground - 0.03 * S - y1);
    g.fillStyle = "#555a60";
    for (let lx = x + 0.04 * S; lx < x + w * S - 0.04 * S; lx += 0.10 * S) g.fillRect(lx, y1 + 0.03 * S, 0.06 * S, ground - 0.06 * S - y1 - 0.03 * S);
  };
  let x = 0.5 * S;
  for (const s of seg) {
    if (s.t === "P") { stub(x); x += MB * S; }
    else if (s.t === "F") { polje(x, s.w); x += s.w * S; }
    else { kapija(x, s.w); x += s.w * S; }
  }
  // pogled odozgo: ravna traka 0,19 m; sa stubnim blokom stubovi vire (0,39)
  const py = visEl + 0.45 * S, deb = 0.19 * S;
  g.fillStyle = BLOK; g.fillRect(0.5 * S, py - deb / 2, W * S, deb); g.strokeStyle = OKV; g.lineWidth = 2; g.strokeRect(0.5 * S, py - deb / 2, W * S, deb);
  if (sp.stubniBlok) {
    let x2 = 0.5 * S;
    for (const s of seg) {
      if (s.t === "P") { g.fillStyle = STUBNI; g.fillRect(x2, py - 0.39 * S / 2, MB * S, 0.39 * S); g.strokeRect(x2, py - 0.39 * S / 2, MB * S, 0.39 * S); x2 += MB * S; }
      else x2 += s.w * S;
    }
  }
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
  if (!blob) throw new Error("Nacrt nije nacrtan.");
  return blob;
}
