/*
  Pravi PDF ponude, bez prolaska kroz štampač.
  Svi položaji su u tačkama i izmereni su iz templatea „PONUDA BR. 184/26" (PromoBet, 20.08.2025.):
  osnovne linije teksta iz matrice teksta u PDF-u, linije tabele iz pravougaonika.
  Template je bio Letter (612 × 792); ovde je A4, a sadržaj stoji na istim x i istim
  rastojanjima od vrha strane, pa izgleda isto.
  Fontovi: Carlito (iste mere kao Calibri) i Arimo (iste mere kao Arial) — imaju č, ć, š, ž, đ.
*/
import { svegaFmt, transportLinija, type PonudaMeta, type PonudaRed } from "@/lib/ponuda";

const VIS = 841.89;          // A4 visina
const SIR = 595.28;          // A4 širina

// x linija tabele (sredine poteza)
const X = { levo: 79.6, c1: 251.45, c2: 302.8, c3: 399.65, c4: 459.65, desno: 527.1 };
const SREDINA = {
  naziv: (X.levo + X.c1) / 2,
  jedinica: (X.c1 + X.c2) / 2,
  cena: (X.c2 + X.c3) / 2,
  kolicina: (X.c3 + X.c4) / 2,
  ukupno: (X.c4 + X.desno) / 2,
};

const TABELA_VRH = 408.05;
const ZAGLAVLJE_DNO = 467.95;
const RED_1 = 13.9;          // visina reda sa jednim redom naziva
const RED_2 = 26.75;         // sa dva reda naziva
const TANKO = 0.84;
const DEBELO = 1.8;          // kolona sa nazivom je u templateu deblje uokvirena

// razmaci uslova ispod tabele, mereni od dna tabele
const USLOVI = [24.31, 38.23, 51.55, 64.87, 78.19, 91.51, 104.83, 118.15, 131.47];

