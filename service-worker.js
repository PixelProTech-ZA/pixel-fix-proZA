/* PixelProTech SW v2 — network-first pages, stale-while-revalidate assets */
const V="pixelprotech-v2";
const CORE=["./","index.html","style.css","site.js","pixel-chat.js","pixel-chat.css","manifest.json","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png","syne-600.woff2","syne-800.woff2","spacemono-400.woff2","spacemono-700.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>0)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin)return;
  if(r.mode==="navigate"||(r.headers.get("accept")||"").includes("text/html")){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match("index.html"))));return}
  e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>m);return m||net}));
});
