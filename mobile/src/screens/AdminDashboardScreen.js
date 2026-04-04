import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, ActivityIndicator, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function AdminDashboardScreen({ navigation }) {
    const [stats, setStats] = useState({
        totalVolume: 0,
        activeDisputes: 0,
        pendingKyc: 0,
        totalSellers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // Parallel fetches for admin dashboard
            const [disputes, txs, sellers, kyc] = await Promise.all([
                api.get('/admin/disputes'),
                api.get('/admin/transactions?limit=100'),
                api.get('/admin/sellers'),
                api.get('/admin/kyc-applications?status=PENDING')
            ]);

            const volume = (txs.transactions || []).reduce((acc, t) => acc + parseInt(t.total_amount || 0), 0);
            
            setStats({
                totalVolume: volume,
                activeDisputes: (disputes || []).length,
                pendingKyc: (kyc || []).length,
                totalSellers: (sellers || []).length
            });
        } catch (err) {
            console.error('Admin Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
            
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Console</Text>
                    <Text style={styles.headerSub}>Platform Overview</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminData}>
                    <Ionicons name="refresh" size={20} color="#F1F5F9" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAdminData} tintColor="#2B7DE9" />}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Volume</Text>
                        <Text style={styles.statValue}>GHS {(stats.totalVolume / 100).toLocaleString()}</Text>
                        <View style={[styles.statBadge, {backgroundColor: '#22C55E20'}]}>
                            <Text style={[styles.statBadgeText, {color: '#22C55E'}]}>+12.5%</Text>
                        </View>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Active Disputes</Text>
                        <Text style={[styles.statValue, {color: stats.activeDisputes > 0 ? '#EF4444' : '#ffffff'}]}>
                            {stats.activeDisputes}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminDisputes')}>
                            <Text style={styles.statAction}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Pending KYC</Text>
                        <Text style={styles.statValue}>{stats.pendingKyc}</Text>
                        <TouchableOpacity>
                            <Text style={styles.statAction}>Review</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Sellers</Text>
                        <Text style={styles.statValue}>{stats.totalSellers}</Text>
                        <Text style={styles.statAction}>Manage</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconContainer, {backgroundColor: '#EF444415'}]}>
                            <Ionicons name="alert-circle" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.actionText}>Review Disputes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconContainer, {backgroundColor: '#22C55E15'}]}>
                            <Ionicons name="checkmark-shield" size={24} color="#22C55E" />
                        </View>
                        <Text style={styles.actionText}>KYC Approval</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconContainer, {backgroundColor: '#2B7DE915'}]}>
                            <Ionicons name="list" size={24} color="#2B7DE9" />
                        </View>
                        <Text style={styles.actionText}>Audit Logs</Text>
                    </TouchableOpacity>
                </View>

                {/* System Health placeholder */}
                <View style={styles.healthCard}>
                    <View style={styles.healthRow}>
                        <Ionicons name="server-outline" size={20} color="#22C55E" />
                        <Text style={styles.healthText}>System Status: Healthy</Text>
                    </View>
                    <View style={styles.healthRow}>
                        <Ionicons name="flash-outline" size={20} color="#EAB308" />
                        <Text style={styles.healthText}>Latency: 45ms</Text>
                    </View>
                </View>

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
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerSub: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        width: '47%',
        backgroundColor: '#12131a',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statLabel: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 8,
    },
    statValue: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
    statBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 8,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    statAction: {
        color: '#2B7DE9',
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    actionsContainer: {
        gap: 12,
        marginBottom: 32,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#12131a',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionText: {
        color: '#F1F5F9',
        fontSize: 16,
        fontWeight: '600',
    },
    healthCard: {
        backgroundColor: '#1a1b21',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    healthText: {
        color: '#64748B',
        fontSize: 14,
    }
});
