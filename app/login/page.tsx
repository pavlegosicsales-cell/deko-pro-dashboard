"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Logo } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
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
    <div className="flex min-h-screen items-center justify-center bg-wash px-4 py-10">
      <div className="rise w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo size={56} />
          <div className="text-center">
            <div className="nav-wordmark text-[22px]">Deko Pro</div>
            <div className="nav-sub mt-1">Interni panel</div>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="h2 text-[22px]">Prijava</h1>
          <p className="lead-sub mt-1">Samo za tim Deko Pro.</p>

          <form onSubmit={posalji} className="mt-5 space-y-4">
            <label className="field">
              <span>Email</span>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="inp" placeholder="ime@gmail.com" />
            </label>
            <label className="field">
              <span>Lozinka</span>
              <input type="password" required value={lozinka} onChange={(e) => setLozinka(e.target.value)} className="inp" placeholder="••••••••" />
            </label>

            {greska && <p className="text-sm font-medium text-red">{greska}</p>}

            <button type="submit" disabled={radi} className="btn btn-block">{radi ? "Prijavljujem…" : "Uđi"}</button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted">Deko Pro · dekorativni blok od 2015.</p>
      </div>
    </div>
  );
}
