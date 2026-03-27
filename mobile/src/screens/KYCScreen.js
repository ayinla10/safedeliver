import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function KYCScreen() {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/seller/profile').then(d => { setSeller(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.brand} /></View>;

    return (
        <View style={s.container}>
            <Text style={s.title}>KYC Verification</Text>
            <View style={s.card}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>
                    {seller?.kyc_status === 'APPROVED' ? '✅' : '⏳'}
                </Text>
                <Text style={s.status}>Status: {seller?.kyc_status}</Text>
                {seller?.kyc_status === 'APPROVED' ? (
                    <Text style={{ color: Colors.success, marginTop: 12 }}>Your identity is verified!</Text>
                ) : (
                    <>
                        <TouchableOpacity style={s.uploadBtn}><Text>📷 Upload ID Card Photo</Text></TouchableOpacity>
                        <TouchableOpacity style={s.uploadBtn}><Text>🤳 Upload Selfie with ID</Text></TouchableOpacity>
                        <TouchableOpacity style={s.submitBtn}><Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text></TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FontSizes.xl, fontWeight: '700', marginBottom: Spacing.lg },
    card: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.lg },
    status: { fontSize: FontSizes.md, fontWeight: '600', marginBottom: Spacing.md },
    uploadBtn: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
    submitBtn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center' },
});
