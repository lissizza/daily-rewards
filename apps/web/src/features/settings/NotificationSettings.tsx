import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useTranslation } from '@/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import {
  getPushPermissionState,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';

interface Settings {
  child_requests: boolean;
  request_results: boolean;
  direct_changes: boolean;
  sound: boolean;
  vibration: boolean;
}

const defaultSettings: Settings = {
  child_requests: true,
  request_results: true,
  direct_changes: true,
  sound: true,
  vibration: true,
};

export function NotificationSettings() {
  const { profile } = useAuthStore();
  const t = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  useEffect(() => {
    setPermissionState(getPushPermissionState());
    checkPushSubscription();
    loadSettings();
  }, []);

  const checkPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setPushEnabled(!!sub);
  };

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings({
        child_requests: data.child_requests,
        request_results: data.request_results,
        direct_changes: data.direct_changes,
        sound: data.sound,
        vibration: data.vibration,
      });
    }
  };

  const updateSetting = useCallback(async (key: keyof Settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        [key]: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }, [settings]);

  const handleEnablePush = async () => {
    const permission = await requestPushPermission();
    setPermissionState(permission);
    if (permission === 'granted') {
      const ok = await subscribeToPush();
      setPushEnabled(ok);
    }
  };

  const handleDisablePush = async () => {
    await unsubscribeFromPush();
    setPushEnabled(false);
  };

  return (
    <div className="flex flex-col p-4">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-md p-2 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{t.notifications.settingsTitle}</h1>
      </div>

      {/* Push on/off */}
      {permissionState === 'denied' ? (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-red-50 p-3 dark:bg-red-950/30">
          <div className="flex items-center gap-2">
            <BellOff className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{t.notifications.pushDisabled}</p>
          </div>
        </div>
      ) : pushEnabled ? (
        <button
          onClick={handleDisablePush}
          className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-destructive p-3 text-destructive"
        >
          <BellOff className="h-4 w-4" />
          {t.notifications.disableAll}
        </button>
      ) : (
        <button
          onClick={handleEnablePush}
          className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-primary p-3 text-primary-foreground"
        >
          <Bell className="h-4 w-4" />
          {t.notifications.enablePush}
        </button>
      )}

      {/* Category toggles */}
      {pushEnabled && (
        <div className="space-y-1">
          {isAdmin && (
            <ToggleRow
              label={t.notifications.childRequests}
              checked={settings.child_requests}
              onChange={(v) => updateSetting('child_requests', v)}
            />
          )}
          {!isAdmin && (
            <ToggleRow
              label={t.notifications.requestResults}
              checked={settings.request_results}
              onChange={(v) => updateSetting('request_results', v)}
            />
          )}
          <ToggleRow
            label={isAdmin ? t.notifications.requestResults : t.notifications.directChanges}
            checked={isAdmin ? settings.request_results : settings.direct_changes}
            onChange={(v) => updateSetting(isAdmin ? 'request_results' : 'direct_changes', v)}
          />

          <div className="my-3 border-t" />

          <ToggleRow
            label={t.notifications.sound}
            badge={t.notifications.androidOnly}
            checked={settings.sound}
            onChange={(v) => updateSetting('sound', v)}
          />
          <ToggleRow
            label={t.notifications.vibration}
            badge={t.notifications.androidOnly}
            checked={settings.vibration}
            onChange={(v) => updateSetting('vibration', v)}
          />
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, badge, checked, onChange }: {
  label: string;
  badge?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border p-3">
      <span className="flex items-center gap-2">
        {label}
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {badge}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded accent-primary"
      />
    </label>
  );
}
