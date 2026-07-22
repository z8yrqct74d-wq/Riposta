import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Scaffold for later push work (Phase 7). Requests permission and returns the
// Expo push token, which a future backend job can store per-member and use to
// send lesson reminders / booking confirmations. Not wired into the app yet.
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
