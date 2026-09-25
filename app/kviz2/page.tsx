import { Kviz, type KvizLead } from "@/components/Kviz";

// Kviz 2 (25.09.2026.): druga tura starih leadova. Slavko (BiH) je već u /kviz, pa je preskočen.
const LEADOVI: readonly KvizLead[] = [
  { n: 1, ime: "Nikola Stojković", tel: "0638171118", info: "Bor; blokovi na šleper, plaća keš" },
  { n: 2, ime: "Ivan Đurić", tel: "064 1678447", info: "Čeka ponudu koju smo obećali 9. sep" },
  { n: 3, ime: "Stevica Ku…", tel: "", info: "Plac 2×60 + 2×30 m, 2 m visine; nema broja u prepisci" },
  { n: 4, ime: "Bojan (ZGR „Pro…“)", tel: "060 0881609", info: "Potporni zid, pitao za jednostrani blok" },
  { n: 5, ime: "Marko Jevremović", tel: "", info: "Pitao cenu i cenovnik; nema broja" },
  { n: 6, ime: "Miloš Milojević", tel: "", info: "Pitao cenu; nema broja" },
  { n: 7, ime: "Ivana Milović", tel: "", info: "Pitala odakle ste i cene; nema broja" },
  { n: 8, ime: "Danijela Stančić", tel: "0638994667", info: "Ograda sa kapijom 7 m + 2×1 m" },
];

export default function Kviz2() {
  return <Kviz leadovi={LEADOVI} folder="kviz2" kljuc="deko-kviz2-odgovori" naslov="stari leadovi (2. tura)" />;
}
