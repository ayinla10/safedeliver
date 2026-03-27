import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function LinksScreen({ navigation }) {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLinks = useCallback(async () => {
        try {
            const data = await api.get('/checkout-links');
            setLinks(data);
        } catch (err) { console.log(err); }
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { loadLinks(); }, [loadLinks]));

    async function toggleLink(linkCode, active) {
        await api.patch(`/checkout-links/${linkCode}`, { is_active: !active });
        setLinks(links.map(l => l.link_code === linkCode ? { ...l, is_active: !active } : l));
    }

    async function deleteLink(linkCode) {
        Alert.alert('Delete Link', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await api.delete(`/checkout-links/${linkCode}`);
                    setLinks(links.filter(l => l.link_code !== linkCode));
                }
            },
        ]);
    }

    async function copyLink(linkCode) {
        await Clipboard.setStringAsync(`https://safedeliver.co/pay/${linkCode}`);
        Alert.alert('Copied!', 'Link copied to clipboard');
    }

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLinks} tintColor={Colors.brand} />}>
            <View style={styles.header}>
                <Text style={styles.title}>Checkout Links</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewLink')}>
                    <Text style={styles.addBtnText}>+ Create</Text>
                </TouchableOpacity>
            </View>

            {links.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>🔗</Text>
                    <Text style={styles.emptyText}>No checkout links yet</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('NewLink')}>
                        <Text style={styles.createBtnText}>Create Your First Link</Text>
                    </TouchableOpacity>
                </View>
            ) : links.map(link => (
                <View key={link.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.productName}>{link.product_name}</Text>
                        <View style={[styles.status, { backgroundColor: link.is_active ? '#EAF7EE' : '#FDECEC' }]}>
                            <Text style={[styles.statusText, { color: link.is_active ? Colors.success : Colors.danger }]}>
                                {link.is_active ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.code}>{link.link_code}</Text>
                    <Text style={styles.price}>GHS {(link.price / 100).toFixed(2)}{link.delivery_fee > 0 && ` + ${(link.delivery_fee / 100).toFixed(2)} delivery`}</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => copyLink(link.link_code)}>
                            <Text style={styles.actionText}>📋 Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLink(link.link_code, link.is_active)}>
                            <Text style={styles.actionText}>{link.is_active ? '⏸ Disable' : '▶ Enable'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteLink(link.link_code)}>
                            <Text style={[styles.actionText, { color: Colors.danger }]}>🗑 Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    addBtn: { backgroundColor: Colors.brand, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSizes.sm },
    card: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
    productName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, flex: 1 },
    status: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
    statusText: { fontSize: FontSizes.xs, fontWeight: '600' },
    code: { fontSize: FontSizes.sm, color: Colors.mid, fontFamily: 'monospace', marginBottom: Spacing.xs },
    price: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.md },
    actions: { flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
    actionBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
    actionText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
    empty: { alignItems: 'center', padding: Spacing.xxl },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
    emptyText: { color: Colors.textSecondary, marginBottom: Spacing.lg },
    createBtn: { backgroundColor: Colors.brand, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.sm },
    createBtnText: { color: '#fff', fontWeight: '600' },
});
