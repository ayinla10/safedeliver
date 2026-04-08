import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [needsVerify, setNeedsVerify] = useState(false);
    const [verifyPhone, setVerifyPhone] = useState('');

    useEffect(() => {
        api.onTokenExpired = logout;
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const token = await AsyncStorage.getItem('sd-token');
            const sellerData = await AsyncStorage.getItem('sd-seller');
            if (token && sellerData) {
                setSeller(JSON.parse(sellerData));
            }
        } catch (e) {
            console.log('Auth check error:', e);
        } finally {
            setLoading(false);
        }
    }

    async function login(phone, password) {
        const data = await api.post('/auth/login', { phone, password });
        await AsyncStorage.setItem('sd-token', data.accessToken);
        await AsyncStorage.setItem('sd-refresh-token', data.refreshToken);
        await AsyncStorage.setItem('sd-seller', JSON.stringify(data.seller));
        setSeller(data.seller);
        return data;
    }

    async function register(full_name, email, phone, password) {
        await api.post('/auth/register', { full_name, email, phone, password });
        setVerifyPhone(phone);
        setNeedsVerify(true);
    }

    async function verifyOtp(phone, otp) {
        const data = await api.post('/auth/verify-otp', { phone, otp });
        await AsyncStorage.setItem('sd-token', data.accessToken);
        await AsyncStorage.setItem('sd-refresh-token', data.refreshToken);
        await AsyncStorage.setItem('sd-seller', JSON.stringify(data.seller));
        setSeller(data.seller);
        setNeedsVerify(false);
    }

    async function logout() {
        await AsyncStorage.multiRemove(['sd-token', 'sd-refresh-token', 'sd-seller']);
        setSeller(null);
    }

    async function refreshSeller(newSellerData) {
        if (newSellerData) {
            setSeller(prev => ({ ...prev, ...newSellerData }));
            await AsyncStorage.setItem('sd-seller', JSON.stringify({ ...seller, ...newSellerData }));
        }
    }

    return (
        <AuthContext.Provider value={{ seller, setSeller, loading, login, register, verifyOtp, logout, refreshSeller, needsVerify, verifyPhone, setNeedsVerify, setVerifyPhone }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
