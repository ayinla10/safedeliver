import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function VerifyScreen() {
    const { verifyOtp, verifyPhone } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown]);

    async function handleVerify() {
        if (otp.length !== 6) { Alert.alert('Error', 'Enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            await verifyOtp(verifyPhone, otp);
        } catch (err) {
            Alert.alert('Verification Failed', err.message);
        } finally { setLoading(false); }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>📱</Text>
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.sub}>A 6-digit code was sent to{'\n'}<Text style={{ fontWeight: '700' }}>{verifyPhone}</Text></Text>

            <TextInput style={styles.otpInput} value={otp} maxLength={6} keyboardType="number-pad"
                onChangeText={v => setOtp(v.replace(/\D/g, ''))} placeholder="000000" textAlign="center" />

            <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading || otp.length !== 6}>
                <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>

            <Text style={styles.resend}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Tap to resend OTP'}
            </Text>
            <Text style={styles.hint}>💡 Check your terminal/console for the OTP code (dev mode)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    icon: { fontSize: 64, marginBottom: Spacing.md },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    sub: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
    otpInput: { width: '80%', fontSize: 32, letterSpacing: 12, fontWeight: '700', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.lg, color: Colors.text },
    btn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, width: '80%', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
    resend: { marginTop: Spacing.lg, color: Colors.textSecondary, fontSize: FontSizes.sm },
    hint: { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: FontSizes.xs, opacity: 0.6 },
});
