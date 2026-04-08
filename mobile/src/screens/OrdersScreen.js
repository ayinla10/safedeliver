import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform, RefreshControl} from 'react-native';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

const getStatusColors = (colors) => ({
  REQUESTED: colors.textMuted,
  QUOTED: colors.warning,
  PAID: colors.brand,
  SHIPPED: '#4F46E5', // Indigo
  DELIVERED: colors.success,
  DISPUTED: colors.danger
});

export default function OrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabs = ['All', 'Pending Quote', 'Active', 'Completed', 'Cancelled'];

  useEffect(() => { fetchOrders(); }, []);

  const statusColors = useMemo(() => getStatusColors(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get('/transactions');
      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = activeTab === 'All' 
    ? orders 
    : activeTab === 'Pending Quote' ? orders.filter(o => o.status === 'REQUESTED')
    : activeTab === 'Active' ? orders.filter(o => ['PAID', 'SHIPPED', 'ACCEPTED', 'QUOTED'].includes(o.status))
    : activeTab === 'Completed' ? orders.filter(o => ['DELIVERED', 'RELEASED'].includes(o.status))
    : activeTab === 'Cancelled' ? orders.filter(o => o.status === 'CANCELLED')
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={colors.brand} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{loading ? 'Loading orders...' : 'No orders found'}</Text>
            <Text style={styles.emptySub}>{loading ? 'Fetching your data...' : 'You have no orders matching this filter.'}</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColor = statusColors[order.status] || colors.textMuted;
            return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => navigation?.navigate('OrderDetail', { orderId: order.order_ref })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.orderRef}>{order.order_ref}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <Text style={styles.productName} numberOfLines={1}>{order.product_name}</Text>
                  <Text style={styles.buyerName}>Buyer: {order.buyer_name}</Text>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.orderAmount}>GHS {(order.total_amount / 100).toFixed(2)}</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  filterWrapper: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipInactive: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  orderCard: {
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderRef: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardMid: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  buyerName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.brand,
    letterSpacing: -0.5,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    fontWeight: '500',
  },
});
