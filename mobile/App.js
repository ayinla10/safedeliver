import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/AuthContext';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import * as Linking from 'expo-linking';
import { registerForPushNotifications, addNotificationListeners } from './src/notifications';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'safedeliver://'],
  config: {
    screens: {
      BuyerInterstitial: 'pay/:linkCode',
      Main: {
        screens: {
          Links: 'links',
        }
      }
    },
  },
};

// --- Auth Screens ---
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import SplashScreen from './src/screens/auth/SplashScreen';

// --- Seller Screens ---
import DashboardScreen from './src/screens/DashboardScreen';
import LinksScreen from './src/screens/LinksScreen';
import NewLinkScreen from './src/screens/NewLinkScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import KYCScreen from './src/screens/KYCScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// --- Buyer Screens ---
import InterstitialScreen from './src/screens/buyer/InterstitialScreen';
import BuyerCheckoutScreen from './src/screens/buyer/BuyerCheckoutScreen';
import WaitingQuoteScreen from './src/screens/buyer/WaitingQuoteScreen';
import QuoteReceivedScreen from './src/screens/buyer/QuoteReceivedScreen';
import PaymentScreen from './src/screens/buyer/PaymentScreen';
import TrackingScreen from './src/screens/buyer/TrackingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LinksStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

function LinksStackNav() {
  const { colors } = useTheme();
  const screenOpts = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.bg },
  };
  return (
    <LinksStack.Navigator screenOptions={screenOpts}>
      <LinksStack.Screen name="LinksList" component={LinksScreen} options={{ headerShown: false }} />
      <LinksStack.Screen name="NewLink" component={NewLinkScreen} options={{ headerShown: false }} />
    </LinksStack.Navigator>
  );
}

function OrdersStackNav() {
  const { colors } = useTheme();
  const screenOpts = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.bg },
  };
  return (
    <OrdersStack.Navigator screenOptions={screenOpts}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} options={{ headerShown: false }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
    </OrdersStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'LinksTab') {
            iconName = focused ? 'link' : 'link-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'KYC') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'android' ? 70 : 80,
          paddingBottom: Platform.OS === 'android' ? 12 : 24,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="LinksTab" component={LinksStackNav} options={{ title: 'Links' }} />
      <Tab.Screen name="OrdersTab" component={OrdersStackNav} options={{ title: 'Orders' }} />
      <Tab.Screen name="KYC" component={KYCScreen} options={{ title: 'Verification' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- Admin Screens ---
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminDisputesScreen from './src/screens/AdminDisputesScreen';
import AdminKYCScreen from './src/screens/AdminKYCScreen';

const AdminStack = createNativeStackNavigator();

function AdminStackNav() {
  const { colors } = useTheme();
  const screenOpts = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.bg },
  };
  return (
    <AdminStack.Navigator screenOptions={screenOpts}>
      <AdminStack.Screen name="AdminHome" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <AdminStack.Screen name="AdminDisputes" component={AdminDisputesScreen} options={{ headerShown: false }} />
    </AdminStack.Navigator>
  );
}

function AdminTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'AdminDisputesTab') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'AdminKYC') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.danger,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: Platform.OS === 'android' ? 70 : 80,
          paddingBottom: Platform.OS === 'android' ? 12 : 24,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminStackNav} options={{ title: 'Platform' }} />
      <Tab.Screen name="AdminKYC" component={AdminKYCScreen} options={{ title: 'KYC' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { seller, loading } = useAuth();
  const { colors } = useTheme();

  const screenOpts = {
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.bg },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOpts}>
      {seller ? (
        <>
          {seller.is_admin ? (
            <Stack.Screen name="AdminMain" component={AdminTabs} options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: false }} />
          
          <Stack.Screen name="BuyerInterstitial" component={InterstitialScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BuyerCheckout" component={BuyerCheckoutScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BuyerWaiting" component={WaitingQuoteScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BuyerQuoteReceived" component={QuoteReceivedScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BuyerPayment" component={PaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BuyerTracking" component={TrackingScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppWithTheme() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) console.log('Push notifications registered:', token);
    });

    const cleanup = addNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification.request.content.title);
      },
      (response) => {
        console.log('Notification tapped:', response.notification.request.content.data);
      }
    );

    return cleanup;
  }, []);

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.brand,
      background: colors.bg,
      card: colors.tabBar,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: Platform.select({
      ios: {
        regular: { fontFamily: 'System', fontWeight: '400' },
        medium: { fontFamily: 'System', fontWeight: '500' },
        bold: { fontFamily: 'System', fontWeight: '600' },
        heavy: { fontFamily: 'System', fontWeight: '700' },
      },
      default: {
        regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
        medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
        bold: { fontFamily: 'sans-serif', fontWeight: 'bold' },
        heavy: { fontFamily: 'sans-serif', fontWeight: '900' },
      },
    }),
  };

  return (
    <NavigationContainer linking={linking} theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
