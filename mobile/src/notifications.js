import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to determine if we are in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';

// Only load expo-notifications if NOT in Expo Go
// This cleanly suppresses the red error from Expo Go about remote notifications
let Notifications = null;
if (!isExpoGo) {
    try {
        Notifications = require('expo-notifications');
        // Configure how notifications appear when app is in foreground
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    } catch (e) {
        console.log('Notification module load skipped:', e.message);
    }
} else {
    console.log('Running in Expo Go: Push notifications are disabled cleanly.');
}

// Register for push notifications and return the token
export async function registerForPushNotifications() {
    try {
        if (isExpoGo || !Notifications) {
            return null;
        }

        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return null;
        }

        // Android-specific notification channels
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'SafeDeliver',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#2B7DE9',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('orders', {
                name: 'Order Updates',
                description: 'Notifications about order status changes',
                importance: Notifications.AndroidImportance.HIGH,
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('payments', {
                name: 'Payment Alerts',
                description: 'Payment confirmations and escrow releases',
                importance: Notifications.AndroidImportance.MAX,
                sound: 'default',
            });
        }

        // Get the Expo push token
        let token = null;
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            if (projectId) {
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                console.log('Push token:', token);
                await AsyncStorage.setItem('sd-push-token', token);
            } else {
                console.log('No EAS projectId — push token skipped');
            }
        } catch (err) {
            console.log('Push token registration skipped:', err.message);
        }

        return token;
    } catch (err) {
        console.log('Push notification setup skipped:', err.message);
        return null;
    }
}

// Schedule a local notification
export async function sendLocalNotification(title, body, data = {}) {
    try {
        if (isExpoGo || !Notifications) return;
        await Notifications.scheduleNotificationAsync({
            content: { title, body, data, sound: 'default' },
            trigger: null,
        });
    } catch (err) {
        console.log('Local notification failed:', err.message);
    }
}

// Add notification listeners
export function addNotificationListeners(onReceived, onTapped) {
    try {
        if (isExpoGo || !Notifications) return () => {};

        const receivedSub = Notifications.addNotificationReceivedListener(n => {
            if (onReceived) onReceived(n);
        });

        const responseSub = Notifications.addNotificationResponseReceivedListener(r => {
            if (onTapped) onTapped(r);
        });

        return () => {
            receivedSub.remove();
            responseSub.remove();
        };
    } catch (err) {
        console.log('Notification listeners skipped:', err.message);
        return () => {};
    }
}
