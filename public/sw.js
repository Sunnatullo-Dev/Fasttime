const CACHE_NAME = 'fasttime-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-256.png',
    '/icon-512.png',
    '/icon-1024.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, actions, data } = event.data;
        showSystemNotification(title, body, icon, actions, data);
    }
});

// System notification logic
function showSystemNotification(title, body, icon, actions, data) {
    const options = {
        body: body || 'FASTTIME - Fokus sessiyasi tugadi!',
        icon: icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'pomodoro-notification',
        renotify: true,
        requireInteraction: true,
        actions: actions || [
            { action: 'start-next', title: 'Ishni boshlash' },
            { action: 'remind-5', title: '5 daqiqadan so‘ng' }
        ],
        data: data || { type: 'timer-complete' }
    };

    self.registration.showNotification(title, options);
}

// Handle notification interaction
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'start-next') {
        // Find the client and send a message to start next session
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                if (clientList.length > 0) {
                    clientList[0].focus();
                    clientList[0].postMessage({ type: 'TIMER_ACTION', action: 'START_NEXT' });
                } else {
                    clients.openWindow('/');
                }
            })
        );
    } else if (event.action === 'remind-5') {
        // Schedule a new notification in 5 minutes
        setTimeout(() => {
            showSystemNotification(
                'FASTTIME – Eslatma',
                '5 daqiqa o‘tdi. Fokusni boshlashga tayyormisiz?',
                null,
                [
                    { action: 'start-next', title: 'Hozir boshlash' },
                    { action: 'remind-5', title: 'Yana 5 daqiqa' }
                ]
            );
        }, 5 * 60 * 1000);
    } else {
        // Default click on notification body - focus the app
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                if (clientList.length > 0) {
                    clientList[0].focus();
                } else {
                    clients.openWindow('/');
                }
            })
        );
    }
});
