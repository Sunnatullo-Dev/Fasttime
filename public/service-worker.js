const CACHE_NAME = 'fasttime-v6';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-192.png',
    '/pwa-512.png',
    '/icon-256.png',
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
        icon: icon || '/pwa-192.png',
        badge: '/pwa-192.png',
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
    const action = event.action;
    const data = event.notification.data;

    if (action === 'start-next') {
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
    } else if (action === 'remind-5' || action === 'snooze-reminder-5') {
        const title = action === 'remind-5' ? 'FASTTIME – Eslatma' : 'FASTTIME Reminder';
        const body = action === 'remind-5' ? '5 daqiqa o‘tdi. Fokusni boshlashga tayyormisiz?' : `Snoozed: ${data?.title || 'Reminder'}`;

        setTimeout(() => {
            showSystemNotification(title, body, null, null, data);
        }, 5 * 60 * 1000);

        if (data?.id && action === 'snooze-reminder-5') {
            // Logically we should also hit the server to update the reminder time
            // but SW has limited access to headers/tokens unless stored in IDB
        }
    } else if (action === 'mark-reminder-done') {
        // Send message to client to mark as done if client is active
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                if (clientList.length > 0) {
                    clientList[0].postMessage({ type: 'REMINDER_ACTION', action: 'MARK_DONE', id: data?.id });
                }
                // Even if no client, we can try a background fetch to update the server
                // but we need the token. Let's assume the client will handle it or 
                // we store the token in SW state or IndexedDB.
            })
        );
    } else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                if (clientList.length > 0) clientList[0].focus();
                else clients.openWindow('/');
            })
        );
    }
});

// Periodic check for reminders if SW is alive
let reminderInterval;
function startReminderCheck() {
    if (reminderInterval) return;
    reminderInterval = setInterval(async () => {
        // This is optimistic - SWs are often killed by browsers.
        // The main app should also check when active.
        const clientsList = await clients.matchAll({ type: 'window' });
        if (clientsList.length > 0) {
            clientsList[0].postMessage({ type: 'CHECK_REMINDERS' });
        }
    }, 60000);
}

self.addEventListener('message', (event) => {
    if (event.data?.type === 'START_CHECKING') {
        startReminderCheck();
    }
});
