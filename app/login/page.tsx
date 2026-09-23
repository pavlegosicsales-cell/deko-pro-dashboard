"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ArrowIco, Logo } from "@/components/ui";

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
    <div className="page-head flex min-h-screen items-center justify-center px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/hero-bg.jpg" alt="" aria-hidden />

      <div className="rise w-full max-w-sm">
        {/* Logo + wordmark kao u navu sajta */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size={72} />
          <div className="text-center">
            <div className="nav-wordmark text-[26px]">Deko Pro</div>
            <div className="nav-sub mt-1">Interni panel · Leadovi</div>
          </div>
        </div>

        <div className="card p-6 sm:p-7">
          <span className="eyebrow">Prijava</span>
          <h1 className="h-display mt-3 text-[26px]">Uđi u panel</h1>
          <p className="mt-1 text-sm text-muted">Samo za tim Deko Pro.</p>

          <form onSubmit={posalji} className="mt-5 space-y-4">
            <label className="field">
              <span>Email</span>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="inp" placeholder="ime@gmail.com" />
            </label>
            <label className="field">
              <span>Lozinka</span>
              <input type="password" required value={lozinka} onChange={(e) => setLozinka(e.target.value)} className="inp" placeholder="••••••••" />
            </label>

            {greska && <p className="text-sm font-medium text-danger">{greska}</p>}

            <button type="submit" disabled={radi} className="btn btn-block">
              {radi ? "Prijavljujem…" : "Uđi"}
              <ArrowIco />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-white/60">Deko Pro · dekorativni blok od 2015.</p>
      </div>
    </div>
  );
}
