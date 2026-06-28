'use client';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function usePushNotifications() {
    useEffect(() => {
        const token = localStorage.getItem('sd-token');
        if (!token || !VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

        async function subscribe() {
            try {
                const reg = await navigator.serviceWorker.ready;
                // Check if already subscribed
                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    });
                }
                // Save subscription to backend
                await fetch(`${API_URL}/push/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ subscription: sub }),
                });
            } catch (err) {
                console.warn('[Push] Subscription failed:', err.message);
            }
        }

        // Ask permission then subscribe
        if (Notification.permission === 'granted') {
            subscribe();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') subscribe();
            });
        }
    }, []);
}
