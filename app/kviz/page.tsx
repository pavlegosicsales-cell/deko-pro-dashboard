import { Kviz, type KvizLead } from "@/components/Kviz";

// Kviz 1 (25.09.2026.): stari leadovi iz IG/FB prepiske za koje ne znamo da li ih je Luka zvao.
const LEADOVI: readonly KvizLead[] = [
  { n: 1, ime: "Nikola (NikolaAna Jovanović Mijatović)", tel: "0677116974", info: "Zidar iz Kruševca, nudi ekipu" },
  { n: 2, ime: "Dejo", tel: "063 1402202", info: "Viber; pitao da li ga je neko zvao" },
  { n: 3, ime: "Marko (suprug Lidije Uroš…)", tel: "0649083959", info: "Siva boja bloka; traži ponudu" },
  { n: 4, ime: "Slavica Ćiri…", tel: "0648801588", info: "Ograda, cena po m², ugradnja" },
  { n: 5, ime: "Slavko (BiH)", tel: "+387 63 423 138", info: "Dva metra visine; slobodan od 11h" },
  { n: 6, ime: "Dejan Ristić", tel: "+381621615999", info: "Samo WhatsApp; 16,5 m + 16,5 m" },
  { n: 7, ime: "Dino Kozica", tel: "01739805954", info: "Nemačka; „zovite na vocap“" },
];

export default function Kviz1() {
  return <Kviz leadovi={LEADOVI} folder="kviz" kljuc="deko-kviz-odgovori" naslov="stari leadovi" />;
}
