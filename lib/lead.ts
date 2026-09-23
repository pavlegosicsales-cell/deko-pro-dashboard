// Telefon + deep linkovi (Viber / WhatsApp / SMS / poziv). Klijent-safe.

// Normalizacija srpskog broja u kanonski oblik 0XXXXXXXX (bez razmaka/crta).
export function normalizujTelefon(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00381")) d = "0" + d.slice(5);
  else if (d.startsWith("381")) d = "0" + d.slice(3);
  else if (/^6\d{7,8}$/.test(d)) d = "0" + d; // mobilni bez vodeće nule
  return d;
}

// Internacionalni oblik bez + i razmaka (za wa.me / viber).
export function intBroj(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "381" + d.slice(1);
  else if (!d.startsWith("381")) d = "381" + d;
  return d;
}

export const telLink = (t: string | null) => (t ? `tel:${t.replace(/\s/g, "")}` : "#");
export const smsLink = (t: string | null, poruka?: string) =>
  t ? `sms:${t.replace(/\s/g, "")}${poruka ? `?body=${encodeURIComponent(poruka)}` : ""}` : "#";
export const waLink = (t: string | null, poruka?: string) =>
  t ? `https://wa.me/${intBroj(t)}${poruka ? `?text=${encodeURIComponent(poruka)}` : ""}` : "#";
export const viberLink = (t: string | null) => (t ? `viber://chat?number=%2B${intBroj(t)}` : "#");
