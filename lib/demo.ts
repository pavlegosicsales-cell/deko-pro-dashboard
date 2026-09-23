import type { LeadRow } from "@/components/LeadView";

// Probni leadovi za pregled panela pre povezivanja Supabase-a.
const pre = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const dan = (d: number) => new Date(Date.now() + d * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Belgrade" });

export const DEMO_LEADOVI: LeadRow[] = [
  { id: "d1", ime: "Marko", prezime: "Jovanović", telefon: "064 123 4567", proizvod: "plus", izvor: "instagram", info: "Ograda 28 m, visina 1.6 m, Kapućino. Novi Sad, Petrovaradin. Zvati posle 17h.", status: "zvati_kasnije", podseti_kad: dan(-1), ishod_beleska: "Rekao da se javimo kad dobije plac ucrtan.", updated_at: null, pozvan_kad: null, created_at: pre(70) },
  { id: "d2", ime: "Jelena", prezime: "Petrović", telefon: "063 987 6543", proizvod: "potporni_zid", izvor: "facebook", info: "Potporni zid 12 m, visina do 1 m, Kragujevac. Pita za cenu sa ugradnjom.", status: "nov", podseti_kad: null, ishod_beleska: null, updated_at: null, pozvan_kad: null, created_at: pre(26) },
  { id: "d3", ime: "Nenad", prezime: null, telefon: "065 555 1212", proizvod: "start", izvor: "viber", info: "Ograda oko 40 m, Natur. Šabac. Budžet do 4.000 €.", status: "nov", podseti_kad: null, ishod_beleska: null, updated_at: null, pozvan_kad: null, created_at: pre(5) },
  { id: "d4", ime: "Ana", prezime: "Milić", telefon: "060 222 3344", proizvod: "privat", izvor: "sajt", info: "Privat ograda 22 m, boja Rock, Beograd (Zemun). Hoće ponudu na mejl.", status: "ponuda", podseti_kad: null, ishod_beleska: "Ponuda poslata 20.09.", updated_at: null, pozvan_kad: null, created_at: pre(120) },
  { id: "d5", ime: "Dragan", prezime: "Stojanović", telefon: "062 777 8899", proizvod: "oblaganje", izvor: "preporuka", info: "Oblaganje fasade prizemlja, ~35 m². Niš.", status: "zainteresovan", podseti_kad: dan(2), ishod_beleska: null, updated_at: null, pozvan_kad: null, created_at: pre(50) },
  { id: "d6", ime: "Milica", prezime: "Đorđević", telefon: "061 444 5566", proizvod: "plus", izvor: "instagram", info: "Ograda 18 m, Rast. Čačak.", status: "zatvoren", podseti_kad: null, ishod_beleska: "Ugovoreno, ugradnja u oktobru.", updated_at: null, pozvan_kad: null, created_at: pre(300) },
  { id: "d7", ime: "Petar", prezime: "Nikolić", telefon: "066 333 2211", proizvod: "start", izvor: "whatsapp", info: null, status: "nije_se_javio", podseti_kad: null, ishod_beleska: null, updated_at: null, pozvan_kad: null, created_at: pre(30) },
];
