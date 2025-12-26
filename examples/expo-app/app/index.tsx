import { Text, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePushNotifications } from './usePushNotifications';

export default function App() {
  const { expoPushToken, notification } = usePushNotifications();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Townkrier Push Demo</Text>

      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Push Token:</Text>
        <Text selectable style={styles.token}>
          {expoPushToken || 'Loading/Error...'}
        </Text>
      </View>

      <View style={styles.notificationContainer}>
        <Text style={styles.label}>Last Notification:</Text>
        <Text style={styles.message}>
          Title: {notification && notification.request.content.title}{' '}
        </Text>
        <Text style={styles.message}>
          Body: {notification && notification.request.content.body}
        </Text>
        <Text style={styles.message}>
          Data: {notification && JSON.stringify(notification.request.content.data)}
        </Text>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tokenContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  token: {
    fontSize: 14,
    color: 'blue',
    textAlign: 'center',
  },
  notificationContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '100%',
  },
  message: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});
