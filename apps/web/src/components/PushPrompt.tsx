import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { getPushPermissionState, requestPushPermission, subscribeToPush } from '@/lib/push';
import { useAuthStore } from '@/stores/auth';

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const { user } = useAuthStore();
  const t = useTranslation();

  useEffect(() => {
    if (!user) return;
    const permission = getPushPermissionState();
    if (permission === 'default') {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
    if (permission === 'granted') {
      // Auto re-subscribe (in case subscription expired)
      subscribeToPush().then(ok => {
        if (!ok) alert('[push] Auto-subscribe failed — check console');
      });
    }
  }, [user]);

  if (!show) return null;

  const handleEnable = async () => {
    const permission = await requestPushPermission();
    if (permission === 'granted') {
      await subscribeToPush();
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-4">
      <div className="mx-auto max-w-md rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{t.notifications.pushPromptTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.notifications.pushPromptBody}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShow(false)}
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                {t.notifications.later}
              </button>
              <button
                onClick={handleEnable}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
              >
                {t.notifications.enable}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
