import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, TextInput, ActivityIndicator, StatusBar as RNStatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

const STATUS_COLORS = (colors) => ({
  REQUESTED: colors.textMuted,
  QUOTED: colors.warning,
  ACCEPTED: colors.warning,
  PAID: colors.brand,
  SHIPPED: colors.brand, // Or another highlight
  DELIVERED: colors.success,
  RELEASED: colors.success,
  DISPUTED: colors.danger
});

const TIMELINE_STEPS = [
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'QUOTED', label: 'Quoted' },
  { id: 'PAID', label: 'Paid' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'RELEASED', label: 'Released' }
];

export default function OrderDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Order not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnAlt}>
            <Text style={[styles.backLink, { color: colors.brand }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = useMemo(() => STATUS_COLORS(colors), [colors]);
  const statusColor = statusColors[order.status] || colors.textMuted;
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.id === order.status);
  const isPaid = ['PAID', 'SHIPPED', 'DELIVERED', 'RELEASED'].includes(order.status);
  const maskedPhone = isPaid ? order.buyer_phone : `${order.buyer_phone.substring(0, 3)}****${order.buyer_phone.substring(7)}`;
  const maskedAddress = isPaid ? order.buyer_address : 'Hidden until Paid';

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
          {order.product_image_url && (
            <TouchableOpacity style={styles.imagePreviewContainer} onPress={() => {/* Modal logic */}}>
              <Image source={{ uri: order.product_image_url }} style={styles.productImage} />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={20} color={colors.white} />
                <Text style={styles.previewText}>Tap to preview</Text>
              </View>
            </TouchableOpacity>
          )}

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
                      <Ionicons name="checkmark" size={14} color={colors.bg} />
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
                  placeholderTextColor={colors.textMuted}
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

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg,
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: colors.text, fontSize: 18, marginBottom: 16, fontWeight: '700' },
  backLink: { color: colors.brand, fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.buttonGhost },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  statusContainer: { alignItems: 'center', marginVertical: 24 },
  largeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  statusDotLg: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  largeBadgeText: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  card: { 
    backgroundColor: colors.cardGlass, borderRadius: 24, padding: 24, 
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: 32,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 6,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  imagePreviewContainer: { width: '100%', height: 220, borderRadius: 20, overflow: 'hidden', marginBottom: 24, backgroundColor: colors.cardAlt, position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.overlay, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  previewText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  totalValue: { color: colors.brand, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  timelineContainer: { paddingHorizontal: 16, marginBottom: 40 },
  timelineStep: { flexDirection: 'row' },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineIconNode: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  nodeCompleted: { backgroundColor: colors.success, borderColor: colors.success },
  nodeActive: { backgroundColor: colors.bg, borderColor: colors.brand },
  nodeFuture: { backgroundColor: colors.bg, borderColor: colors.border },
  nodeInner: { width: 10, height: 10, borderRadius: 5 },
  nodeInnerActive: { backgroundColor: colors.brand },
  timelineLine: { width: 2, height: 50, backgroundColor: colors.border, marginVertical: -8, zIndex: 1 },
  lineCompleted: { backgroundColor: colors.success },
  timelineContent: { flex: 1, paddingLeft: 16, paddingBottom: 36, paddingTop: 4 },
  timelineText: { fontSize: 16, fontWeight: '700' },
  textCompleted: { color: colors.text },
  textActive: { color: colors.brand },
  textFuture: { color: colors.textMuted },
  actionContainer: { marginTop: 8 },
  primaryButton: { 
    backgroundColor: colors.brand, paddingVertical: 20, borderRadius: 20, alignItems: 'center',
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  quoteForm: { flexDirection: 'row', gap: 12 },
  quoteInput: { 
    flex: 1, height: 60, backgroundColor: colors.inputBg, borderRadius: 16, 
    borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 20, 
    color: colors.text, fontSize: 16, fontWeight: '600' 
  },
  submitBtn: { backgroundColor: colors.brand, borderRadius: 16, justifyContent: 'center', paddingHorizontal: 24 },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  statusMessageContainer: { 
    alignItems: 'center', padding: 20, backgroundColor: colors.brandBg, 
    borderRadius: 20, borderWidth: 1, borderColor: colors.brandBorder 
  },
  statusMessageText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  statusMessageTextCompleted: { color: colors.success, fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
