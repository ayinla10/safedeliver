import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, StatusBar as RNStatusBar, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerCheckoutScreen({ navigation, route }) {
  // Mock product data from linkCode
  const product = {
    title: 'MacBook Pro M2 2023',
    price: 12500.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    sellerName: 'Kwame Tech Store',
    sellerAvatar: 'K',
    sellerTrust: 92,
    sellerTier: 'Tier 2 — Verified',
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const isFormValid = firstName && lastName && phone && address;

  const handleSubmit = () => {
    // Navigate to waiting screen
    navigation?.navigate('BuyerWaiting');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Ionicons name="shield-checkmark" size={20} color="#2B7DE9" style={{ width: 40, textAlign: 'center' }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Seller Card */}
          <View style={styles.sellerCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{product.sellerAvatar}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.sellerName}</Text>
              <View style={styles.sellerBadges}>
                <View style={styles.trustBadge}>
                  <Ionicons name="star" size={12} color="#EAB308" />
                  <Text style={styles.trustText}>{product.sellerTrust}</Text>
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{product.sellerTier}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Product Summary */}
          <View style={styles.productCard}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
              <Text style={styles.productPrice}>GHS {product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            </View>
          </View>

          {/* Delivery Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>

            <View style={styles.rowInputs}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#64748B"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#64748B"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={[styles.inputWrapper, styles.marginTop16]}>
              <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g. 055...)"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={[styles.inputWrapper, styles.textAreaWrapper, styles.marginTop16]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full Delivery Address & Landmark"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Guarantee Info */}
          <View style={styles.guaranteeCard}>
            <View style={styles.guaranteeHeader}>
              <Ionicons name="shield-half" size={20} color="#22C55E" />
              <Text style={styles.guaranteeTitle}>SafeDeliver Guarantee</Text>
            </View>
            <Text style={styles.guaranteeDesc}>
              Your money is held in a secure escrow account and is only released to the seller after you confirm delivery.
            </Text>
          </View>

        </ScrollView>

        {/* Floating Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalValue}>GHS {product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
              <Text style={styles.pendingQuoteText}>+ Delivery Quote Pending</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.submitBtn, !isFormValid && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={styles.submitBtnText}>Submit for Delivery Quote</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(43, 125, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#2B7DE9',
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sellerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  trustText: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: '700',
  },
  tierBadge: {
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    color: '#2B7DE9',
    fontSize: 12,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#12131a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 32,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  productTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  marginTop16: {
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    height: 56,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 15,
    height: '100%',
    paddingHorizontal: 16,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  textArea: {
    height: '100%',
  },
  guaranteeCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    marginBottom: 8,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  guaranteeTitle: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '700',
  },
  guaranteeDesc: {
    color: '#E3E1E9',
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    backgroundColor: '#12131a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#64748B',
    fontSize: 15,
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  pendingQuoteText: {
    color: '#2B7DE9',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#2B7DE9',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
