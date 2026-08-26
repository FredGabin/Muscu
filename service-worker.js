const CACHE='muscu-v5-20260826';
const OFFLINE='./?v=5';

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE).then(c=>c.addAll([
      './?v=5',
      './manifest.json?v=5',
      './icon-192.png?v=5',
      './icon-512.png?v=5'
    ]))
  );
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

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE).then(c=>c.put(OFFLINE,copy));
          return resp;
        })
        .catch(()=>caches.match(OFFLINE))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(event.request,copy));
        return resp;
      })
      .catch(()=>caches.match(event.request))
  );
});