export async function napraviPonudaPdf(redovi: PonudaRed[], ukupno: number, m: PonudaMeta): Promise<Blob> {
  const [{ PDFDocument, rgb }, fontkitMod] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  const fontkit = (fontkitMod as unknown as { default: unknown }).default ?? fontkitMod;

  const uzmi = async (p: string) => new Uint8Array(await (await fetch(p)).arrayBuffer());
  const [obicanTtf, boldTtf, arialTtf, logoPng] = await Promise.all([
    uzmi("/fonti/Carlito-Regular.ttf"),
    uzmi("/fonti/Carlito-Bold.ttf"),
    uzmi("/fonti/Arimo-Regular.ttf"),
    uzmi("/promobet-logo.png"),
  ]);

  const doc = await PDFDocument.create();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc.registerFontkit(fontkit as any);
  const obican = await doc.embedFont(obicanTtf, { subset: false });
  const bold = await doc.embedFont(boldTtf, { subset: false });
  const arial = await doc.embedFont(arialTtf, { subset: false });
  const logo = await doc.embedPng(logoPng);
  const str = doc.addPage([SIR, VIS]);

  const CRNA = rgb(0, 0, 0);
  const ZELENA_POZ = rgb(198 / 255, 239 / 255, 206 / 255);
  const ZELENA_TXT = rgb(0, 97 / 255, 0);
  const y = (odVrha: number) => VIS - odVrha;

  type Font = typeof obican;
  const pisi = (t: string, x: number, odVrha: number, font: Font, vel = 10.1, boja = CRNA) =>
    str.drawText(t, { x, y: y(odVrha), font, size: vel, color: boja });
  const usred = (t: string, cx: number, odVrha: number, font: Font, vel = 10.1, boja = CRNA) =>
    pisi(t, cx - font.widthOfTextAtSize(t, vel) / 2, odVrha, font, vel, boja);
  const desno = (t: string, dx: number, odVrha: number, font: Font, vel = 10.1, boja = CRNA) =>
    pisi(t, dx - font.widthOfTextAtSize(t, vel), odVrha, font, vel, boja);

  const vodoravna = (x1: number, x2: number, odVrha: number, debljina = TANKO) =>
    str.drawLine({ start: { x: x1, y: y(odVrha) }, end: { x: x2, y: y(odVrha) }, thickness: debljina, color: CRNA });
  const uspravna = (x: number, od: number, doV: number, debljina = TANKO) =>
    str.drawLine({ start: { x, y: y(od) }, end: { x, y: y(doV) }, thickness: debljina, color: CRNA });

  /* ---------- zaglavlje ---------- */
  const visinaLogoa = 69;
  str.drawImage(logo, { x: 80, y: y(68 + visinaLogoa), width: visinaLogoa * (logo.width / logo.height), height: visinaLogoa });

  pisi(`PONUDA BR. ${m.broj}`, 118.1, 156.12, bold, 11);
  pisi(`Datum : ${m.datum}`, 308.9, 156.36, bold);

  // okvir firme i okvir kupca
  const okvir = (x1: number, x2: number, y1: number, y2: number) => {
    vodoravna(x1, x2, y1); vodoravna(x1, x2, y2);
    uspravna(x1, y1, y2); uspravna(x2, y1, y2);
  };
  okvir(X.levo, X.c1, 184.85, 390.05);
  okvir(X.c2, X.c3, 184.85, 280.75);

  usred("Radnja za proizvodnju proizvoda od", SREDINA.naziv, 222.48, obican);
  usred("betona, građevinske usluge i trgovinu", SREDINA.naziv, 235.8, obican);
  usred("PROMOBET", SREDINA.naziv, 249.12, bold);
  pisi("Ive Andrića 1,", 81.4, 293.52, obican);
  pisi("Mladenovac", 81.4, 311.52, obican);
  pisi("PIB:108962996", 81.4, 333.24, obican);
  pisi("MB:63826782", 81.4, 353.28, obican);
  pisi("Kontakt telefon: 062/253-140", 81.4, 369.24, obican);
  pisi("E-mail: komercijalapromobet@gmail.com", 81.2, 386.52, obican, 9.2);

  usred(m.kupac, (X.c2 + X.c3) / 2, 236.28, obican);

  /* ---------- zaglavlje tabele ---------- */
  usred("NAZIV PROIZVODA", SREDINA.naziv, 441.48, bold);
  const dvored = (a: string, b: string, cx: number) => { usred(a, cx, 434.5, bold); usred(b, cx, 447.8, bold); };
  dvored("Jedinica", "mere", SREDINA.jedinica);
  dvored("Cena po jedinici", "mere/DIN", SREDINA.cena);
  dvored("Predviđena", "količina", SREDINA.kolicina);
  dvored("Ukupno/", "DIN", SREDINA.ukupno);

  /* ---------- redovi ---------- */
  const sirinaNaziva = X.c1 - 81.5 - 2;
  const prelomi = (t: string): string[] => {
    if (!t || arial.widthOfTextAtSize(t, 10.1) <= sirinaNaziva) return t ? [t] : [];
    const reci = t.split(" ");
    const linije: string[] = [];
    let tek = "";
    for (const w of reci) {
      const probno = tek ? `${tek} ${w}` : w;
      if (arial.widthOfTextAtSize(probno, 10.1) > sirinaNaziva && tek) { linije.push(tek); tek = w; }
      else tek = probno;
    }
    if (tek) linije.push(tek);
    return linije.slice(0, 2);
  };

  let vrh = ZAGLAVLJE_DNO;
  const granice: number[] = [vrh];
  for (const red of redovi) {
    const linije = prelomi(red.naziv);
    const visina = linije.length > 1 ? RED_2 : RED_1;
    const dno = vrh + visina;
    linije.forEach((l, i) => pisi(l, 81.5, vrh + 8.09 + i * 12.6, arial));
    if (!red.prazan) {
      usred(red.jedinica, SREDINA.jedinica, dno - 4.4, obican);
      usred(red.cena, SREDINA.cena, dno - 4.4, obican);
      usred(red.kolicina, SREDINA.kolicina, dno - 4.4, obican);
    }
    desno(red.ukupno, 524.5, dno - 4.4, obican);
    vrh = dno;
    granice.push(vrh);
  }

  /* ---------- red „Svega" ---------- */
  const svegaVrh = vrh, svegaDno = vrh + RED_1;
  str.drawRectangle({ x: 251.4, y: y(svegaDno), width: 527.2 - 251.4, height: RED_1, color: ZELENA_POZ });
  pisi("Svega:", 253.2, svegaDno - 3.53, obican, 10.1, ZELENA_TXT);
  desno(svegaFmt(ukupno), 516.1, svegaDno - 3.53, obican, 10.1, ZELENA_TXT);

  /* ---------- linije tabele ---------- */
  vodoravna(X.levo, X.desno, TABELA_VRH);
  vodoravna(X.levo, X.desno, ZAGLAVLJE_DNO);
  uspravna(X.levo, TABELA_VRH, ZAGLAVLJE_DNO);
  for (const x of [X.c1, X.c2, X.c3, X.c4, X.desno]) uspravna(x, TABELA_VRH, ZAGLAVLJE_DNO);

  // kolona sa nazivom: debeo okvir oko prvih pet redova, kao u templateu
  const debeloDno = granice[Math.min(5, granice.length - 1)];
  uspravna(X.levo, ZAGLAVLJE_DNO, debeloDno, DEBELO);
  uspravna(X.c1, ZAGLAVLJE_DNO, debeloDno, DEBELO);
  vodoravna(X.levo, X.c1, ZAGLAVLJE_DNO, DEBELO);
  for (let i = 1; i < Math.min(6, granice.length); i++) vodoravna(X.levo, X.c1, granice[i], DEBELO);
  // preostali redovi i red „Svega" imaju tanke linije
  uspravna(X.levo, debeloDno, svegaDno);
  uspravna(X.c1, debeloDno, svegaDno);
  for (let i = 5; i < granice.length; i++) vodoravna(X.levo, X.c1, granice[i]);

  for (const x of [X.c2, X.c3, X.c4]) uspravna(x, ZAGLAVLJE_DNO, svegaVrh);
  uspravna(X.desno, ZAGLAVLJE_DNO, svegaDno);
  for (let i = 1; i < granice.length; i++) vodoravna(X.c1, X.desno, granice[i]);
  vodoravna(X.c1, X.desno, svegaVrh);
  vodoravna(X.c1, X.desno, svegaDno);

  /* ---------- uslovi ---------- */
  const linije = [
    "U cenu je uracunat PDV",
    "Način plaćanja :  Avans",
    "Rok isporuke : 15 radnih dana od uplate avansa",
    "U prilogu ove ponude nalaze se tehnicki listovi ponudjenih proizvoda",
    "Prihvatanjem ove ponude saglasni ste sa uslovima i karakteristikama navedenim u tehnickom listu",
    "Trajanje ove ponude je 3 dana.",
    "Ponuda je važeća bez potpisa i pečata.",
    ...(m.transportEur != null && m.transportEur > 0 ? [transportLinija(m)] : []),
    `Ponudu sastavio: ${m.sastavio}`,
  ];
  linije.forEach((t, i) => pisi(t, 81.4, svegaDno + USLOVI[i], obican));

  const bajtovi = await doc.save();
  return new Blob([bajtovi as unknown as BlobPart], { type: "application/pdf" });
}

export function imeFajla(m: PonudaMeta): string {
  const broj = m.broj.replace(/\//g, "-").trim();
  const kupac = m.kupac.trim();
  return `Ponuda ${broj}${kupac ? " " + kupac : ""}.pdf`.replace(/\s+/g, " ");
}
