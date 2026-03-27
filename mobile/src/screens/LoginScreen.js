import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        if (!phone || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
        setLoading(true);
        try {
            await login(phone, password);
        } catch (err) {
            Alert.alert('Login Failed', err.message);
        } finally { setLoading(false); }
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.logo}>🛡️</Text>
                    <Text style={styles.title}>Seller Login</Text>
                    <Text style={styles.sub}>Welcome back to SafeDeliver</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                        placeholder="+233..." keyboardType="phone-pad" autoCapitalize="none" />

                    <Text style={styles.label}>PASSWORD</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword}
                        placeholder="Enter password" secureTextEntry />

                    <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={{ color: Colors.accent, fontWeight: '600' }}>Register</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    logo: { fontSize: 48, marginBottom: Spacing.sm },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    form: {},
    label: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.md, fontSize: FontSizes.md, marginBottom: Spacing.md, color: Colors.text },
    btn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', marginTop: Spacing.sm },
    btnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
    link: { alignItems: 'center', marginTop: Spacing.lg },
    linkText: { fontSize: FontSizes.md, color: Colors.textSecondary },
});
