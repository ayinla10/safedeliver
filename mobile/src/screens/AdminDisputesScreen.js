import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, Alert, ActivityIndicator, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function AdminDisputesScreen({ navigation }) {
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

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Active Disputes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDisputes} tintColor="#2B7DE9" />}
            >
                {disputes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="shield-checkmark-outline" size={48} color="rgba(255,255,255,0.05)" />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 16,
        marginTop: 16,
    },
    disputeCard: {
        backgroundColor: '#12131a',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    refContainer: {
        flex: 1,
    },
    orderRef: {
        color: '#64748B',
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    amount: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    disputeBadge: {
        backgroundColor: '#EF444415',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    disputeBadgeText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginBottom: 16,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 4,
    },
    detailValue: {
        color: '#F1F5F9',
        fontSize: 14,
        fontWeight: '600',
    },
    reasonBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    reasonLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    reasonText: {
        color: '#E2E8F0',
        fontSize: 13,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refundBtn: {
        backgroundColor: '#EF444415',
        borderWidth: 1,
        borderColor: '#EF444430',
    },
    refundText: {
        color: '#EF4444',
        fontWeight: '600',
    },
    releaseBtn: {
        backgroundColor: '#22C55E15',
        borderWidth: 1,
        borderColor: '#22C55E30',
    },
    releaseText: {
        color: '#22C55E',
        fontWeight: '600',
    }
});
