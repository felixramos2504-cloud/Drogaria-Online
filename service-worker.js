const CACHE='drogaria-launcher-v11';
const ASSETS=['./index.html','./config.js','./firebase-config.js','./firebase-register.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('drogaria-launcher-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);
 if(req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/config.js')||url.pathname.endsWith('/firebase-register.js')||url.pathname.endsWith('/firebase-config.js')){
  event.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
  return;
 }
 event.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
 for(const c of clients){if(c.url.startsWith(self.registration.scope)){await c.focus();return;}}
 return self.clients.openWindow(self.registration.scope);
 }));
});

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let payload={};
    try{payload=event.data?event.data.json():{}}catch(e){try{payload={body:event.data.text()}}catch(_){}}
    const notice=payload.notification||payload.data||payload;
    const title=String(notice.title||payload.title||'Drogaria Online').slice(0,100);
    const body=String(notice.body||payload.body||'Você recebeu uma nova notificação da Drogaria Online.').slice(0,250);
    const target=self.registration.scope;
    await self.registration.showNotification(title,{
      body,icon:'./icon-192.png',badge:'./icon-192.png',
      tag:String(notice.tag||'drogaria-remoto-'+Date.now()).slice(0,100),
      data:{url:target}
    });
  })());
});
