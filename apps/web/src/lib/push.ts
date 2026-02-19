import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('[push] Not supported');
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    alert('[push] VAPID_PUBLIC_KEY not set');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const keys = subscription.toJSON().keys!;
    alert('[push] Got keys: ' + JSON.stringify(keys ? Object.keys(keys) : 'null'));

    // Save to database (upsert by endpoint)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('[push] No user from auth.getUser()');
      return false;
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys_p256dh: keys.p256dh!,
        keys_auth: keys.auth!,
      }, { onConflict: 'user_id,endpoint' });

    if (error) {
      console.error('[push] Failed to save subscription:', error);
      alert('[push] Save error: ' + JSON.stringify(error));
      return false;
    }

    return true;
  } catch (err) {
    console.error('[push] Subscribe failed:', err);
    alert('[push] Subscribe error: ' + String(err));
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // Remove from database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);
    }

    await subscription.unsubscribe();
  }
}

export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}
