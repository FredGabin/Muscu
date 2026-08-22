const CACHE="coach10k-v2-1-0";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var cp=r.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,cp)});
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(r){return r||caches.match("./index.html")});
    })
  );
});
self.addEventListener("message",function(e){if(e.data && e.data.type==="SKIP_WAITING")self.skipWaiting()});
