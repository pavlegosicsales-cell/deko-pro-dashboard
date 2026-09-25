import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jeDozvoljen } from "@/lib/auth";
import { JE_DEMO, TRAZI_LOGIN, SUPABASE_URL, SUPABASE_ANON } from "@/lib/env";

// Zaštita svih stranica: neulogovan (ili van allowliste) -> /login.
// Javno ostaje samo /login i /api/lead (buduća forma sa sajta koja ubacuje lead).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Demo režim (Supabase još nije povezan): pusti sve, panel radi na probnim podacima.
  if (JE_DEMO || !TRAZI_LOGIN) return response;

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const javno = path.startsWith("/login") || path.startsWith("/api/lead") || path.startsWith("/kviz");

  // ulogovan ali van allowliste -> odjavi i na login
  if (user && !jeDozvoljen(user.email)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("greska", "nedozvoljen");
    return NextResponse.redirect(url);
  }

  if (!user && !javno) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ulogovanog sa /login prebaci na pregled
  if (user && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
