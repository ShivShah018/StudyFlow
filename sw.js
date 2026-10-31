const CACHE = 'studyflow-v2.1';
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'css/dashboard.css',
  'css/tasks.css',
  'css/calendar.css',
  'css/responsive.css',
  'js/utils.js',
  'js/mlModelsData.js',
  'js/storage.js',
  'js/notifications.js',
  'js/backupService.js',
  'js/timetable.js',
  'js/voiceSpeech.js',
  'js/voiceParser.js',
  'js/voiceHandler.js',
  'js/taskManager.js',
  'js/dashboard.js',
  'js/calendar.js',
  'js/pomodoro.js',
  'js/studyPlanner.js',
  'js/mlAnalytics.js',
  'js/documentIntelligence.js',
  'js/app.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(err => {
              console.warn('[StudyFlow SW] Cache precache warning for:', url, err);
            })
        )
      );
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    }).then(() => clients.claim())
  );
});

// Network-First with Cache Fallback to eliminate stale cache trapping
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Ignore chrome-extension or external analytics
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      if (cls.length > 0) {
        cls[0].focus();
        return;
      }
      clients.openWindow('./');
    })
  );
});
