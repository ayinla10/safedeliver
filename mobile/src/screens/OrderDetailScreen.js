import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, TextInput, ActivityIndicator, StatusBar as RNStatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

const STATUS_COLORS = {
  REQUESTED: '#64748B',  // Gray
  QUOTED: '#EAB308',     // Amber
  ACCEPTED: '#EAB308',   // Amber (waiting payment)
  PAID: '#2B7DE9',       // Blue
  SHIPPED: '#4F46E5',    // Indigo
  DELIVERED: '#22C55E',  // Green
  RELEASED: '#22C55E',   // Green
  DISPUTED: '#EF4444'    // Red
};

const TIMELINE_STEPS = [
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'QUOTED', label: 'Quoted' },
  { id: 'PAID', label: 'Paid' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'RELEASED', label: 'Released' }
];

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route?.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteInput, setQuoteInput] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await api.get(`/transactions/track-order/${orderId}`);
      setOrder(data);
    } catch (err) {
      console.error('Fetch order detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = async () => {
    if (!quoteInput || actionLoading) return;
    setActionLoading(true);
    try {
      const fee = parseFloat(quoteInput);
      await api.patch(`/transactions/${order.id}/quote`, { delivery_fee: fee });
      await fetchOrder();
      setIsQuoting(false);
    } catch (err) {
      alert(err.message || 'Failed to send quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipOrder = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.patch(`/transactions/${order.id}/ship`);
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to mark as shipped');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B7DE9" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAlt}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || '#64748B';
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.id === order.status);
  const isPaid = ['PAID', 'SHIPPED', 'DELIVERED', 'RELEASED'].includes(order.status);
  const maskedPhone = isPaid ? order.buyer_phone : `${order.buyer_phone.substring(0, 3)}****${order.buyer_phone.substring(7)}`;
  const maskedAddress = isPaid ? order.buyer_address : 'Hidden until Paid';

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.order_ref}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.statusContainer}>
          <View style={[styles.largeBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
            <View style={[styles.statusDotLg, { backgroundColor: statusColor }]} />
            <Text style={[styles.largeBadgeText, { color: statusColor }]}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product</Text>
            <Text style={styles.infoValue}>{order.product_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyer</Text>
            <Text style={styles.infoValue}>{order.buyer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{maskedPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', paddingLeft: 16 }]} numberOfLines={2}>
              {maskedAddress}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product Price</Text>
            <Text style={styles.infoValue}>GHS {(order.product_price / 100 || order.total_amount / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Fee</Text>
            <Text style={styles.infoValue}>
              {order.delivery_fee > 0 ? `GHS ${(order.delivery_fee / 100).toFixed(2)}` : 'Pending Quote'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform Fee</Text>
            <Text style={styles.infoValue}>GHS {(order.platform_fee / 100).toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>GHS {(order.total_amount / 100).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex || (index === currentStepIndex && step.id === 'RELEASED');
            const isActive = index === currentStepIndex && step.id !== 'RELEASED';
            const isFuture = index > currentStepIndex;

            return (
              <View key={step.id} style={styles.timelineStep}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineIconNode,
                    isCompleted && styles.nodeCompleted,
                    isActive && styles.nodeActive,
                    isFuture && styles.nodeFuture
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#0a0b10" />
                    ) : (
                      <View style={[styles.nodeInner, isActive && styles.nodeInnerActive]} />
                    )}
                  </View>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, isCompleted && styles.lineCompleted]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineText,
                    isCompleted && styles.textCompleted,
                    isActive && styles.textActive,
                    isFuture && styles.textFuture
                  ]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actionContainer}>
          {order.status === 'REQUESTED' && (
            isQuoting ? (
              <View style={styles.quoteForm}>
                <TextInput 
                  style={styles.quoteInput} 
                  placeholder="Enter Delivery Fee (GHS)"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={quoteInput}
                  onChangeText={setQuoteInput}
                  autoFocus
                />
                <TouchableOpacity 
                  style={[styles.submitBtn, actionLoading && {opacity: 0.7}]} 
                  onPress={handleQuoteSubmit}
                  disabled={actionLoading}
                >
                  <Text style={styles.submitBtnText}>{actionLoading ? '...' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setIsQuoting(true)}>
                <Text style={styles.primaryButtonText}>Quote Delivery Fee</Text>
              </TouchableOpacity>
            )
          )}

          {order.status === 'QUOTED' && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageText}>Waiting for buyer to accept quote.</Text>
            </View>
          )}

          {order.status === 'ACCEPTED' && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageText}>Waiting for buyer to complete payment.</Text>
            </View>
          )}

          {order.status === 'PAID' && (
            <TouchableOpacity 
              style={[styles.primaryButton, actionLoading && {opacity: 0.7}]} 
              onPress={handleShipOrder}
              disabled={actionLoading}
            >
              <Text style={styles.primaryButtonText}>{actionLoading ? 'Updating...' : 'Mark as Shipped'}</Text>
            </TouchableOpacity>
          )}

          {order.status === 'SHIPPED' && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageText}>Order shipped. Waiting for buyer confirmation.</Text>
            </View>
          )}

          {['DELIVERED', 'RELEASED'].includes(order.status) && (
            <View style={styles.statusMessageContainer}>
              <Text style={styles.statusMessageTextCompleted}>Order Completed. Funds released to your wallet.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ffffff', fontSize: 18, marginBottom: 16 },
  backLink: { color: '#2B7DE9', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  statusContainer: { alignItems: 'center', marginVertical: 24 },
  largeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusDotLg: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  largeBadgeText: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  card: { backgroundColor: '#12131a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 32 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { color: '#64748B', fontSize: 14 },
  infoValue: { color: '#F1F5F9', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: 12 },
  totalLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  totalValue: { color: '#2B7DE9', fontSize: 20, fontWeight: '800' },
  timelineContainer: { paddingHorizontal: 16, marginBottom: 40 },
  timelineStep: { flexDirection: 'row' },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineIconNode: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  nodeCompleted: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  nodeActive: { backgroundColor: '#0a0b10', borderColor: '#2B7DE9' },
  nodeFuture: { backgroundColor: '#0a0b10', borderColor: '#34343a' },
  nodeInner: { width: 8, height: 8, borderRadius: 4 },
  nodeInnerActive: { backgroundColor: '#2B7DE9' },
  timelineLine: { width: 2, height: 48, backgroundColor: '#34343a', marginVertical: -8, zIndex: 1 },
  lineCompleted: { backgroundColor: '#22C55E' },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 32, paddingTop: 2 },
  timelineText: { fontSize: 16, fontWeight: '600' },
  textCompleted: { color: '#F1F5F9' },
  textActive: { color: '#2B7DE9' },
  textFuture: { color: '#64748B' },
  actionContainer: { marginTop: 8 },
  primaryButton: { backgroundColor: '#2B7DE9', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  quoteForm: { flexDirection: 'row', gap: 12 },
  quoteInput: { flex: 1, height: 56, backgroundColor: '#12131a', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 16, color: '#F1F5F9', fontSize: 16 },
  submitBtn: { backgroundColor: '#2B7DE9', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  submitBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  statusMessageContainer: { alignItems: 'center', padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  statusMessageText: { color: '#E3E1E9', fontSize: 14, fontWeight: '500' },
  statusMessageTextCompleted: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
});
