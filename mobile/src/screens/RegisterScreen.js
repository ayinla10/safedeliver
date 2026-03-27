import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        if (!form.full_name || !form.email || !form.phone || !form.password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
        setLoading(true);
        try {
            await register(form.full_name, form.email, form.phone, form.password);
            navigation.navigate('Verify');
        } catch (err) {
            Alert.alert('Registration Failed', err.message);
        } finally { setLoading(false); }
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.logo}>🛡️</Text>
                    <Text style={styles.title}>Create Seller Account</Text>
                    <Text style={styles.sub}>Start selling with SafeDeliver</Text>
                </View>

                <View>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput style={styles.input} value={form.full_name}
                        onChangeText={v => setForm({ ...form, full_name: v })} placeholder="Your full name" />

                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput style={styles.input} value={form.email} keyboardType="email-address" autoCapitalize="none"
                        onChangeText={v => setForm({ ...form, email: v })} placeholder="you@email.com" />

                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <TextInput style={styles.input} value={form.phone} keyboardType="phone-pad"
                        onChangeText={v => setForm({ ...form, phone: v })} placeholder="+233..." />

                    <Text style={styles.label}>PASSWORD (MIN 8 CHARS)</Text>
                    <TextInput style={styles.input} value={form.password} secureTextEntry
                        onChangeText={v => setForm({ ...form, password: v })} placeholder="Create a password" />

                    <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
                        <Text style={styles.linkText}>Already have an account? <Text style={{ color: Colors.accent, fontWeight: '600' }}>Sign In</Text></Text>
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
    label: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.md, fontSize: FontSizes.md, marginBottom: Spacing.md, color: Colors.text },
    btn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', marginTop: Spacing.sm },
    btnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
    link: { alignItems: 'center', marginTop: Spacing.lg },
    linkText: { fontSize: FontSizes.md, color: Colors.textSecondary },
});
