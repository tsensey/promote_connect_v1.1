const CACHE_VERSION = 'v1';
const STATIC_CACHE = `promote-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `promote-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `promote-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('promote-') && !name.includes(CACHE_VERSION),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(fromCacheOrNetwork(request, STATIC_CACHE));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(fromCacheOrNetwork(request, IMAGE_CACHE));
    return;
  }

  if (request.destination === 'font') {
    event.respondWith(fromCacheOrNetwork(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
});

async function fromCacheOrNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function fromNetworkOrCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
    }
    return new Response('Offline', { status: 503 });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/feed' },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'PROMOTE-CONNECT', options),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification('PROMOTE-CONNECT', {
        body: event.data.text(),
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/feed';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(urlToOpen);
      }),
  );
});
