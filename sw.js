/* La app queda guardada en el teléfono: abre aunque no haya internet o Google falle.
   Las llamadas al Apps Script (guardar en la hoja y Drive) siempre van por internet. */
const V = "agenda-v1";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
  "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all([
    c.addAll(SHELL),
    ...CDN.map(u => fetch(new Request(u, { mode: "no-cors" })).then(r => c.put(u, r)).catch(() => {}))
  ])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const esApp = url.origin === location.origin, esCDN = CDN.indexOf(req.url) >= 0;
  if (!esApp && !esCDN) return;                       /* mapas, Apps Script, etc.: directo a internet */
  const clave = req.mode === "navigate" ? "index.html" : req;
  e.respondWith(caches.open(V).then(c => c.match(clave).then(guardado => {
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(clave, r.clone()); return r; }).catch(() => guardado);
    return guardado || red;                            /* abre al instante con lo guardado y se actualiza solo */
  })));
});
