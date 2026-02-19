import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@dailyrewards.app'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: {
    id: string
    child_id: string
    event_type_id: string | null
    custom_name: string | null
    points: number
    note: string
    date: string
    created_by: string | null
    status: 'approved' | 'pending' | 'rejected'
  }
  old_record: {
    id: string
    status: 'approved' | 'pending' | 'rejected'
  } | null
}

interface NotificationData {
  title: string
  body: string
  category: 'child_requests' | 'request_results' | 'direct_changes'
  recipients: string[]  // user_ids
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    const { type, record, old_record } = payload

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Determine notification type
    const notification = await determineNotification(supabase, type, record, old_record)
    if (!notification) {
      return new Response(JSON.stringify({ message: 'No notification needed' }), { status: 200 })
    }

    // Get subscriptions for recipients, filtering by notification settings
    const { data: subsWithoutSettings } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', notification.recipients)

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .in('user_id', notification.recipients)

    const settingsMap = new Map(settings?.map((s: any) => [s.user_id, s]) || [])

    const eligibleSubs = (subsWithoutSettings || []).filter((sub: any) => {
      const userSettings = settingsMap.get(sub.user_id)
      if (!userSettings) return true  // no settings = all enabled
      return (userSettings as any)[notification.category] !== false
    })

    // Send push to each subscription
    const results = await Promise.allSettled(
      eligibleSubs.map((sub: any) => sendWebPush(sub, notification, settingsMap.get(sub.user_id)))
    )

    // Remove expired subscriptions (410 Gone)
    const expiredIds = results
      .map((r, i) => r.status === 'rejected' && r.reason === 'gone' ? eligibleSubs[i].id : null)
      .filter(Boolean)

    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds)
    }

    return new Response(JSON.stringify({
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      expired: expiredIds.length,
    }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})

async function determineNotification(
  supabase: any,
  type: string,
  record: WebhookPayload['record'],
  old_record: WebhookPayload['old_record']
): Promise<NotificationData | null> {
  // Get child profile
  const { data: child } = await supabase
    .from('profiles')
    .select('name, family_id')
    .eq('id', record.child_id)
    .single()

  if (!child) return null

  // Get event type name
  let eventTypeName = record.custom_name || ''
  if (!eventTypeName && record.event_type_id) {
    const { data: eventType } = await supabase
      .from('event_types')
      .select('name')
      .eq('id', record.event_type_id)
      .single()
    eventTypeName = eventType?.name || ''
  }

  const points = record.points
  const isDeduction = points < 0
  const absPoints = Math.abs(points)
  const noteStr = record.note ? `: ${record.note}` : ''

  // CASE 1: Child creates a pending request (INSERT with status=pending)
  if (type === 'INSERT' && record.status === 'pending') {
    const body = isDeduction
      ? `−${absPoints} баллов ${eventTypeName}${noteStr}`
      : `+${absPoints} баллов ${eventTypeName}${noteStr}`

    // Recipients: all owner/admin in the family
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', child.family_id)
      .in('role', ['owner', 'admin'])

    return {
      title: child.name,
      body,
      category: 'child_requests',
      recipients: (admins || []).map((a: any) => a.id),
    }
  }

  // CASE 2: Admin approves a pending request (UPDATE pending→approved)
  if (type === 'UPDATE' && old_record?.status === 'pending' && record.status === 'approved') {
    const body = isDeduction
      ? `−${absPoints} баллов ${eventTypeName}${noteStr}`
      : `+${absPoints} баллов за ${eventTypeName}${noteStr}`

    return {
      title: 'Запрос одобрен',
      body,
      category: 'request_results',
      recipients: [record.child_id],
    }
  }

  // CASE 3: Admin rejects a pending request (UPDATE pending→rejected)
  if (type === 'UPDATE' && old_record?.status === 'pending' && record.status === 'rejected') {
    return {
      title: 'Запрос отклонён',
      body: `${eventTypeName}${noteStr}`,
      category: 'request_results',
      recipients: [record.child_id],
    }
  }

  // CASE 4: Admin directly creates an approved event (INSERT with status=approved)
  if (type === 'INSERT' && record.status === 'approved' && record.created_by !== record.child_id) {
    if (isDeduction) {
      return {
        title: 'Списание баллов',
        body: `−${absPoints} ${eventTypeName}${noteStr}`,
        category: 'direct_changes',
        recipients: [record.child_id],
      }
    } else {
      return {
        title: 'Начисление баллов',
        body: `+${absPoints} за ${eventTypeName}${noteStr}`,
        category: 'direct_changes',
        recipients: [record.child_id],
      }
    }
  }

  return null
}

async function sendWebPush(
  subscription: any,
  notification: NotificationData,
  settings: any | undefined
): Promise<void> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys_p256dh,
      auth: subscription.keys_auth,
    },
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    silent: settings?.sound === false,
    vibrate: settings?.vibration !== false ? [200, 100, 200] : undefined,
    data: { url: '/' },
  })

  // Web Push using VAPID
  const { default: webpush } = await import('https://esm.sh/web-push@3.6.7')

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  try {
    await webpush.sendNotification(pushSubscription, payload)
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      throw 'gone'
    }
    throw err
  }
}
