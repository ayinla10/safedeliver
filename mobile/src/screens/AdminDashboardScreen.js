import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StatusBar as RNStatusBar, ActivityIndicator, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

export default function AdminDashboardScreen({ navigation }) {
    const { colors } = useTheme();
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

    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
            
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Console</Text>
                    <Text style={styles.headerSub}>Platform Overview</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminData}>
                    <Ionicons name="refresh" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAdminData} tintColor={colors.brand} />}
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Volume</Text>
                        <Text style={styles.statValue}>GHS {(stats.totalVolume / 100).toLocaleString()}</Text>
                        <View style={[styles.statBadge, {backgroundColor: colors.success + '20'}]}>
                            <Text style={[styles.statBadgeText, {color: colors.success}]}>+12.5%</Text>
                        </View>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Active Disputes</Text>
                        <Text style={[styles.statValue, {color: stats.activeDisputes > 0 ? colors.danger : colors.text}]}>
                            {stats.activeDisputes}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminDisputes')}>
                            <Text style={styles.statAction}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Pending KYC</Text>
                        <Text style={styles.statValue}>{stats.pendingKyc}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminKYC')}>
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
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminDisputes')}>
                        <View style={[styles.iconContainer, {backgroundColor: colors.danger + '15'}]}>
                            <Ionicons name="alert-circle" size={24} color={colors.danger} />
                        </View>
                        <Text style={styles.actionText}>Review Disputes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminKYC')}>
                        <View style={[styles.iconContainer, {backgroundColor: colors.success + '15'}]}>
                            <Ionicons name="checkmark-shield" size={24} color={colors.success} />
                        </View>
                        <Text style={styles.actionText}>KYC Approval</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <View style={[styles.iconContainer, {backgroundColor: colors.brand + '15'}]}>
                            <Ionicons name="list" size={24} color={colors.brand} />
                        </View>
                        <Text style={styles.actionText}>Audit Logs</Text>
                    </TouchableOpacity>
                </View>

                {/* System Health placeholder */}
                <View style={styles.healthCard}>
                    <View style={styles.healthRow}>
                        <Ionicons name="server-outline" size={20} color={colors.success} />
                        <Text style={styles.healthText}>System Status: Healthy</Text>
                    </View>
                    <View style={styles.healthRow}>
                        <Ionicons name="flash-outline" size={20} color={colors.warning} />
                        <Text style={styles.healthText}>Latency: 45ms</Text>
                    </View>
                </View>

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
        paddingVertical: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -1,
    },
    headerSub: {
        fontSize: 15,
        color: colors.textSecondary,
        marginTop: 4,
        fontWeight: '600',
    },
    refreshBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 40,
    },
    statBox: {
        width: '47.5%',
        backgroundColor: colors.cardGlass,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    statLabel: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 10,
    },
    statValue: {
        color: colors.text,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    statBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 12,
    },
    statBadgeText: {
        fontSize: 11,
        fontWeight: '800',
    },
    statAction: {
        color: colors.brand,
        fontSize: 13,
        marginTop: 12,
        fontWeight: '700',
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    actionsContainer: {
        gap: 16,
        marginBottom: 40,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardGlass,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    actionText: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    healthCard: {
        backgroundColor: colors.cardAlt,
        borderRadius: 20,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    healthText: {
        color: colors.textMuted,
        fontSize: 15,
        fontWeight: '600',
    }
});
