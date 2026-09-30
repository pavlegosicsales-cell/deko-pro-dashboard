// Provera čitanja Pajinog odgovora u ponudu za ugradnju. Pokreni: node --experimental-strip-types lib/ugradnja.test.mjs
import { izTekstaPaje, eurBroj, eurFmt } from "./ugradnja.ts";

let pao = 0;
const je = (naziv, dobijeno, ocekivano) => {
  const ok = JSON.stringify(dobijeno) === JSON.stringify(ocekivano);
  if (!ok) pao++;
  console.log(`${ok ? "OK  " : "PAO "} ${naziv}: ${JSON.stringify(dobijeno)}${ok ? "" : ` (očekivano ${JSON.stringify(ocekivano)})`}`);
};

const TEKST = `Sto se tice ugradnje, za nju bi bila zaduzena nasa najbolja ekipa majstora.
Cena ugradnje je 5900e
U cenu ulazi


Zidanje ograde 36m visine polja 0.8m i visine stubova 1.6m

Lepljenje kapa i okapnica

Materijal
Cement
Gvozdje...



Avans za rezervaciju termina je 450e
Materijal(deko blok) uplacujete avansno
I on je spreman za 10ak dana od uplate avansa. I onda ceka termin za ugradnju.

Sazeto:
Uplatom za deko blok materijal
Uplatom avansa za majstore

Po ovim sada uslovima ste sebi obezbedili nas materijal i termin ugradnje (rezervaciju)
I onda isplacujete samo ugradnju kada radovi pocnu.
Po dinamici 2725 na dan pocinjanja radova
I 2725 kada se radovi zavrse.
I na dan dolaska materijala nasem vozacu ako se odlucite da mi robu prevezemo i istovarimo placate prevoz sa istovarnom dugom **
(Ostatak iznosa za ugradnju)`;

const u = izTekstaPaje(TEKST, { kupac: "Dejan Andrejić", lokacija: "Smederevo" });
je("cena", u.cena, 5900);
je("avans", u.avans, 450);
je("rata1", u.rata1, 2725);
je("rata2", u.rata2, 2725);
je("kupac ostaje", u.kupac, "Dejan Andrejić");
je("uracunato", u.uracunato, ["Zidanje ograde 36 m (polja 0,8 m, stubovi 1,6 m)", "Formiranje stubova", "Postavljanje kapa i okapnica", "Repromaterijal za zidanje: cement, gvožđe"]);
je("napomena rok", u.napomena.includes("oko 10 dana"), true);

const u2 = izTekstaPaje(TEKST.replace("5900e", "2800").replace("450e", "350e").replace(/2725/g, "1225").replace("36m", "20,2m"));
je("2 cena", u2.cena, 2800);
je("2 rate", [u2.rata1, u2.rata2], [1225, 1225]);
je("2 duzina sa zapetom", u2.uracunato[0], "Zidanje ograde 20,2 m (polja 0,8 m, stubovi 1,6 m)");

// rate se izvode kad ih Paja ne napiše
const u3 = izTekstaPaje("Cena ugradnje je 4.000e\nAvans za rezervaciju termina je 650e");
je("3 rate izvedene", [u3.rata1, u3.rata2], [1675, 1675]);
je("eurBroj 5.900", eurBroj("5.900"), 5900);
je("eurBroj 2,5", eurBroj("2,5"), 2.5);
je("eurFmt", eurFmt(4000), "4.000");

console.log(pao ? `\n${pao} test(ova) PALO` : "\nSVI TESTOVI PROŠLI");
process.exit(pao ? 1 : 0);
