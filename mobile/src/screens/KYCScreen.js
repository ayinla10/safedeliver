import React, { useState } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function KYCScreen() {
  // Mock KYC state: 'Tier 1' (Ready to upgrade), 'PENDING' (under review), 'REJECTED' (failed)
  const [kycState, setKycState] = useState('Tier 1');

  const handleApply = () => {
    setKycState('PENDING');
  };

  const handleResubmit = () => {
    setKycState('Tier 1');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tier Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack} />
          
          {/* Tier 1 - Completed */}
          <View style={styles.tierNodeWrapper}>
            <View style={[styles.tierNode, styles.nodeCompletedAmber]}>
              <Ionicons name="checkmark" size={14} color="#0a0b10" />
            </View>
            <Text style={styles.tierNameActive}>Tier 1</Text>
          </View>

          {/* Tier 2 - Current/Pending */}
          <View style={styles.tierNodeWrapper}>
            <View style={[styles.tierNode, styles.nodeCurrent]}>
              <View style={styles.nodeInnerBlue} />
            </View>
            <Text style={styles.tierNameActive}>Tier 2</Text>
          </View>

          {/* Tier 3 - Future */}
          <View style={styles.tierNodeWrapper}>
            <View style={[styles.tierNode, styles.nodeFuture]}>
              <View style={styles.nodeInnerGray} />
            </View>
            <Text style={styles.tierNameGray}>Tier 3</Text>
          </View>
        </View>

        {/* Current Status */}
        <View style={styles.statusSection}>
          <Text style={styles.statusText}>
            Your Current Tier: <Text style={{ color: '#EAB308' }}>1 (Basic)</Text>
          </Text>
        </View>

        {/* Limits Card */}
        <View style={styles.limitsCard}>
          <View style={styles.limitRow}>
            <View style={styles.limitIconWrapper}>
              <Ionicons name="cash-outline" size={20} color="#F1F5F9" />
            </View>
            <View>
              <Text style={styles.limitLabel}>Max Transaction</Text>
              <Text style={styles.limitValue}>GHS 1,000</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.limitRow}>
            <View style={styles.limitIconWrapper}>
              <Ionicons name="wallet-outline" size={20} color="#F1F5F9" />
            </View>
            <View>
              <Text style={styles.limitLabel}>Weekly Withdrawal</Text>
              <Text style={styles.limitValue}>GHS 5,000</Text>
            </View>
          </View>
        </View>

        {/* Conditional Upgrade State */}
        {kycState === 'Tier 1' && (
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <Ionicons name="arrow-up-circle" size={24} color="#2B7DE9" />
              <Text style={styles.upgradeTitle}>Upgrade to Tier 2 — Verified</Text>
            </View>
            <Text style={styles.upgradeDesc}>
              Increase your maximum transaction limit to GHS 10,000 and your weekly withdrawal limit to GHS 50,000 by verifying your identity.
            </Text>

            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                <Ionicons name="id-card-outline" size={24} color="#64748B" style={styles.uploadIcon} />
                <Text style={styles.uploadBoxText}>Government ID</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={24} color="#64748B" style={styles.uploadIcon} />
                <Text style={styles.uploadBoxText}>Selfie with ID</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleApply}>
              <Text style={styles.primaryButtonText}>Apply for Tier 2</Text>
            </TouchableOpacity>
          </View>
        )}

        {kycState === 'PENDING' && (
          <View style={styles.pendingCard}>
            <Ionicons name="hourglass-outline" size={48} color="#2B7DE9" style={styles.statusIcon} />
            <Text style={styles.pendingTitle}>Application under review</Text>
            <Text style={styles.pendingDesc}>
              We are currently reviewing your documents. This usually takes 1-2 business days.
            </Text>
          </View>
        )}

        {kycState === 'REJECTED' && (
          <View style={styles.rejectedCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={styles.statusIcon} />
            <Text style={styles.rejectedTitle}>Application Rejected</Text>
            <Text style={styles.rejectedDesc}>
              The selfie you provided was blurry. Please resubmit clear photos to upgrade to Tier 2.
            </Text>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResubmit}>
              <Text style={styles.dangerButtonText}>Resubmit Documents</Text>
            </TouchableOpacity>
          </View>
        )}

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    position: 'relative',
    paddingHorizontal: 16,
  },
  progressTrack: {
    position: 'absolute',
    top: 14,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: '#1a1b21',
    zIndex: 0,
  },
  tierNodeWrapper: {
    alignItems: 'center',
    zIndex: 1,
  },
  tierNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#0a0b10',
  },
  nodeCompletedAmber: {
    backgroundColor: '#EAB308',
    borderColor: '#EAB308',
  },
  nodeCurrent: {
    borderColor: '#2B7DE9',
  },
  nodeFuture: {
    borderColor: '#34343a',
  },
  nodeInnerBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2B7DE9',
  },
  nodeInnerGray: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34343a',
  },
  tierNameActive: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tierNameGray: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  limitsCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 32,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  limitLabel: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 4,
  },
  limitValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 16,
  },
  upgradeCard: {
    backgroundColor: 'rgba(43, 125, 233, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.3)',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  upgradeDesc: {
    color: '#E3E1E9',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  uploadBox: {
    flex: 1,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadBoxText: {
    color: '#E3E1E9',
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2B7DE9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  statusIcon: {
    marginBottom: 16,
  },
  pendingTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingDesc: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  rejectedCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  rejectedTitle: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  rejectedDesc: {
    color: '#E3E1E9',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
