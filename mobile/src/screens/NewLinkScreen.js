import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function NewLinkScreen({ navigation }) {
    const [form, setForm] = useState({ product_name: '', description: '', price: '', delivery_fee: '0', image_url: '' });
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        if (!form.product_name || !form.price) { Alert.alert('Error', 'Product name and price are required'); return; }
        setLoading(true);
        try {
            await api.post('/checkout-links', {
                product_name: form.product_name,
                description: form.description || undefined,
                price: Math.round(parseFloat(form.price) * 100),
                delivery_fee: Math.round(parseFloat(form.delivery_fee || 0) * 100),
                image_url: form.image_url || undefined,
            });
            Alert.alert('Success', 'Checkout link created!');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally { setLoading(false); }
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Create Checkout Link</Text>
                <Text style={styles.sub}>Create a payment link to share with buyers</Text>

                <Text style={styles.label}>PRODUCT NAME *</Text>
                <TextInput style={styles.input} value={form.product_name} placeholder="e.g. Nike Air Max"
                    onChangeText={v => setForm({ ...form, product_name: v })} />

                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput style={[styles.input, { minHeight: 80 }]} value={form.description} multiline
                    placeholder="Product description (optional)" onChangeText={v => setForm({ ...form, description: v })} />

                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>PRICE (GHS) *</Text>
                        <TextInput style={styles.input} value={form.price} keyboardType="decimal-pad" placeholder="0.00"
                            onChangeText={v => setForm({ ...form, price: v })} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>DELIVERY FEE (GHS)</Text>
                        <TextInput style={styles.input} value={form.delivery_fee} keyboardType="decimal-pad" placeholder="0.00"
                            onChangeText={v => setForm({ ...form, delivery_fee: v })} />
                    </View>
                </View>

                <Text style={styles.label}>PRODUCT IMAGE URL</Text>
                <TextInput style={styles.input} value={form.image_url} placeholder="https://..." autoCapitalize="none"
                    onChangeText={v => setForm({ ...form, image_url: v })} />

                <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
                    <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Checkout Link'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
    label: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 0.5 },
    input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.md, fontSize: FontSizes.md, marginBottom: Spacing.md, color: Colors.text },
    btn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', marginTop: Spacing.sm },
    btnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
});
