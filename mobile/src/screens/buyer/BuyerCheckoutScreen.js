import React, { useState, useMemo } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, StatusBar as RNStatusBar, Image} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function BuyerCheckoutScreen({ navigation, route }) {
  const { colors } = useTheme();
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

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Ionicons name="shield-checkmark" size={24} color={colors.brand} style={{ width: 44, textAlign: 'right' }} />
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
                  <Ionicons name="star" size={12} color={colors.warning} />
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
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={[styles.inputWrapper, styles.marginTop16]}>
              <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g. 055...)"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={[styles.inputWrapper, styles.textAreaWrapper, styles.marginTop16]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full Delivery Address & Landmark"
                placeholderTextColor={colors.textMuted}
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
              <Ionicons name="shield-half" size={20} color={colors.success} />
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
    paddingBottom: 140, 
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 24,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  avatarText: {
    color: colors.brand,
    fontSize: 22,
    fontWeight: '800',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sellerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  trustText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
  },
  tierBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 40,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    margin: 10,
    resizeMode: 'cover',
  },
  productDetails: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 20,
    justifyContent: 'center',
  },
  productTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  formSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
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
  textAreaWrapper: {
    height: 140,
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  textArea: {
    height: '100%',
  },
  guaranteeCard: {
    backgroundColor: colors.success + '08',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.success + '15',
    marginBottom: 40,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  guaranteeTitle: {
    color: colors.success,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  guaranteeDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: colors.cardGlass,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 15,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  pendingQuoteText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  submitBtn: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
