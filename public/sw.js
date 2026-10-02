/* Service worker samo za Web Push obaveštenja (Deko Pro panel, 02.10.2026.). Ne kešira ništa. */
self.addEventListener("push", (e) => {
  let p = { naslov: "Deko Pro", telo: "", url: "/ponude?tab=paja" };
  try { p = { ...p, ...e.data.json() }; } catch { if (e.data) p.telo = e.data.text(); }
  e.waitUntil(self.registration.showNotification(p.naslov, { body: p.telo, icon: "/icon-512.png", badge: "/icon-512.png", data: { url: p.url }, tag: p.url }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
