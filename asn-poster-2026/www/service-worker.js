const CACHE = 'asn-poster-english-v2';
const ASSETS = ['./','index.html','styles.css','study-core.js','app.js','cards-data.js','qa-data.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('asn-poster-english-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))});
self.addEventListener('fetch', event => {if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)))});
