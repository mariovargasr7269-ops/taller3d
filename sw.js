var CACHE='creamyd-v1';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return fetch(e.request).then(function(r){
        if(e.request.method==='GET'&&r.ok){c.put(e.request,r.clone());}
        return r;
      }).catch(function(){
        return c.match(e.request).then(function(m){return m||c.match('./');});
      });
    })
  );
});
