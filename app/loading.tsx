// Ekran učitavanja: svetao, miran (redizajn 01.10.2026.).
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-wash">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} className="h-14 w-14 animate-pulse object-contain" />
      <span className="nav-wordmark">Deko Pro</span>
      <span className="text-[12px] text-muted">Učitavam…</span>
    </div>
  );
}
