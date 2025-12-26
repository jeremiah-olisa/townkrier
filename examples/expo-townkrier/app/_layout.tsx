import { Stack } from 'expo-router';
import PushNotificationHandler from '../components/PushNotificationHandler';

export default function RootLayout() {
  return (
    <PushNotificationHandler>
      <Stack />
    </PushNotificationHandler>
  );
}
