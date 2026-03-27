import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from './src/AuthContext';
import { Colors } from './src/theme';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LinksScreen from './src/screens/LinksScreen';
import NewLinkScreen from './src/screens/NewLinkScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import KYCScreen from './src/screens/KYCScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const LinksStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

function LinksStackNav() {
    return (
        <LinksStack.Navigator screenOptions={screenOpts}>
            <LinksStack.Screen name="LinksList" component={LinksScreen} options={{ title: 'Checkout Links' }} />
            <LinksStack.Screen name="NewLink" component={NewLinkScreen} options={{ title: 'Create Link' }} />
        </LinksStack.Navigator>
    );
}

function OrdersStackNav() {
    return (
        <OrdersStack.Navigator screenOptions={screenOpts}>
            <OrdersStack.Screen name="OrdersList" component={OrdersScreen} options={{ title: 'Orders' }} />
            <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
        </OrdersStack.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => {
                const icons = { Home: '📊', LinksTab: '🔗', OrdersTab: '📦', Profile: '👤' };
                return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[route.name]}</Text>;
            },
            tabBarActiveTintColor: Colors.brand,
            tabBarInactiveTintColor: Colors.mid,
            tabBarStyle: { borderTopColor: Colors.border, paddingBottom: 4, height: 56 },
            headerShown: false,
        })}>
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="LinksTab" component={LinksStackNav} options={{ title: 'Links' }} />
            <Tab.Screen name="OrdersTab" component={OrdersStackNav} options={{ title: 'Orders' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AppNavigator() {
    const { seller, loading, needsVerify } = useAuth();

    if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}><ActivityIndicator size="large" color={Colors.brand} /></View>;

    return (
        <Stack.Navigator screenOptions={screenOpts}>
            {seller ? (
                <>
                    <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                    <Stack.Screen name="KYC" component={KYCScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                </>
            ) : needsVerify ? (
                <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Verify Phone' }} />
            ) : (
                <>
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Verify Phone' }} />
                </>
            )}
        </Stack.Navigator>
    );
}

const screenOpts = {
    headerStyle: { backgroundColor: Colors.cardBg },
    headerTintColor: Colors.text,
    headerShadowVisible: false,
    contentStyle: { backgroundColor: Colors.bg },
};

export default function App() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
}
