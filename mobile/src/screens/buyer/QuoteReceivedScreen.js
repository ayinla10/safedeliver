import React, { useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function QuoteReceivedScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Quote</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={20} color={colors.success} />
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
          <Ionicons name="time-outline" size={24} color={colors.warning} style={styles.alertIcon} />
          <View style={styles.alertTextWrapper}>
            <Text style={styles.alertTitle}>Quote Expires Soon</Text>
            <Text style={styles.alertDesc}>
              You have <Text style={{ fontWeight: '800', color: colors.warning }}>{mockQuote.expiresAt}</Text> to accept this quote before it expires.
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
          <Ionicons name="lock-closed" size={12} color={colors.textMuted} /> Payments are 100% secure with Paystack.
        </Text>

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
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.success + '20',
    marginBottom: 32,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  successText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  costCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 32,
    padding: 28,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    marginBottom: 32,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  costLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  costValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  costValueHighlight: {
    color: colors.brand,
    fontSize: 17,
    fontWeight: '900',
  },
  feeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feeInfoBadge: {
    backgroundColor: colors.brandLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  feeInfoText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.border,
    marginVertical: 12,
    marginBottom: 28,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: colors.brand,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '08',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.warning + '20',
    marginBottom: 48,
  },
  alertIcon: {
    marginRight: 16,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  alertDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  secondaryButton: {
    flex: 1,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1.6,
    backgroundColor: colors.brand,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  secureText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 40,
  },
});
