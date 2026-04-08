import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function PaymentScreen({ navigation }) {
  const { colors } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' or 'card'
  const [phoneNumber, setPhoneNumber] = useState('');

  const totalAmount = 13275.00;

  const handlePay = () => {
    // Navigate to tracking (payment successful)
    navigation?.navigate('BuyerTracking');
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Amount to Pay</Text>
          <Text style={styles.summaryValue}>GHS {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity 
          style={[styles.methodCard, paymentMethod === 'momo' && styles.methodCardActive]}
          activeOpacity={0.8}
          onPress={() => setPaymentMethod('momo')}
        >
          <View style={styles.methodHeader}>
            <View style={styles.methodLeft}>
              <View style={[styles.radioOuter, paymentMethod === 'momo' && styles.radioOuterActive]}>
                {paymentMethod === 'momo' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.methodTitle}>Mobile Money</Text>
            </View>
            <View style={styles.methodIcons}>
              <Text style={styles.networkBadgeMt}>MTN</Text>
              <Text style={styles.networkBadgeTl}>T-CEL</Text>
              <Text style={styles.networkBadgeAt}>AT</Text>
            </View>
          </View>
          
          {paymentMethod === 'momo' && (
            <View style={styles.methodForm}>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="MoMo Number (e.g. 055...)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActive]}
          activeOpacity={0.8}
          onPress={() => setPaymentMethod('card')}
        >
          <View style={styles.methodHeader}>
            <View style={styles.methodLeft}>
              <View style={[styles.radioOuter, paymentMethod === 'card' && styles.radioOuterActive]}>
                {paymentMethod === 'card' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.methodTitle}>Credit/Debit Card</Text>
            </View>
            <View style={styles.methodIconsCenter}>
              <Ionicons name="card" size={24} color={colors.textMuted} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Bottom */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.payButton, (paymentMethod === 'momo' && !phoneNumber) && styles.buttonDisabled]} 
            onPress={handlePay}
            disabled={paymentMethod === 'momo' && !phoneNumber}
            activeOpacity={0.8}
          >
            <Ionicons name="lock-closed" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.payButtonText}>
              Pay GHS {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})} Securely
            </Text>
          </TouchableOpacity>

          <View style={styles.poweredBy}>
            <Text style={styles.poweredText}>Powered by </Text>
            <Text style={styles.paystackLogo}>Paystack</Text>
          </View>
        </View>
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
  summaryCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 32,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 48,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  methodCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  methodCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandLight + '40',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.border,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.brand,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand,
  },
  methodTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  methodIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodIconsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkBadgeMt: { backgroundColor: '#FBBF24', color: colors.text, fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  networkBadgeTl: { backgroundColor: '#EF4444', color: '#fff', fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  networkBadgeAt: { backgroundColor: colors.text, color: colors.bg, fontSize: 10, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  methodForm: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 64,
  },
  inputIcon: {
    paddingLeft: 20,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
    paddingHorizontal: 20,
  },
  actionContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: colors.brand,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  poweredBy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  poweredText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  paystackLogo: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: -0.5,
  },
});
