import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InterstitialScreen({ navigation, route }) {
  // Store params if any to pass along if they continue in app
  const { linkCode } = route?.params || {};

  const handleDownloadApp = () => {
    // Open Play Store or App Store
    console.log('Redirecting to stores...');
  };

  const handleContinueInApp = () => {
    navigation?.navigate('BuyerCheckout', { linkCode });
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Region */}
        <View style={styles.header}>
          <View style={styles.shieldWrapper}>
             <Ionicons name="shield-checkmark" size={48} color="#2B7DE9" />
          </View>
          <Text style={styles.title}>Get the SafeDeliver App</Text>
          <Text style={styles.subtitle}>For the safest and fastest checkout experience in Ghana.</Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="shield-half" size={24} color="#22C55E" />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Buyer Protection</Text>
              <Text style={styles.benefitDesc}>Your money is held in escrow until you receive your item.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(43, 125, 233, 0.1)' }]}>
              <Ionicons name="notifications" size={24} color="#2B7DE9" />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Real-time Tracking</Text>
              <Text style={styles.benefitDesc}>Get instant notifications when your order ships.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}>
              <Ionicons name="flash" size={24} color="#4F46E5" />
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>Faster Checkout</Text>
              <Text style={styles.benefitDesc}>Save your address and details for 1-tap ordering.</Text>
            </View>
          </View>

          <View style={styles.benefitCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Ionicons name="star" size={24} color="#EAB308" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shieldWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 48,
    gap: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitDesc: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 'auto',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2B7DE9',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2B7DE9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
});
