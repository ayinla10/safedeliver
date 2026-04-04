import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform, RefreshControl} from 'react-native';
import { api } from '../api';

const STATUS_COLORS = {
  REQUESTED: '#64748B',  // Gray
  QUOTED: '#EAB308',     // Amber
  PAID: '#2B7DE9',       // Blue
  SHIPPED: '#4F46E5',    // Indigo
  DELIVERED: '#22C55E',  // Green
  DISPUTED: '#EF4444'    // Red
};

export default function OrdersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabs = ['All', 'Pending Quote', 'Active', 'Completed', 'Cancelled'];

  useEffect(() => {
    fetchOrders();
  }, []);

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
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
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

      {/* Orders List */}
      <ScrollView 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#2B7DE9" />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{loading ? 'Loading orders...' : 'No orders found'}</Text>
            <Text style={styles.emptySub}>{loading ? 'Fetching your data...' : 'You have no orders matching this filter.'}</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || '#64748B';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#2B7DE9',
    borderColor: '#2B7DE9',
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  chipTextInactive: {
    color: '#E3E1E9',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderRef: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748B',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardMid: {
    marginBottom: 16,
  },
  productName: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buyerName: {
    color: '#64748B',
    fontSize: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  orderDate: {
    color: '#64748B',
    fontSize: 12,
  },
  orderAmount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 14,
  },
});
