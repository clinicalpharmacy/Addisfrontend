// Service Worker for Addis Medication Reminders & Web Push Notifications

self.addEventListener('install', (event) => {
    // Activate worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push events from the server
self.addEventListener('push', (event) => {
    let payload = {
        title: '💊 Medication Reminder',
        body: 'It is time for your scheduled medication.',
        icon: '/logo.png',
        badge: '/favicon-48x48.png',
        tag: 'medication-reminder',
        data: { url: '/reminders' }
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            payload = { ...payload, ...parsed };
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const notificationOptions = {
        body: payload.body,
        icon: payload.icon || '/logo.png',
        badge: payload.badge || '/favicon-48x48.png',
        vibrate: [300, 150, 300, 150, 300],
        tag: payload.tag || 'med-alert',
        renotify: true,
        requireInteraction: true,
        data: payload.data || { url: '/reminders' },
        actions: [
            { action: 'taken', title: '✅ Mark Taken' },
            { action: 'open', title: '👀 View Details' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, notificationOptions)
    );
});

// Handle user clicking the notification or actions
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/reminders';
    const scheduleId = event.notification.data?.scheduleId;
    const scheduledTime = event.notification.data?.scheduledTime;

    // If user clicked 'Mark Taken' directly on the notification action button
    if (event.action === 'taken' && scheduleId) {
        // Broadcast to any active client tabs
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    client.postMessage({
                        type: 'MEDICATION_TAKEN',
                        scheduleId,
                        scheduledTime
                    });
                }
            })
        );
    }

    // Open or focus the app window
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
