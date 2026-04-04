import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, RefreshControl, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const STATUS_COLORS = {
  REQUESTED: '#64748B',  // Gray
  QUOTED: '#EAB308',     // Amber
  PAID: '#2B7DE9',       // Blue
  SHIPPED: '#4F46E5',    // Indigo
  DELIVERED: '#22C55E',  // Green
  DISPUTED: '#EF4444'    // Red
};

export default function DashboardScreen({ navigation }) {
  const { seller, logout } = useAuth();
  const [stats, setStats] = useState({
    wallet_balance: 0,
    active_orders: 0,
    total_orders: 0,
    incoming_funds: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await api.get('/transactions/stats');
      setStats(statsData);
      
      const ordersData = await api.get('/transactions');
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      console.error('Fetch dashboard error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#2B7DE9" />
        }
      >
        
        {/* Header Area */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#F1F5F9" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Hello, {seller?.full_name?.split(' ')[0] || 'Kwame'}</Text>
          <Text style={styles.greetingSubtext}>Here's your overview</Text>
        </View>

        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Wallet Balance */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>GHS {stats.wallet_balance.toFixed(2)}</Text>
          </View>
          
          {/* Active Orders */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Orders</Text>
            <Text style={[styles.statValue, { color: '#2B7DE9' }]}>{stats.active_orders}</Text>
          </View>
          
          {/* Incoming Funds */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Incoming Funds</Text>
            <Text style={[styles.statValue, { color: '#EAB308' }]}>GHS {stats.incoming_funds.toFixed(2)}</Text>
          </View>

          {/* Total Orders */}
          <View style={[styles.statCard, styles.trustCardRow]}>
            <View>
              <Text style={styles.statLabel}>Total Orders</Text>
              <Text style={[styles.statValue, { color: '#F1F5F9' }]}>{stats.total_orders}</Text>
            </View>
            <View style={styles.trustCircle}>
              <Ionicons name="stats-chart" size={16} color="#2B7DE9" />
            </View>
          </View>
        </View>

        {/* Recent Orders Section */}
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
            const statusColor = STATUS_COLORS[order.status] || '#64748B';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1b21',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#1a1b21',
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
  trustCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  trustCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2B7DE9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllText: {
    color: '#2B7DE9',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  orderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  orderProduct: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderBuyer: {
    color: '#64748B',
    fontSize: 14,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12131a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 8,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});
