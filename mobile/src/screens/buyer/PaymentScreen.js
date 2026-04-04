import React, { useState } from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen({ navigation }) {
  const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' or 'card'
  const [phoneNumber, setPhoneNumber] = useState('');

  const totalAmount = 13275.00;

  const handlePay = () => {
    // Navigate to tracking (payment successful)
    navigation?.navigate('BuyerTracking');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={{ width: 40 }} />
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
                <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="MoMo Number (e.g. 055...)"
                  placeholderTextColor="#64748B"
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
              <Ionicons name="card" size={24} color="#64748B" />
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
  summaryCard: {
    backgroundColor: 'rgba(43, 125, 233, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.2)',
    marginBottom: 32,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 15,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#2B7DE9',
    fontSize: 32,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  methodCardActive: {
    borderColor: '#2B7DE9',
    backgroundColor: 'rgba(43, 125, 233, 0.03)',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#2B7DE9',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2B7DE9',
  },
  methodTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  methodIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  methodIconsCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkBadgeMt: { backgroundColor: '#FBBF24', color: '#000', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  networkBadgeTl: { backgroundColor: '#EF4444', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  networkBadgeAt: { backgroundColor: '#000000', color: '#fff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#333' },
  methodForm: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0b10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 16,
    height: '100%',
  },
  actionContainer: {
    marginTop: 40,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#2B7DE9',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B7DE9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  poweredBy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  poweredText: {
    color: '#64748B',
    fontSize: 13,
  },
  paystackLogo: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.5,
  },
});
