const CACHE='muscu-cache-v3';
const STATIC=['./manifest.json?v=3','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  // Toujours tenter le réseau d'abord pour les pages HTML/navigation :
  // évite qu'une ancienne version reste bloquée après une mise à jour GitHub Pages.
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'}).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put('./?v=3',copy));
        return resp;
      }).catch(()=>caches.match('./?v=3').then(r=>r||caches.match('./')))
    );
    return;
  }

  // Pour les fichiers statiques : réseau puis cache.
  event.respondWith(
    fetch(event.request,{cache:'no-store'}).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(event.request,copy));
      return resp;
    }).catch(()=>caches.match(event.request))
  );
});