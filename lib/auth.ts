// Mejlovi kojima je dozvoljen pristup panelu (mala, fiksna lista).
// Čak i da se neko drugi registruje u Supabase-u, proxy ga ne pušta unutra.
export const ALLOWED_EMAILS = new Set<string>([
  "pavlegosic.sales@gmail.com",
  "pavlegosic9@gmail.com",
  // TODO: dodati mejl vlasnika Deko Pro (owner) kad ga potvrdi.
]);

export const jeDozvoljen = (email: string | null | undefined) =>
  !!email && ALLOWED_EMAILS.has(email.trim().toLowerCase());
