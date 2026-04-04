import React, { useState } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  REQUESTED: '#64748B',  // Gray
  QUOTED: '#EAB308',     // Amber
  PAID: '#2B7DE9',       // Blue
  SHIPPED: '#4F46E5',    // Indigo
  DELIVERED: '#22C55E'   // Green
};

const TIMELINE_STEPS = [
  { id: 'REQUESTED', label: 'Order Requested' },
  { id: 'QUOTED', label: 'Delivery Quoted' },
  { id: 'PAID', label: 'Payment Secured' },
  { id: 'SHIPPED', label: 'Order Shipped' },
  { id: 'DELIVERED', label: 'Delivered' }
];

export default function TrackingScreen({ navigation }) {
  // Mock order for buyer view
  const [order, setOrder] = useState({
    ref: 'SD-X9P4L1',
    productTitle: 'MacBook Pro M2 2023',
    sellerName: 'Kwame Tech Store',
    totalAmount: 13275.00,
    status: 'SHIPPED', // Try PAID, SHIPPED, DELIVERED
  });

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.id === order.status);
  const statusColor = STATUS_COLORS[order.status] || '#64748B';

  const handleConfirmDelivery = () => {
    // Release funds to seller
    setOrder({ ...order, status: 'DELIVERED' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color="#F1F5F9" />
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

              let nodeColor = '#34343a';
              if (isCompleted) nodeColor = '#22C55E';
              if (isActive) nodeColor = STATUS_COLORS[step.id];

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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 32,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderRef: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748B',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productName: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sellerName: {
    color: '#64748B',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#E3E1E9',
    fontSize: 15,
  },
  totalValue: {
    color: '#4F46E5', // Distinct blue for paid total
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  timelineContainer: {
    marginBottom: 40,
  },
  timelineWrapper: {
    paddingHorizontal: 8,
  },
  timelineStep: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineIconNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  nodeFuture: {
    borderColor: '#34343a',
  },
  nodeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: '#34343a',
    marginVertical: -8,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#22C55E',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 32,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  textCompleted: {
    color: '#F1F5F9',
  },
  textFuture: {
    color: '#64748B',
  },
  timelineDate: {
    fontSize: 12,
    color: '#64748B',
  },
  timelineSubtext: {
    fontSize: 13,
    color: '#E3E1E9',
    lineHeight: 18,
    marginTop: 8,
  },
  actionContainer: {
    marginTop: 8,
  },
  confirmBox: {
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    marginBottom: 16,
  },
  confirmNotice: {
    color: '#E3E1E9',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E', // Green
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#12131a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 16,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successDesc: {
    color: '#E3E1E9',
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
  },
});
