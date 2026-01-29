import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

export function UpdatePrompt() {
  const t = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

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
