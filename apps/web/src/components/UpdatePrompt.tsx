import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

export function UpdatePrompt() {
  const t = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, UPDATE_INTERVAL);

      // Check for updates when app becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-4 shadow-lg">
        <span className="text-sm font-medium">{t.common.updateAvailable}</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          {t.common.update}
        </button>
      </div>
    </div>
  );
}
