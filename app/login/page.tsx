"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // sync poruke iz URL-a na mount (hydration-safe: SSR i prvi client render su prazni)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (p.get("greska") === "nedozvoljen") setGreska("Taj nalog nema pristup ovom panelu.");
  }, []);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(""); setRadi(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: lozinka });
    if (error) {
      setGreska(/invalid/i.test(error.message) ? "Pogrešan email ili lozinka." : error.message);
      setRadi(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0B1E3B_0%,#16324f_100%)] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-5 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="Deko Pro" width={256} height={256} className="h-16 w-auto" />
          </div>
          <h1 className="h-display text-center text-xl">Deko Pro — Prijava</h1>
          <p className="mb-5 mt-1 text-center text-sm text-muted">Interni panel za leadove.</p>

          <form onSubmit={posalji} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Email</span>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30" placeholder="ime@gmail.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Lozinka</span>
              <input type="password" required value={lozinka} onChange={(e) => setLozinka(e.target.value)}
                className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30" placeholder="••••••••" />
            </label>

            {greska && <p className="text-sm text-danger">{greska}</p>}

            <button type="submit" disabled={radi}
              className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-2 disabled:opacity-60">
              {radi ? "Prijavljujem…" : "Uđi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
