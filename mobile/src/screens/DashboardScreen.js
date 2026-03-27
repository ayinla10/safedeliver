import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function DashboardScreen({ navigation }) {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [s, t] = await Promise.all([api.get('/seller/stats'), api.get('/transactions?limit=5')]);
            setStats(s);
            setOrders(t.transactions || []);
        } catch (err) { console.log('Dashboard error:', err); }
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

    const fmtGHS = (v) => `GHS ${((v || 0) / 100).toFixed(2)}`;

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.sub}>Welcome to SafeDeliver</Text>

            {stats && (
                <View style={styles.statsRow}>
                    <StatCard value={fmtGHS(stats.total_revenue)} label="Revenue" color={Colors.gold} />
                    <StatCard value={String(stats.total_orders || 0)} label="Orders" color={Colors.brand} />
                    <StatCard value={String(stats.active_orders || 0)} label="Active" color={Colors.accent} />
                    <StatCard value={fmtGHS(stats.escrow_balance)} label="In Escrow" color={Colors.warn} />
                </View>
            )}

            <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('LinksTab', { screen: 'NewLink' })}>
                <Text style={styles.createBtnText}>+ Create Checkout Link</Text>
            </TouchableOpacity>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>
                {orders.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <Text style={styles.emptyText}>No orders yet</Text>
                    </View>
                ) : orders.map(tx => (
                    <TouchableOpacity key={tx.id} style={styles.orderCard}
                        onPress={() => navigation.navigate('OrdersTab', { screen: 'OrderDetail', params: { id: tx.id } })}>
                        <View style={styles.orderRow}>
                            <View>
                                <Text style={styles.orderRef}>{tx.order_ref}</Text>
                                <Text style={styles.orderProduct}>{tx.product_name}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.orderAmount}>{fmtGHS(tx.total_amount)}</Text>
                                <View style={[styles.badge, { backgroundColor: badgeColor(tx.status) }]}>
                                    <Text style={styles.badgeText}>{tx.status}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

function StatCard({ value, label, color }) {
    return (
        <View style={styles.statCard}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function badgeColor(status) {
    const map = { PAID: '#EAF4FB', SHIPPED: '#FEF9EC', DELIVERED: '#EAF7EE', RELEASED: '#EAF7EE', DISPUTED: '#FDECEC', REFUNDED: '#FDECEC' };
    return map[status] || '#F0F0F0';
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    title: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    sub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
    statValue: { fontSize: FontSizes.lg, fontWeight: '700' },
    statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: Spacing.xs, textTransform: 'uppercase' },
    createBtn: { backgroundColor: Colors.brand, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', marginBottom: Spacing.lg },
    createBtnText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '600' },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
    orderCard: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
    orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderRef: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.mid, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    orderProduct: { fontSize: FontSizes.md, color: Colors.text, marginTop: 2 },
    orderAmount: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.gold },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 4 },
    badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
    empty: { alignItems: 'center', padding: Spacing.xl },
    emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
    emptyText: { color: Colors.textSecondary },
});
