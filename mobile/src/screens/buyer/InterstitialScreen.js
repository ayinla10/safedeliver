import React, { useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function InterstitialScreen({ navigation, route }) {
  const { colors } = useTheme();
  // Store params if any to pass along if they continue in app
  const { linkCode } = route?.params || {};

  const handleDownloadApp = () => {
    // Open Play Store or App Store
    console.log('Redirecting to stores...');
  };

  const handleContinueInApp = () => {
    navigation?.navigate('BuyerCheckout', { linkCode });
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Region */}
        <View style={styles.header}>
          <View style={styles.shieldWrapper}>
             <Ionicons name="shield-checkmark" size={48} color={colors.brand} />
          </View>
          <Text style={styles.title}>Get the SafeDeliver App</Text>
          <Text style={styles.subtitle}>For the safest and fastest checkout experience in Ghana.</Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="shield-half" size={24} color={colors.success} />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Buyer Protection</Text>
              <Text style={styles.benefitDesc}>Your money is held in escrow until you receive your item.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.brand + '15' }]}>
              <Ionicons name="notifications" size={24} color={colors.brand} />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Real-time Tracking</Text>
              <Text style={styles.benefitDesc}>Get instant notifications when your order ships.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.brand + '15' }]}>
              <Ionicons name="flash" size={24} color={colors.brand} />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Faster Checkout</Text>
              <Text style={styles.benefitDesc}>Save your address and details for 1-tap ordering.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="star" size={24} color={colors.warning} />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Build Trust</Text>
              <Text style={styles.benefitDesc}>Rate sellers and read authenticated reviews from buyers.</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={handleDownloadApp}
          >
            <Ionicons name="logo-google-playstore" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Ionicons name="logo-apple" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Download SafeDeliver App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handleContinueInApp}>
            <Text style={styles.secondaryActionText}>Continue in browser instead &rarr;</Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  shieldWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    marginBottom: 56,
    gap: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  benefitDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.brand,
    paddingVertical: 22,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
});
