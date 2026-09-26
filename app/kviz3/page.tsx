import { Kviz, type KvizLead } from "@/components/Kviz";

// Kviz 3 (26.09.2026.): treća tura. Slavica i Marko (Lidija) su bili i u /kviz, ostavljeni da Luka potvrdi.
const LEADOVI: readonly KvizLead[] = [
  { n: 1, ime: "Bane (KupujemProdajem)", tel: "065 265 65 66", info: "Zrenjanin; beli blok, 18 m, ALU rešetke, pita ugradnju" },
  { n: 2, ime: "Slavica Ćiri…", tel: "0648801588", info: "Ograda, cena po m², ugradnja (bila i u kvizu 1)" },
  { n: 3, ime: "Gordana R…", tel: "0658863103", info: "Kragujevac; zove da dođete na gradilište" },
  { n: 4, ime: "Marko (suprug Lidije Uroš…)", tel: "0649083959", info: "Siva boja; traži ponudu (bio i u kvizu 1)" },
  { n: 5, ime: "Zoran (KupujemProdajem)", tel: "+43 681 20871332", info: "Austrija, samo WhatsApp; cena sa okapnicama i prevozom" },
  { n: 6, ime: "Marko Mil…", tel: "0692834111", info: "15 m bez kapija; traži predlog" },
  { n: 7, ime: "Milinčić Da…", tel: "", info: "Niš; hoće da neko dođe da uzme mere (poslati katalog i tehn. list); nema broja" },
  { n: 8, ime: "Vladana", tel: "064/5003970", info: "Plac 5 ari, ograda oko kuće; boja Rast multikolor" },
];

export default function Kviz3() {
  return <Kviz leadovi={LEADOVI} folder="kviz3" kljuc="deko-kviz3-odgovori" naslov="stari leadovi (3. tura)" />;
}
