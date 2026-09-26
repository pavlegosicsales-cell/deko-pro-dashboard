import { Kviz, type KvizLead } from "@/components/Kviz";

// Kviz 4 (26.09.2026.): četvrta tura. Izbačeni duplikati: 4 bajt-identične slike,
// Dino Kozica (kviz 1) i Lidija/Marko Urošević (kviz 1 i 3).
const LEADOVI: readonly KvizLead[] = [
  { n: 1, ime: "Irena Đokić", tel: "0642662501", info: "55 m, natur, dva reda; i bez ugradnje; zvati posle 14h" },
  { n: 2, ime: "Dragana", tel: "", info: "Čeka boju koje trenutno nema; rekao si joj da se javi za mesec dana; nema broja" },
  { n: 3, ime: "Aleksandra", tel: "", info: "Pitala da li još radite (10. avg); dobila naš broj; nema njen broj" },
  { n: 4, ime: "Branislav Prokić", tel: "+381 60 3535407", info: "Viber; cena po kvadratu, dekorativna cigla" },
  { n: 5, ime: "Davor Dimitrijević", tel: "", info: "Kladovo; 90 m × 40 cm + prednja 15 m sa 6 stubova 1,6 m, natur; nema broja" },
  { n: 6, ime: "Dejan Popović", tel: "", info: "Crna Gora; tražio broj za Viber/WhatsApp; nema njegov broj" },
  { n: 7, ime: "Sandra Radosavljević", tel: "063319316", info: "Srpski Itebej; 80 m, visina 1,5 m, najjeftiniji, sa montažom" },
  { n: 8, ime: "Adis Kapić", tel: "00352691929233", info: "Pošiljka za Bosnu; Viber ili WhatsApp" },
  { n: 9, ime: "Milanka Janković", tel: "+38268866068", info: "Crna Gora; kućica u planini 6×5 m, 1,5 m visine" },
  { n: 10, ime: "Emma Lux (emmaluxpo…)", tel: "", info: "Treba im još natur blokova i okapnica; pisali da si nedostupan; nema broja" },
  { n: 11, ime: "Milka Pavković Simsić", tel: "+41 76 5055237", info: "Švajcarska; parapet 2 bloka, stubovi celi dekor; Messenger/Viber/WhatsApp" },
  { n: 12, ime: "Zoltan Šur…", tel: "0631919644", info: "40 m × 2 m visine, sa ugradnjom" },
  { n: 13, ime: "Enis Osmani", tel: "+49 163 4603227", info: "Nemačka; WhatsApp/Viber od 17h" },
];

export default function Kviz4() {
  return <Kviz leadovi={LEADOVI} folder="kviz4" kljuc="deko-kviz4-odgovori" naslov="stari leadovi (4. tura)" />;
}
