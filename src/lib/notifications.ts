import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule 24h and 1h reminders before a task due date.
 * Returns the notification identifiers so they can be cancelled later.
 */
export async function scheduleTaskReminders(
  taskId: string,
  taskTitle: string,
  dueDate: string
): Promise<{ id24h: string | null; id1h: string | null }> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return { id24h: null, id1h: null };

  const due = new Date(dueDate);
  const now = new Date();

  const trigger24h = new Date(due.getTime() - 24 * 60 * 60 * 1000);
  const trigger1h  = new Date(due.getTime() - 60 * 60 * 1000);

  let id24h: string | null = null;
  let id1h:  string | null = null;

  if (trigger24h > now) {
    id24h = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Task due tomorrow',
        body: `"${taskTitle}" is due in 24 hours. Get started!`,
        data: { taskId },
        sound: true,
      },
      trigger: { date: trigger24h },
    });
  }

  if (trigger1h > now) {
    id1h = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Task due soon',
        body: `"${taskTitle}" is due in 1 hour!`,
        data: { taskId },
        sound: true,
      },
      trigger: { date: trigger1h },
    });
  }

  return { id24h, id1h };
}

/**
 * Cancel scheduled notifications for a task using stored identifiers.
 */
export async function cancelTaskReminders(notifIds: (string | null)[]): Promise<void> {
  for (const id of notifIds) {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (_) {
        // Notification may have already fired; ignore
      }
    }
  }
}

/**
 * Cancel ALL scheduled notifications — useful for logout or full reset.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Send an immediate local notification (e.g. for task overdue).
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // fire immediately
  });
}
