// Branded ekran učitavanja — logo se vidi čim se panel otvori.
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[linear-gradient(160deg,#0B1E3B_0%,#16324f_100%)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} className="h-20 w-auto animate-pulse" />
    </div>
  );
}
