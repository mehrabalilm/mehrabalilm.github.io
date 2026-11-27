const CACHE = 'mehrab-v17';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192-v3.png', './icons/icon-512-v3.png', './icons/badge-96.png', './takbeer.mp3',
  ];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok && sameOrigin) {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>cs.forEach(c=>{ if(c.visibilityState==='visible') c.postMessage({type:'prayer-push',tag:d.tag||'prayer'}); })));
  e.waitUntil(self.registration.showNotification(d.title || 'محرابُ العلم', {
    body: d.body || 'حان موعد الصلاة',
    icon: new URL('./icons/icon-192-v3.png', self.registration.scope).href,
    badge: new URL('./icons/badge-96.png', './takbeer.mp3', self.registration.scope).href,
    tag: (d.tag || 'prayer') + '-' + Date.now(),
    renotify: true,
    silent: false,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 500],
    timestamp: Date.now(),
    dir: 'rtl',
    lang: 'ar'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
