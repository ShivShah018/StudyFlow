const CACHE = 'studyflow-v1';
const ASSETS = [
  '/', 'index.html',
  'css/style.css', 'css/dashboard.css', 'css/tasks.css', 'css/calendar.css', 'css/responsive.css',
  'js/utils.js', 'js/storage.js', 'js/notifications.js', 'js/taskManager.js', 'js/dashboard.js',
  'js/calendar.js', 'js/pomodoro.js', 'js/studyPlanner.js', 'js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
    if (cls.length > 0) { cls[0].focus(); return; }
    clients.openWindow('/');
  }));
});
