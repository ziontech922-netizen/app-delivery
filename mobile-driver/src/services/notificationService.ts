import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../config/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      // Configure Android channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('new-orders', {
          name: 'Novos Pedidos',
          importance: 4, // HIGH
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('delivery-updates', {
          name: 'Atualizações de Entrega',
          importance: 3, // DEFAULT
          vibrationPattern: [0, 250],
          lightColor: '#16a34a',
        });
      }

      // Register token with backend
      await this.registerTokenWithBackend(token.data);

      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/notifications/register', {
        token,
        platform: Platform.OS,
        type: 'DRIVER',
      });
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  addNotificationReceivedListener(
    callback: (notification: any) => void
  ): { remove: () => void } {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: any) => void
  ): { remove: () => void } {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
