import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, Alert, ActivityIndicator, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

export default function AdminDisputesScreen({ navigation }) {
    const { colors } = useTheme();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/disputes');
            setDisputes(data);
        } catch (err) {
            console.error('Fetch disputes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id, decision) => {
        Alert.alert(
            'Confirm Resolution',
            `Are you sure you want to ${decision} these funds?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    onPress: async () => {
                        try {
                            await api.patch(`/admin/disputes/${id}/resolve`, {
                                decision: decision,
                                notes: `Resolved via Admin Mobile App: ${decision}`
                            });
                            Alert.alert('Success', `Dispute resolved as ${decision}`);
                            fetchDisputes();
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        }
                    }
                }
            ]
        );
    };

    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Active Disputes</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDisputes} tintColor={colors.brand} />}
            >
                {disputes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-checkmark-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No active disputes'}</Text>
                    </View>
                ) : (
                    disputes.map((tx) => (
                        <View key={tx.id} style={styles.disputeCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.refContainer}>
                                    <Text style={styles.orderRef}>{tx.order_ref}</Text>
                                    <Text style={styles.amount}>GHS {(tx.total_amount / 100).toFixed(2)}</Text>
                                </View>
                                <View style={styles.disputeBadge}>
                                    <Text style={styles.disputeBadgeText}>DISPUTED</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Seller</Text>
                                    <Text style={styles.detailValue}>{tx.seller_name}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Phone</Text>
                                    <Text style={styles.detailValue}>{tx.seller_phone}</Text>
                                </View>
                            </View>

                            <View style={styles.reasonBox}>
                                <Text style={styles.reasonLabel}>Buyer Information</Text>
                                <Text style={styles.reasonText}>
                                    Customer: {tx.buyer_name || 'N/A'}{'\n'}
                                    Phone: {tx.buyer_phone || 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.refundBtn]}
                                    onPress={() => handleResolve(tx.id, 'REFUND')}
                                >
                                    <Text style={styles.refundText}>Refund Buyer</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.releaseBtn]}
                                    onPress={() => handleResolve(tx.id, 'RELEASE')}
                                >
                                    <Text style={styles.releaseText}>Release to Seller</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyState: {
        paddingVertical: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 17,
        fontWeight: '600',
        marginTop: 20,
    },
    disputeCard: {
        backgroundColor: colors.cardGlass,
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.danger + '30',
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    refContainer: {
        flex: 1,
    },
    orderRef: {
        color: colors.textMuted,
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 6,
        fontWeight: '600',
    },
    amount: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    disputeBadge: {
        backgroundColor: colors.danger + '15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    disputeBadgeText: {
        color: colors.danger,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 24,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    detailValue: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
    },
    reasonBox: {
        backgroundColor: colors.cardAlt,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reasonLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    reasonText: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    refundBtn: {
        backgroundColor: colors.danger + '10',
        borderColor: colors.danger + '40',
    },
    refundText: {
        color: colors.danger,
        fontWeight: '800',
        fontSize: 14,
    },
    releaseBtn: {
        backgroundColor: colors.success + '10',
        borderColor: colors.success + '40',
    },
    releaseText: {
        color: colors.success,
        fontWeight: '800',
        fontSize: 14,
    }
});
