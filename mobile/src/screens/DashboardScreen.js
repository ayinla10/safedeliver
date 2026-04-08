import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, RefreshControl, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

const getStatusColors = (colors) => ({
  REQUESTED: colors.textMuted,
  QUOTED: colors.warning,
  PAID: colors.brand,
  SHIPPED: colors.brand, // Use brand for shipped
  DELIVERED: colors.success,
  DISPUTED: colors.danger
});

export default function DashboardScreen({ navigation }) {
  const { seller } = useAuth();
  const { colors } = useTheme();
  const [stats, setStats] = useState({ wallet_balance: 0, active_orders: 0, total_orders: 0, incoming_funds: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const statusColors = useMemo(() => getStatusColors(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await api.get('/transactions/stats');
      setStats(statsData);
      const response = await api.get('/transactions');
      const ordersArray = Array.isArray(response) ? response : (response.transactions || []);
      setRecentOrders(ordersArray.slice(0, 5));
    } catch (err) {
      console.error('Fetch dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.brand} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Hello, {seller?.full_name?.split(' ')[0] || 'Kwame'}</Text>
          <Text style={styles.greetingSubtext}>Here's your overview</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={styles.statValueBalance}>GHS {stats.wallet_balance.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Orders</Text>
            <Text style={styles.statValueActive}>{stats.active_orders}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Incoming Funds</Text>
            <Text style={styles.statValueIncoming}>GHS {stats.incoming_funds.toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, styles.trustCardRow]}>
            <View>
              <Text style={styles.statLabel}>Total Orders</Text>
              <Text style={styles.statValueNormal}>{stats.total_orders}</Text>
            </View>
            <View style={styles.trustCircle}>
              <Ionicons name="stats-chart" size={16} color={colors.brand} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('OrdersTab')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          recentOrders.map((order, index) => {
            const statusColor = statusColors[order.status] || colors.textMuted;
            return (
              <TouchableOpacity 
                key={order.id} 
                style={[styles.orderCard, index === 0 && { marginTop: 8 }]}
                activeOpacity={0.7}
                onPress={() => navigation?.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId: order.order_ref } })}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderProduct} numberOfLines={1}>{order.product_name}</Text>
                  <Text style={styles.orderBuyer}>{order.buyer_name}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>GHS {(order.total_amount / 100).toFixed(2)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.cardAlt,
  },
  greetingSection: {
    marginBottom: 36,
  },
  greetingText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -1,
  },
  greetingSubtext: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 44,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  trustCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  statValueBalance: { fontSize: 22, fontWeight: '900', color: colors.success, letterSpacing: -0.5 },
  statValueActive: { fontSize: 26, fontWeight: '900', color: colors.brand, letterSpacing: -0.5 },
  statValueIncoming: { fontSize: 22, fontWeight: '900', color: colors.warning, letterSpacing: -0.5 },
  statValueNormal: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  trustCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.brand,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand,
  },
  orderCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.cardGlass,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4,
  },
  orderLeft: { flex: 1, paddingRight: 16 },
  orderProduct: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6, letterSpacing: -0.2 },
  orderBuyer: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 10, letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  emptyState: { 
    paddingVertical: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    marginTop: 8 
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
});
