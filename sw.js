const CACHE = 'studyflow-v2';
const ASSETS = [
  '/', 'index.html',
  'css/style.css', 'css/dashboard.css', 'css/tasks.css', 'css/calendar.css', 'css/responsive.css',
  'js/utils.js', 'js/mlModelsData.js', 'js/storage.js', 'js/notifications.js', 'js/backupService.js',
  'js/timetable.js', 'js/voiceSpeech.js', 'js/voiceParser.js', 'js/voiceHandler.js',
  'js/taskManager.js', 'js/dashboard.js', 'js/calendar.js', 'js/pomodoro.js',
  'js/studyPlanner.js', 'js/mlAnalytics.js', 'js/documentIntelligence.js', 'js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
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
