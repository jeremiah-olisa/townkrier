import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { vapidKey } from '../firebaseConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PushNotificationHandler({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined,
  );
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => token && setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(expoPushToken);
    if (Platform.OS !== 'web') {
      Alert.alert('Copied!', 'Push token copied to clipboard');
    } else {
      window.alert('Copied push token to clipboard');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <View
        style={{ padding: 20, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ccc' }}
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Push Token:</Text>
        <Text
          selectable
          style={{ marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
        >
          {expoPushToken || 'Loading...'}
        </Text>
        <Button title="Copy Token" onPress={copyToClipboard} />

        {notification && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold' }}>Last Notification:</Text>
            <Text>Title: {notification.request.content.title}</Text>
            <Text>Body: {notification.request.content.body}</Text>
            <Text>Data: {JSON.stringify(notification.request.content.data)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice || Platform.OS === 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // TAS: We are using direct FCM tokens if possible, but Expo wrapper is easier for demo.
    // For Web, we specifically need the VAPID key.
    try {
      if (Platform.OS === 'web') {
        // For web we might want to use the imported vapidKey directly with getDevicePushTokenAsync equivalent or just standard expo one
        // Expo SDK 50+ handles web vapid via Constants or params?
        // Actually Notifications.getDevicePushTokenAsync() with proper config is preferred for "bare" fcm
        // But getExpoPushTokenAsync is easier for standard expo ecosystem
        // Let's try getExpoPushTokenAsync first, but pass projectId if needed
        /*
                 Basic Expo Push:
                */
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        // If we don't have EAS project ID, it might fail for expo push service, but let's see.
        // However, user wants FCM.
        // For Web FCM, we might need to use `firebase/messaging` directly OR `expo-notifications` with VAPID.
        // `expo-notifications` has limited web support for pure FCM without Expo Push Service wrapping.
        // But let's stick to the docs provided by user reference if applicable, or standard Expo docs.
        // Standard Expo docs say for Web:
        // await Notifications.getDevicePushTokenAsync() returns native token
        // await Notifications.getExpoPushTokenAsync() returns expo token

        // Let's get the Expo Token for simplicity in demo as it delegates to FCM on key config
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
            vapidKey: vapidKey,
          })
        ).data;
      } else {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
    } catch (e) {
      console.log(e);
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
