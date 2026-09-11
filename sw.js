const CACHE='madhyum-crm-v4-20260912-1';
const ASSETS=['./','./index.html','./css/app.css','./js/core.js','./js/api.js','./js/auth.js','./js/navigation.js','./js/agent.js','./js/admin.js','./js/app.js','./manifest.json','./madhyum-brand.png','./assets/dashboard-hero.jpg','./icon/icon-192.png','./icon/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
