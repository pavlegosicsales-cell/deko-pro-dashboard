// Branded ekran učitavanja — navy + blueprint mreža, logo i wordmark kao u navu sajta.
export default function Loading() {
  return (
    <div className="blueprint fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-navy">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} className="h-20 w-20 animate-pulse object-contain" />
      <span className="nav-wordmark">Deko Pro</span>
      <span className="nav-sub">Leadovi</span>
    </div>
  );
}
