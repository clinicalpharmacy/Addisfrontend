// Web Push Notification Helper for Addisfrontend

/**
 * Convert URL safe base64 to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if the current browser/device supports Web Push notifications
 */
export function isPushSupported() {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission() {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission; // 'granted' | 'denied' | 'default'
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        return registration;
    } catch (err) {
        console.error('Service Worker registration failed:', err);
        return null;
    }
}

/**
 * Check if current device is already subscribed
 */
export async function getExistingSubscription() {
    if (!isPushSupported()) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch (err) {
        console.error('Error checking existing subscription:', err);
        return null;
    }
}

/**
 * Request permission and subscribe device to Web Push
 */
export async function subscribeToPush(apiClient) {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported on this browser or device.');
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error(
            permission === 'denied'
                ? 'Notification permission was denied in your browser settings. Please allow notifications for this site to receive reminders.'
                : 'Notification permission was dismissed.'
        );
    }

    // 2. Fetch VAPID Public Key
    let publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
        const res = await apiClient.get('/reminders/vapid-public-key');
        publicKey = res.publicKey;
    }

    if (!publicKey) {
        throw new Error('VAPID public key not found.');
    }

    // 3. Register SW and subscribe
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
        });
    }

    const subJson = subscription.toJSON();

    // 4. Send subscription keys to backend
    const deviceName = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} (${navigator.userAgent.split(' ')[0]})`;

    const response = await apiClient.post('/reminders/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        device_name: deviceName
    });

    return {
        success: true,
        subscription,
        message: response.message || 'Device registered successfully'
    };
}

/**
 * Unsubscribe device from push notifications
 */
export async function unsubscribeFromPush(apiClient) {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await apiClient.post('/reminders/unsubscribe', {
                endpoint: subscription.endpoint
            });
            await subscription.unsubscribe();
        }

        return true;
    } catch (err) {
        console.error('Error during unsubscribe:', err);
        throw err;
    }
}
