import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

const getStatusColors = (colors) => ({
  REQUESTED: colors.textMuted,
  QUOTED: colors.warning,
  PAID: colors.brand,
  SHIPPED: '#4F46E5', // Indigo (Keep for brand)
  DELIVERED: colors.success
});

const TIMELINE_STEPS = [
  { id: 'REQUESTED', label: 'Order Requested' },
  { id: 'QUOTED', label: 'Delivery Quoted' },
  { id: 'PAID', label: 'Payment Secured' },
  { id: 'SHIPPED', label: 'Order Shipped' },
  { id: 'DELIVERED', label: 'Delivered' }
];

export default function TrackingScreen({ navigation }) {
  const { colors } = useTheme();
  // Mock order for buyer view
  const [order, setOrder] = useState({
    ref: 'SD-X9P4L1',
    productTitle: 'MacBook Pro M2 2023',
    sellerName: 'Kwame Tech Store',
    totalAmount: 13275.00,
    status: 'SHIPPED', // Try PAID, SHIPPED, DELIVERED
  });

  const statusColors = useMemo(() => getStatusColors(colors), [colors]);
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.id === order.status);
  const statusColor = statusColors[order.status] || colors.textMuted;
  const styles = useMemo(() => createStyles(colors, statusColors), [colors, statusColors]);

  const handleConfirmDelivery = () => {
    // Release funds to seller
    setOrder({ ...order, status: 'DELIVERED' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Order Info Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.orderRef}>{order.ref}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
            </View>
          </View>
          
          <Text style={styles.productName} numberOfLines={2}>{order.productTitle}</Text>
          <Text style={styles.sellerName}>Sold by: {order.sellerName}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>GHS {order.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
        </View>

        {/* Tracking Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Tracking Status</Text>
          
          <View style={styles.timelineWrapper}>
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex || (index === currentStepIndex && step.id === 'DELIVERED');
              const isActive = index === currentStepIndex && step.id !== 'DELIVERED';
              const isFuture = index > currentStepIndex;

              let nodeColor = colors.border;
              if (isCompleted) nodeColor = colors.success;
              if (isActive) nodeColor = statusColors[step.id];

              return (
                <View key={step.id} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIconNode,
                      isCompleted && styles.nodeCompleted,
                      isActive && { borderColor: nodeColor },
                      isFuture && styles.nodeFuture
                    ]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#0a0b10" />
                      ) : (
                        <View style={[styles.nodeInner, isActive && { backgroundColor: nodeColor }]} />
                      )}
                    </View>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isCompleted && styles.lineCompleted]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineTitle,
                      isCompleted && styles.textCompleted,
                      isActive && { color: nodeColor },
                      isFuture && styles.textFuture
                    ]}>
                      {step.label}
                    </Text>
                    {isCompleted && <Text style={styles.timelineDate}>29 Mar, 10:30 AM</Text>}
                    {isActive && step.id === 'SHIPPED' && (
                      <Text style={styles.timelineSubtext}>Your item is on the way. Confirm delivery once you receive it.</Text>
                    )}
                    {isActive && step.id === 'PAID' && (
                      <Text style={styles.timelineSubtext}>Waiting for the seller to ship your item.</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Dynamic Action Buttons */}
        <View style={styles.actionContainer}>
          {order.status === 'SHIPPED' && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmNotice}>
                <Ionicons name="information-circle-outline" size={14} /> Only click confirm when you have physically received and verified the item.
              </Text>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmDelivery} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>Confirm Delivery & Release Funds</Text>
              </TouchableOpacity>
            </View>
          )}

          {order.status === 'DELIVERED' && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={32} color="#22C55E" style={{ marginBottom: 12 }} />
              <Text style={styles.successTitle}>Order Completed!</Text>
              <Text style={styles.successDesc}>Funds have been securely released to the seller.</Text>
            </View>
          )}

          {['PAID', 'SHIPPED'].includes(order.status) && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Contact Seller Support</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors, statusColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.buttonGhost,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 36,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderRef: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sellerName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.brand,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  timelineContainer: {
    marginBottom: 44,
  },
  timelineWrapper: {
    paddingHorizontal: 4,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 36,
    alignItems: 'center',
  },
  timelineIconNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: colors.bg,
  },
  nodeCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  nodeFuture: {
    borderColor: colors.border,
  },
  nodeInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  timelineLine: {
    width: 2,
    height: 70,
    backgroundColor: colors.border,
    marginVertical: -6,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  textCompleted: {
    color: colors.text,
  },
  textFuture: {
    color: colors.textMuted,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  timelineSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 8,
  },
  confirmBox: {
    padding: 24,
    backgroundColor: colors.success + '08',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.success + '30',
    marginBottom: 20,
  },
  confirmNotice: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  successBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.success + '40',
    marginBottom: 20,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  successDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  secondaryButton: {
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
});
