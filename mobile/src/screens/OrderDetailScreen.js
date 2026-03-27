import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme';

export default function OrderDetailScreen({ route }) {
    const { id } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        api.get(`/transactions/${id}`).then(data => { setOrder(data); setLoading(false); }).catch(() => setLoading(false));
    }, [id]);

    async function handleShip() {
        Alert.alert('Ship Order', 'Mark this order as shipped?', [
            { text: 'Cancel' },
            {
                text: 'Ship', onPress: async () => {
                    setActionLoading(true);
                    try {
                        await api.patch(`/transactions/${id}/ship`);
                        setOrder({ ...order, status: 'SHIPPED' });
                        Alert.alert('Success', 'Order marked as shipped!');
                    } catch (err) { Alert.alert('Error', err.message); }
                    setActionLoading(false);
                }
            },
        ]);
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.brand} /></View>;
    if (!order) return <View style={styles.center}><Text>Order not found</Text></View>;

    const fmtGHS = (v) => `GHS ${(v / 100).toFixed(2)}`;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.orderRef}>{order.order_ref}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColor(order.status) }]}>
                    <Text style={styles.badgeText}>{order.status}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Order Details</Text>
                <DetailRow label="Product" value={order.product_name} />
                <DetailRow label="Total Amount" value={fmtGHS(order.total_amount)} valueColor={Colors.gold} />
                <DetailRow label="Platform Fee" value={fmtGHS(order.platform_fee)} />
                <DetailRow label="Your Payout" value={fmtGHS(order.seller_payout_amount)} valueColor={Colors.success} />
                <DetailRow label="Order Date" value={new Date(order.created_at).toLocaleString()} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Buyer Details</Text>
                <DetailRow label="Name" value={order.buyer_name} />
                <DetailRow label="Phone" value={order.buyer_phone} />
                <DetailRow label="Email" value={order.buyer_email} />
                <DetailRow label="Address" value={order.buyer_address} />
            </View>

            {order.status === 'PAID' && (
                <TouchableOpacity style={styles.shipBtn} onPress={handleShip} disabled={actionLoading}>
                    <Text style={styles.shipBtnText}>{actionLoading ? 'Processing...' : '📦 Mark as Shipped'}</Text>
                </TouchableOpacity>
            )}

            {order.dispute_raised && (
                <View style={styles.disputeAlert}>
                    <Text style={styles.disputeTitle}>⚠️ Dispute Raised</Text>
                    <Text style={styles.disputeReason}>{order.dispute_reason}</Text>
                </View>
            )}
        </ScrollView>
    );
}

function DetailRow({ label, value, valueColor }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

function badgeColor(status) {
    const map = { PAID: '#EAF4FB', SHIPPED: '#FEF9EC', DELIVERED: '#EAF7EE', RELEASED: '#EAF7EE', DISPUTED: '#FDECEC' };
    return map[status] || '#F0F0F0';
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    orderRef: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.text },
    badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    badgeText: { fontSize: FontSizes.sm, fontWeight: '700' },
    card: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
    cardTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    detailLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
    detailValue: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
    shipBtn: { backgroundColor: Colors.brand, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', marginVertical: Spacing.md },
    shipBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
    disputeAlert: { backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F5C6CB', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
    disputeTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.danger, marginBottom: Spacing.xs },
    disputeReason: { fontSize: FontSizes.sm, color: Colors.danger },
});
