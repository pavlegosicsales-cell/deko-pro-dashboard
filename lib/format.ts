export const brojFmt = (n: number | null | undefined) =>
  n == null ? "0" : new Intl.NumberFormat("sr-RS").format(Number(n));

export const datumFmt = (d: string | null | undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// "pre X dana/sati" — kratko, za starost leada
export function pre(d: string | null | undefined): string {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "sad";
  if (min < 60) return `pre ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `pre ${h} h`;
  const dani = Math.floor(h / 24);
  return `pre ${dani} d`;
}
