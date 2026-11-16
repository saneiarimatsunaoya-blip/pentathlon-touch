'use strict';
// Change VERSION whenever any app-shell file changes. Publish all files together.
const VERSION = '2026-11-16.4';
const PREFIX = 'pentathlon-touch-pwa-' + self.registration.scope;
const CACHE = PREFIX + VERSION;
const url = path => new URL(path, self.registration.scope).href;
const SHELL = ['index.html', 'pwa.js', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'apple-touch-icon.png'].map(url);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // A failed download prevents activation; the previous working version stays available.
    await cache.addAll(SHELL.map(href => new Request(href, {cache: 'reload'})));
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const target = new URL(request.url);
  const home = new URL(self.registration.scope);
  if (target.origin !== home.origin) return;
  const isHome = target.pathname === home.pathname || target.pathname === home.pathname + 'index.html';
  const key = isHome ? url('index.html') : request.url;
  if (!isHome && !SHELL.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(key) || fetch(request);
  })());
});
