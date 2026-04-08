import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform, Image, Alert, ActivityIndicator, Modal} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

export default function KYCScreen() {
  const { colors } = useTheme();
  const [kycState, setKycState] = useState('Tier 1');
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickIDPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIdImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const [showSelfieGuide, setShowSelfieGuide] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Access Required', 'Please allow camera access.');
      return;
    }
    setShowSelfieGuide(true);
  };

  const launchCamera = async () => {
    // 1. Close the guide modal FIRST to clear the activity stack and avoid race conditions
    setShowSelfieGuide(false);
    
    // 2. Add a small delay to allow the modal's closing animation to finish
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      // 3. Re-verify permissions immediately before launch
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access Required', 'Please allow camera access in your settings.');
        return;
      }

      // 4. Launch camera with stability defaults (allowsEditing: false is safer for front camera)
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, 
        aspect: [4, 3],
        quality: 0.7,
        cameraType: ImagePicker.CameraType.front,
      });
      
      if (!result.canceled && result.assets[0]) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Launch Camera Error:', err);
      Alert.alert('Error', 'Could not open camera. Please ensure you have granted camera permissions.');
    }
  };

  const handleApply = async () => {
    if (!idImage || !selfieImage) {
      Alert.alert('Missing Documents', 'Please upload both your Government ID and a selfie before applying.');
      return;
    }

    setUploading(true);
    try {
      const [idUpload, selfieUpload] = await Promise.all([
        api.upload(idImage),
        api.upload(selfieImage),
      ]);

      await api.post('/kyc/apply', {
        target_tier: 2,
        gov_id_url: idUpload.url,
        selfie_url: selfieUpload.url,
      });

      setKycState('PENDING');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = () => {
    setIdImage(null);
    setSelfieImage(null);
    setKycState('Tier 1');
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>KYC Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tier Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack} />
          
          <View style={styles.tierNodeWrapper}>
            <View style={[styles.tierNode, styles.nodeCompletedAmber]}>
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
            <Text style={styles.tierNameActive}>Tier 1</Text>
          </View>

          <View style={styles.tierNodeWrapper}>
            <View style={[styles.tierNode, styles.nodeCurrent]}>
              <View style={styles.nodeInnerBlue} />
            </View>
            <Text style={styles.tierNameActive}>Tier 2</Text>
          </View>

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
            Your Current Tier: <Text style={{ color: colors.warning }}>1 (Basic)</Text>
          </Text>
        </View>

        {/* Limits Card */}
        <View style={styles.limitsCard}>
          <View style={styles.limitRow}>
            <View style={styles.limitIconWrapper}>
              <Ionicons name="cash-outline" size={20} color={colors.text} />
            </View>
            <View>
              <Text style={styles.limitLabel}>Max Transaction</Text>
              <Text style={styles.limitValue}>GHS 1,000</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.limitRow}>
            <View style={styles.limitIconWrapper}>
              <Ionicons name="wallet-outline" size={20} color={colors.text} />
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
              <Ionicons name="arrow-up-circle" size={24} color={colors.brand} />
              <Text style={styles.upgradeTitle}>Upgrade to Tier 2 — Verified</Text>
            </View>
            <Text style={styles.upgradeDesc}>
              Increase your maximum transaction limit to GHS 10,000 and your weekly withdrawal limit to GHS 50,000 by verifying your identity.
            </Text>

            <View style={styles.uploadRow}>
              {/* Government ID */}
              <TouchableOpacity style={[styles.uploadBox, idImage && styles.uploadBoxFilled]} activeOpacity={0.7} onPress={pickIDPhoto}>
                {idImage ? (
                  <View style={styles.uploadPreviewWrap}>
                    <Image source={{ uri: idImage }} style={styles.uploadPreview} />
                    <View style={styles.uploadCheckmark}>
                      <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="id-card-outline" size={24} color={colors.textMuted} style={styles.uploadIcon} />
                    <Text style={styles.uploadBoxText}>Government ID</Text>
                    <Text style={styles.uploadBoxHint}>Tap to upload</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Selfie */}
              <TouchableOpacity style={[styles.uploadBox, selfieImage && styles.uploadBoxFilled]} activeOpacity={0.7} onPress={takeSelfie}>
                {selfieImage ? (
                  <View style={styles.uploadPreviewWrap}>
                    <Image source={{ uri: selfieImage }} style={styles.uploadPreview} />
                    <View style={styles.uploadCheckmark}>
                      <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={24} color={colors.textMuted} style={styles.uploadIcon} />
                    <Text style={styles.uploadBoxText}>Selfie with ID</Text>
                    <Text style={styles.uploadBoxHint}>Tap to take photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Selfie Instructions */}
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.brand} />
              <Text style={styles.instructionText}>
                For the selfie: hold your ID next to your face, look directly at the camera, and ensure good lighting.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, (!idImage || !selfieImage || uploading) && styles.buttonDisabled]} 
              onPress={handleApply}
              disabled={!idImage || !selfieImage || uploading}
            >
              {uploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Uploading Documents...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Apply for Tier 2</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {kycState === 'PENDING' && (
          <View style={styles.pendingCard}>
            <Ionicons name="hourglass-outline" size={48} color={colors.brand} style={styles.statusIcon} />
            <Text style={styles.pendingTitle}>Application under review</Text>
            <Text style={styles.pendingDesc}>
              We are currently reviewing your documents. This usually takes 1-2 business days.
            </Text>
          </View>
        )}

        {kycState === 'REJECTED' && (
          <View style={styles.rejectedCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} style={styles.statusIcon} />
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

      {/* Modern Selfie Guide Modal */}
      <Modal visible={showSelfieGuide} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Ionicons name="camera" size={32} color={colors.brand} />
              <Text style={styles.guideTitle}>Verification Selfie</Text>
            </View>
            
            <View style={styles.instructionList}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionStep}><Text style={styles.stepNum}>1</Text></View>
                <Text style={styles.stepText}>Hold your ID card next to your face</Text>
              </View>
              <View style={styles.instructionRow}>
                <View style={styles.instructionStep}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.stepText}>Ensure both face and ID are fully visible</Text>
              </View>
              <View style={styles.instructionRow}>
                <View style={styles.instructionStep}><Text style={styles.stepNum}>3</Text></View>
                <Text style={styles.stepText}>Use bright, even lighting</Text>
              </View>
            </View>

            <View style={styles.guideActions}>
              <TouchableOpacity style={styles.cancelGuideBtn} onPress={() => setShowSelfieGuide(false)}>
                <Text style={styles.cancelGuideText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startCameraBtn} onPress={launchCamera}>
                <Text style={styles.startCameraText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity style={[styles.previewOverlay, { backgroundColor: colors.bg }]} activeOpacity={1} onPress={() => setPreviewImage(null)}>
          <Image source={{ uri: previewImage }} style={styles.fullPreviewImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={30} color={colors.text} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 44,
    position: 'relative',
    paddingHorizontal: 20,
  },
  progressTrack: {
    position: 'absolute',
    top: 18,
    left: 48,
    right: 48,
    height: 3,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  tierNodeWrapper: {
    alignItems: 'center',
    zIndex: 1,
  },
  tierNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  nodeCompletedAmber: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  nodeCurrent: {
    borderColor: colors.brand,
    backgroundColor: colors.brandLight,
  },
  nodeFuture: {
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  nodeInnerBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand,
  },
  nodeInnerGray: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  tierNameActive: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  tierNameGray: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  limitsCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 40,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 6,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  limitLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  limitValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  upgradeCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: -0.3,
  },
  upgradeDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 28,
    fontWeight: '500',
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  uploadBox: {
    flex: 1,
    height: 140,
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadBoxFilled: {
    borderStyle: 'solid',
    borderColor: colors.success,
    borderWidth: 2,
  },
  uploadPreviewWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  uploadIcon: {
    marginBottom: 12,
  },
  uploadBoxText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBoxHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.brandLight,
    padding: 16,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  instructionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pendingCard: {
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 6,
  },
  statusIcon: {
    marginBottom: 20,
  },
  pendingTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  pendingDesc: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  rejectedCard: {
    backgroundColor: colors.danger + '08',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    alignItems: 'center',
  },
  rejectedTitle: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  rejectedDesc: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guideCard: {
    backgroundColor: colors.bg,
    borderRadius: 32,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
  },
  guideHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  guideTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  instructionList: {
    gap: 20,
    marginBottom: 40,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instructionStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  stepText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  guideActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelGuideBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelGuideText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  startCameraBtn: {
    flex: 2,
    backgroundColor: colors.brand,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  startCameraText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewImage: {
    width: '100%',
    height: '80%',
  },
  closePreview: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
