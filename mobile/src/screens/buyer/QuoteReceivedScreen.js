import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuoteReceivedScreen({ navigation }) {
  // Mock data representing the quote
  const mockQuote = {
    productPrice: 12500.00,
    deliveryFee: 150.00,
    platformFee: 625.00,
    total: 13275.00,
    expiresAt: '2 hours',
  };

  const handleProceed = () => {
    // Navigate to payment screen
    navigation?.navigate('BuyerPayment');
  };

  const handleCancel = () => {
    // Cancel the quote
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Quote Received</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="notifications-outline" size={20} color="#F1F5F9" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={20} color="#22C55E" />
          </View>
          <Text style={styles.successText}>
            The seller has provided a delivery fee for your location.
          </Text>
        </View>

        {/* Cost Breakdown Card */}
        <View style={styles.costCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Product Price</Text>
            <Text style={styles.costValue}>GHS {mockQuote.productPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={styles.costValueHighlight}>GHS {mockQuote.deliveryFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>

          <View style={styles.costRow}>
            <View style={styles.feeLabelRow}>
              <Text style={styles.costLabel}>Platform Fee</Text>
              <View style={styles.feeInfoBadge}>
                <Text style={styles.feeInfoText}>5%</Text>
              </View>
            </View>
            <Text style={styles.costValue}>GHS {mockQuote.platformFee.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>GHS {mockQuote.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
        </View>

        {/* Expiration Alert */}
        <View style={styles.alertCard}>
          <Ionicons name="time-outline" size={24} color="#EAB308" style={styles.alertIcon} />
          <View style={styles.alertTextWrapper}>
            <Text style={styles.alertTitle}>Quote Expires Soon</Text>
            <Text style={styles.alertDesc}>
              You have <Text style={{ fontWeight: '700', color: '#EAB308' }}>{mockQuote.expiresAt}</Text> to accept this quote before it expires.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
            <Text style={styles.secondaryButtonText}>Cancel Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleProceed} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.secureText}>
          <Ionicons name="lock-closed" size={12} color="#64748B" /> Payments are 100% secure with Paystack.
        </Text>

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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successText: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 22,
  },
  costCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  costLabel: {
    color: '#64748B',
    fontSize: 15,
  },
  costValue: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '500',
  },
  costValueHighlight: {
    color: '#2B7DE9',
    fontSize: 15,
    fontWeight: '700',
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feeInfoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feeInfoText: {
    color: '#E3E1E9',
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#2B7DE9',
    fontSize: 24,
    fontWeight: '800',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    marginBottom: 40,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    color: '#EAB308',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertDesc: {
    color: '#E3E1E9',
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
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
  primaryButton: {
    flex: 1.5,
    backgroundColor: '#2B7DE9',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2B7DE9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secureText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
  },
});
