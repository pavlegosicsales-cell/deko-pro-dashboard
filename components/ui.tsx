// Primitivi u jeziku sajta (klase iz globals.css: .card, .stat, .btn, .tag)

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

// Stat kartica kao „OD 2015. / CELA SRBIJA / OBE STRANE" traka sa sajta:
// navy, bronza, navy. `alarm` je bela sa zlatnim okvirom (dospelo danas > 0).
export function Stat({ label, value, icon, alarm }: { label: string; value: string; icon: React.ReactNode; alarm?: boolean }) {
  return (
    <div className={`stat ${alarm ? "stat-alarm" : ""}`}>
      <span className="stat-ico">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div className="min-w-0">
        <div className="stat-num">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// Strelica u okrugloj ikonici dugmeta (isto što sajt koristi u „Zatražite ponudu")
export function ArrowIco() {
  return (
    <span className="btn-ico" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  );
}

export function PlusIco() {
  return (
    <span className="btn-ico" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
    </span>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} style={{ width: size, height: size }} className="object-contain" />;
}
