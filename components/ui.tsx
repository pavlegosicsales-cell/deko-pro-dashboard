export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(11,30,59,0.05),0_2px_10px_rgba(11,30,59,0.04)] ${className}`}>{children}</div>;
}

export function StatCard({ label, value, tone }: { label: string; value: string; tone?: "gold" | "ok" | "warn" }) {
  const c = tone === "gold" ? "text-gold-deep" : tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-navy";
  return (
    <Card className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl tabular-nums ${c}`}>{value}</div>
    </Card>
  );
}
