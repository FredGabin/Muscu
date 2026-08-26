const CACHE='force-course-v333-20260826';
const SHELL=['./?v=333','./index.html?v=333','./manifest.webmanifest?v=333','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{let c=r.clone();caches.open(CACHE).then(x=>x.put('./?v=333',c));return r}).catch(()=>caches.match('./?v=333')));return}
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{let c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))
});