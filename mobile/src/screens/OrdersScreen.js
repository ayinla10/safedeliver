import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

const TABS = ['All', 'PAID', 'SHIPPED', 'DELIVERED', 'RELEASED', 'DISPUTED'];

export default function OrdersScreen({ navigation }) {
    const [tab, setTab] = useState('All');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = useCallback(async () => {
        try {
            const params = tab === 'All' ? '?limit=50' : `?status=${tab}&limit=50`;
            const data = await api.get(`/transactions${params}`);
            setOrders(data.transactions || []);
        } catch (err) { console.log(err); }
        setLoading(false);
    }, [tab]);

    useFocusEffect(useCallback(() => { setLoading(true); loadOrders(); }, [loadOrders]));

    const fmtGHS = (v) => `GHS ${(v / 100).toFixed(2)}`;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Orders</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
                {TABS.map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                        <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor={Colors.brand} />}>
                {orders.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyText}>No {tab === 'All' ? '' : tab.toLowerCase() + ' '}orders</Text>
                    </View>
                ) : orders.map(tx => (
                    <TouchableOpacity key={tx.id} style={styles.card}
                        onPress={() => navigation.navigate('OrderDetail', { id: tx.id })}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.ref}>{tx.order_ref}</Text>
                                <Text style={styles.product}>{tx.product_name}</Text>
                                <Text style={styles.buyer}>{tx.buyer_name}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.amount}>{fmtGHS(tx.total_amount)}</Text>
                                <View style={[styles.badge, { backgroundColor: badgeColor(tx.status) }]}>
                                    <Text style={styles.badgeText}>{tx.status}</Text>
                                </View>
                                <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

function badgeColor(status) {
    const map = { PAID: '#EAF4FB', SHIPPED: '#FEF9EC', DELIVERED: '#EAF7EE', CONFIRMED: '#EAF7EE', RELEASED: '#EAF7EE', DISPUTED: '#FDECEC', REFUNDED: '#FDECEC' };
    return map[status] || '#F0F0F0';
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    tabs: { marginBottom: Spacing.md, flexGrow: 0 },
    tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 6, marginRight: Spacing.xs, backgroundColor: Colors.light },
    tabActive: { backgroundColor: Colors.brand },
    tabText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    card: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    ref: { fontSize: FontSizes.sm, color: Colors.mid, fontFamily: 'monospace' },
    product: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginTop: 2 },
    buyer: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    amount: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.gold },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 4 },
    badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
    date: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
    empty: { alignItems: 'center', padding: Spacing.xxl },
    emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
    emptyText: { color: Colors.textSecondary },
});
