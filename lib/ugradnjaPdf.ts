/*
  PDF ponude za ugradnju, dve strane, dizajn 1:1 po ponudi Gradi Lako 214/26
  (znanje/ponude/ponuda-214-26-gradi-lako-radovi.pdf). Položaji su izmereni iz renderovanog PDF-a
  (110 dpi) i prepisani u tačke. Font: Noto Sans (public/fonti, isečen skriptom tools/napravi-noto.py).
  Slika ograde ide preko cele širine, „cover" isečena na pojas 300–633 pt.
*/
import { eurFmt, type Ugradnja } from "@/lib/ugradnja";

const SIR = 595.28, VIS = 841.89;
const LEVO = 40.6, DESNO = 555;
const KOL2 = 309;                 // početak desne kolone
const KOL1_DESNO = 280, KOL2_DESNO = 555;

export async function napraviUgradnjaPdf(u: Ugradnja, slikaBajtovi: Uint8Array | null): Promise<Blob> {
  const [pdf, fontkitMod] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const { PDFDocument, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } = pdf;
  const fontkit = (fontkitMod as unknown as { default: unknown }).default ?? fontkitMod;

  const uzmi = async (p: string) => new Uint8Array(await (await fetch(p)).arrayBuffer());
  const [regTtf, semiTtf, boldTtf] = await Promise.all([
    uzmi("/fonti/NotoSans-Regular.ttf"), uzmi("/fonti/NotoSans-SemiBold.ttf"), uzmi("/fonti/NotoSans-Bold.ttf"),
  ]);
  const doc = await PDFDocument.create();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc.registerFontkit(fontkit as any);
  const reg = await doc.embedFont(regTtf, { subset: false });
  const semi = await doc.embedFont(semiTtf, { subset: false });
  const bold = await doc.embedFont(boldTtf, { subset: false });
  type Font = typeof reg;

  const TAMNA = rgb(43 / 255, 43 / 255, 43 / 255);
  const ZLATNA = rgb(184 / 255, 147 / 255, 90 / 255);
  const BEZ = rgb(243 / 255, 239 / 255, 231 / 255);
  const SIVA = rgb(107 / 255, 107 / 255, 107 / 255);
  const SIVA_LINIJA = rgb(214 / 255, 214 / 255, 214 / 255);
  const LABELA = rgb(122 / 255, 106 / 255, 85 / 255);
  const BELA = rgb(1, 1, 1);
  const BELA_SIVA = rgb(200 / 255, 200 / 255, 200 / 255);

  const nova = () => doc.addPage([SIR, VIS]);
  const y = (odVrha: number) => VIS - odVrha;

  const prelomi = (font: Font, t: string, vel: number, sirina: number): string[] => {
    const linije: string[] = [];
    for (const pasus of t.split("\n")) {
      let tek = "";
      for (const w of pasus.split(" ")) {
        const probno = tek ? `${tek} ${w}` : w;
        if (font.widthOfTextAtSize(probno, vel) > sirina && tek) { linije.push(tek); tek = w; } else tek = probno;
      }
      linije.push(tek);
    }
    return linije;
  };

  const zaglavlje = (str: ReturnType<typeof nova>, strana: string) => {
    const pisi = (t: string, x: number, odVrha: number, font: Font, vel: number, boja = TAMNA) => str.drawText(t, { x, y: y(odVrha), font, size: vel, color: boja });
    pisi("GRADI LAKO", LEVO, 52, bold, 17);
    const d = "OGRADE I GRAĐEVINSKI RADOVI";
    pisi(d, DESNO - reg.widthOfTextAtSize(d, 7.5), 51, reg, 7.5, SIVA);
    str.drawLine({ start: { x: LEVO, y: y(77) }, end: { x: DESNO, y: y(77) }, thickness: 0.8, color: SIVA_LINIJA });
    str.drawLine({ start: { x: LEVO, y: y(77) }, end: { x: LEVO + 51, y: y(77) }, thickness: 2.2, color: ZLATNA });
    // podnožje
    str.drawLine({ start: { x: LEVO, y: y(789) }, end: { x: DESNO, y: y(789) }, thickness: 0.8, color: SIVA_LINIJA });
    pisi("GRADI LAKO  /  Beograd, Srbija", LEVO, 808, reg, 8, SIVA);
    pisi("gradilakooffice@gmail.com  |  Instagram: @gradi_lako", LEVO, 822, reg, 7.5, SIVA);
    pisi(strana, DESNO - reg.widthOfTextAtSize(strana, 8), 808, reg, 8, SIVA);
    return pisi;
  };

  /* ================= STRANA 1 ================= */
  const s1 = nova();
  const p1 = zaglavlje(s1, "01 / 02");
  p1("PONUDA IZVOĐAČA", LEVO, 105, semi, 8, LABELA);
  p1("Izvođenje ograde.", LEVO, 137, bold, 29);
  p1(u.bezSlike ? "Pregled cene" : "Pregled cene i vizuelni prikaz", LEVO, 168, reg, 10.5, SIVA);

  const polje = (labela: string, vrednost: string, x: number, xDesno: number, odVrha: number) => {
    p1(labela, x, odVrha, semi, 7.2, LABELA);
    p1(vrednost, x + 2, odVrha + 17, reg, 10.5);
    s1.drawLine({ start: { x, y: y(odVrha + 32) }, end: { x: xDesno, y: y(odVrha + 32) }, thickness: 0.8, color: SIVA_LINIJA });
  };
  polje("KLIJENT / INVESTITOR", u.kupac, LEVO, KOL1_DESNO, 200);
  polje("LOKACIJA RADOVA", u.lokacija, KOL2, KOL2_DESNO, 200);
  polje("BROJ PONUDE", u.broj, LEVO, KOL1_DESNO, 248);
  polje("DATUM PONUDE", u.datum, KOL2, KOL2_DESNO, 248);

  // bez slike (Pavle, 01.10.2026.): nema pojasa ni placeholdera, blok sa cenom ide odmah ispod polja
  const CENA_VRH = u.bezSlike ? 320 : 669;
  if (!u.bezSlike) {
    // slika ograde: pojas preko cele širine, isečena „cover"
    const POJAS_VRH = 300, POJAS_DNO = 633, POJAS_VIS = POJAS_DNO - POJAS_VRH;
    if (slikaBajtovi && slikaBajtovi.length > 4) {
      try {
        const png = slikaBajtovi[0] === 0x89 && slikaBajtovi[1] === 0x50;
        const slika = png ? await doc.embedPng(slikaBajtovi) : await doc.embedJpg(slikaBajtovi);
        const skala = Math.max(SIR / slika.width, POJAS_VIS / slika.height);
        const w = slika.width * skala, h = slika.height * skala;
        s1.pushOperators(pushGraphicsState(), rectangle(0, y(POJAS_DNO), SIR, POJAS_VIS), clip(), endPath());
        s1.drawImage(slika, { x: (SIR - w) / 2, y: y(POJAS_DNO) - (h - POJAS_VIS) / 2, width: w, height: h });
        s1.pushOperators(popGraphicsState());
      } catch (e) {
        console.error("Slika nije ugrađena u PDF", e);
        s1.drawRectangle({ x: 0, y: y(POJAS_DNO), width: SIR, height: POJAS_VIS, color: BEZ });
      }
    } else {
      s1.drawRectangle({ x: 0, y: y(POJAS_DNO), width: SIR, height: POJAS_VIS, color: BEZ });
      const t = "Vizuelni prikaz ograde";
      p1(t, (SIR - reg.widthOfTextAtSize(t, 10)) / 2, POJAS_VRH + POJAS_VIS / 2, reg, 10, SIVA);
    }
    p1("Ilustrativni prikaz ograde. Obuhvat ponude naveden je na drugoj strani.", LEVO, 647, reg, 7.5, SIVA);
  }
  // tamni blok sa cenom
  s1.drawRectangle({ x: LEVO, y: y(CENA_VRH + 100), width: DESNO - LEVO, height: 100, color: TAMNA });
  p1("UKUPNA CENA RADOVA", 59, CENA_VRH + 19, bold, 8.5, BELA);
  p1(eurFmt(u.cena) || "—", 59, CENA_VRH + 74, bold, 42, BELA);
  p1("EUR", 287, CENA_VRH + 74, bold, 16, BELA);

  /* ================= STRANA 2 ================= */
  const s2 = nova();
  const p2 = zaglavlje(s2, "02 / 02");
  p2("DETALJI PONUDE", LEVO, 108, semi, 8, LABELA);
  p2("Obuhvat radova", LEVO, 136, bold, 26);
  p2("Šta pokriva cena i uslovi realizacije.", LEVO, 163, reg, 10.5, SIVA);
  p2("U CENU JE URAČUNATO", LEVO, 194, semi, 7.5, LABELA);

  let od = 228;
  u.uracunato.filter((x) => x.trim()).forEach((x, i) => {
    p2(String(i + 1).padStart(2, "0"), LEVO, od, bold, 9, ZLATNA);
    const linije = prelomi(reg, x, 10.5, DESNO - 76);
    linije.forEach((l, j) => p2(l, 76, od + j * 13, reg, 10.5));
    const dno = od + 15 + (linije.length - 1) * 13;
    s2.drawLine({ start: { x: LEVO, y: y(dno) }, end: { x: DESNO, y: y(dno) }, thickness: 0.8, color: SIVA_LINIJA });
    od = dno + 19;
  });

  // bež kutija: nije uračunato
  const nije = u.nijeUracunato.filter((x) => x.trim());
  const nijeLinije = nije.map((x) => prelomi(reg, x, 10, DESNO - 72 - 22));
  const kutijaVrh = od + 2;
  const kutijaVis = 40 + nijeLinije.reduce((a, l) => a + 12 + (l.length - 1) * 12, 0) + 22;
  s2.drawRectangle({ x: LEVO, y: y(kutijaVrh + kutijaVis), width: DESNO - LEVO, height: kutijaVis, color: BEZ });
  p2("NIJE URAČUNATO U CENU", LEVO + 20, kutijaVrh + 18, semi, 7.5, LABELA);
  let ny = kutijaVrh + 40;
  nijeLinije.forEach((linije) => {
    s2.drawCircle({ x: LEVO + 22, y: y(ny - 3), size: 1.8, color: ZLATNA });
    linije.forEach((l, j) => p2(l, LEVO + 32, ny + j * 12, reg, 10));
    ny += 12 + (linije.length - 1) * 12 + 12;
  });
  od = kutijaVrh + kutijaVis + 34;

  const polje2 = (labela: string, vrednost: string, x: number, xDesno: number, odVrha: number) => {
    p2(labela, x, odVrha, semi, 7.2, LABELA);
    p2(vrednost || "—", x + 3, odVrha + 23, reg, 18);
    s2.drawLine({ start: { x, y: y(odVrha + 39) }, end: { x: xDesno, y: y(odVrha + 39) }, thickness: 0.8, color: SIVA_LINIJA });
  };
  polje2("PLANIRAN POČETAK RADOVA", u.pocetak, LEVO, KOL1_DESNO, od);
  polje2("PLANIRANO TRAJANJE RADOVA", u.trajanje, KOL2, KOL2_DESNO, od);
  od += 54;

  // tamni blok: dinamika plaćanja
  const redovi = [
    { n: "01", naslov: "Avans za ugradnju", opis: "Uplata za rezervaciju termina izvođenja radova.", iznos: u.avans },
    { n: "02", naslov: "Na dan početka radova", opis: "Prva polovina ostatka, uz uračunat avans.", iznos: u.rata1 },
    { n: "03", naslov: "Po završetku radova", opis: "Preostali iznos cene radova.", iznos: u.rata2 },
  ];
  const napomenaLinije = prelomi(reg, u.napomena, 7.5, DESNO - LEVO - 40);
  const blokVis = 36 + redovi.length * 40 + 10 + napomenaLinije.length * 10 + 12;
  const blokVrh = od;
  const blokDno = blokVrh + blokVis;   // sa 4 stavke i 3 tačke staje iznad podnožja (789)
  s2.drawRectangle({ x: LEVO, y: y(blokDno), width: DESNO - LEVO, height: blokVis, color: TAMNA });
  p2("DINAMIKA PLAĆANJA", 59, blokVrh + 20, bold, 8.5, BELA);
  let ry = blokVrh + 44;
  redovi.forEach((r, i) => {
    p2(r.n, 59, ry, bold, 8, BELA_SIVA);
    p2(r.naslov, 82, ry, bold, 10, BELA);
    p2(r.opis, 82, ry + 14, reg, 7.5, BELA_SIVA);
    p2(eurFmt(r.iznos) || "—", 429, ry + 1, bold, 13, BELA);
    p2("EUR", 507, ry, bold, 7.5, BELA);
    if (i < redovi.length - 1) s2.drawLine({ start: { x: 59, y: y(ry + 28) }, end: { x: DESNO - 20, y: y(ry + 28) }, thickness: 0.6, color: rgb(80 / 255, 80 / 255, 80 / 255) });
    ry += 40;
  });
  napomenaLinije.forEach((l, j) => p2(l, 59, ry - 8 + j * 10, reg, 7.5, BELA_SIVA));

  const bajtovi = await doc.save();
  return new Blob([bajtovi as unknown as BlobPart], { type: "application/pdf" });
}
