import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar as RNStatusBar, Platform, Image, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import { api } from '../api';
import { optimizeImage } from '../utils/image';

export default function KYCScreen() {
  const { colors } = useTheme();
  const [currentTier, setCurrentTier] = useState(1);
  const [kycStatus, setKycStatus] = useState('NONE'); // PENDING, APPROVED, REJECTED, NONE
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [addressProofImage, setAddressProofImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [application, setApplication] = useState(null);

  const fetchKYCInfo = async () => {
    try {
      const data = await api.get('/kyc');
      setCurrentTier(data.current_tier);
      setAttemptsCount(data.attempts_count || 0);
      setApplication(data.application);
      if (data.application) {
        setKycStatus(data.application.status);
      } else {
        setKycStatus('NONE');
      }
    } catch (err) {
      console.error('Fetch KYC Error:', err);
      // If the error is a session expiry (which our api.js now handles), 
      // the global Alert will trigger. For other errors, we show a local alert.
      if (!err.message.includes('expired')) {
        Alert.alert('Connection Issue', 'Could not reach the server. Please check your internet or try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchKYCInfo();
  }, []);

  React.useEffect(() => {
    fetchKYCInfo();
  }, []);

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

  const pickAddressProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setAddressProofImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const [previewImage, setPreviewImage] = useState(null);

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelfieImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const handleApply = async () => {
    const targetTier = currentTier + 1;

    if (targetTier === 2 && (!idImage || !selfieImage)) {
      Alert.alert('Missing Documents', 'Please upload both your Government ID and a selfie before applying.');
      return;
    }
    if (targetTier === 3 && !addressProofImage) {
      Alert.alert('Missing Documents', 'Please upload a Proof of Address to reach Tier 3.');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = [];
      if (idImage) uploadPromises.push(optimizeImage(idImage).then(img => api.upload(img)));
      if (selfieImage) uploadPromises.push(optimizeImage(selfieImage).then(img => api.upload(img)));
      if (addressProofImage) uploadPromises.push(optimizeImage(addressProofImage).then(img => api.upload(img)));

      const uploads = await Promise.all(uploadPromises);

      const payload = {
        target_tier: targetTier,
        gov_id_url: targetTier === 2 ? uploads[0]?.url : null,
        selfie_url: targetTier === 2 ? uploads[1]?.url : null,
        proof_of_address_url: targetTier === 3 ? uploads[uploads.length - 1]?.url : null,
      };

      await api.post('/kyc/apply', payload);
      fetchKYCInfo(); // Refresh state
      Alert.alert('Success', 'Verification documents submitted successfully and are now under review.');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = () => {
    setIdImage(null);
    setSelfieImage(null);
    setAddressProofImage(null);
    setKycStatus('NONE');
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>KYC Verification</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
        }
      >

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
            Your Current Tier: <Text style={{ color: colors.warning }}>{currentTier} ({currentTier === 1 ? 'Basic' : currentTier === 2 ? 'Verified' : 'Premium'})</Text>
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
        {currentTier < 3 && kycStatus !== 'PENDING' && (
          <View style={styles.upgradeCard}>
            <View style={styles.upgradeHeader}>
              <Ionicons name="arrow-up-circle" size={24} color={colors.brand} />
              <Text style={styles.upgradeTitle}>Upgrade to Tier {currentTier + 1}</Text>
            </View>
            <Text style={styles.upgradeDesc}>
              {currentTier === 1
                ? 'Increase your maximum transaction limit to GHS 10,000 and your weekly withdrawal limit to GHS 50,000 by verifying your identity.'
                : 'Unlock unlimited transactions and premium features by providing your proof of residence.'
              }
            </Text>

            <View style={styles.uploadRow}>
              {currentTier === 1 && (
                <>
                  {/* Government ID */}
                  <TouchableOpacity style={[styles.uploadBox, idImage && styles.uploadBoxFilled]} activeOpacity={0.7} onPress={pickIDPhoto}>
                    {idImage ? (
                      <View style={styles.uploadPreviewWrap}>
                        <Image source={{ uri: idImage }} style={styles.uploadPreview} />
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
                      </View>
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={24} color={colors.textMuted} style={styles.uploadIcon} />
                        <Text style={styles.uploadBoxText}>Selfie with ID</Text>
                        <Text style={styles.uploadBoxHint}>Tap to take photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {currentTier === 2 && (
                <TouchableOpacity style={[styles.uploadBox, addressProofImage && styles.uploadBoxFilled, { flex: 1 }]} activeOpacity={0.7} onPress={pickAddressProof}>
                  {addressProofImage ? (
                    <View style={styles.uploadPreviewWrap}>
                      <Image source={{ uri: addressProofImage }} style={styles.uploadPreview} />
                    </View>
                  ) : (
                    <>
                      <Ionicons name="home-outline" size={24} color={colors.textMuted} style={styles.uploadIcon} />
                      <Text style={styles.uploadBoxText}>Proof of Address</Text>
                      <Text style={styles.uploadBoxHint}>Utility bill or Bank statement</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Selfie Instructions */}
            {currentTier === 1 && (
              <View style={styles.instructionBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.brand} />
                <Text style={styles.instructionText}>
                  For the selfie: hold your ID next to your face, look directly at the camera, and ensure good lighting.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, uploading && styles.buttonDisabled]}
              onPress={handleApply}
              disabled={uploading}
            >
              {uploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Uploading...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Apply for Tier {currentTier + 1}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentTier === 3 && (
          <View style={styles.pendingCard}>
            <Ionicons name="ribbon-outline" size={48} color={colors.warning} style={styles.statusIcon} />
            <Text style={styles.pendingTitle}>Maximum Tier Reached</Text>
            <Text style={styles.pendingDesc}>
              Congratulations! You have verified your identity and reached the maximum seller tier with the highest possible limits.
            </Text>
          </View>
        )}

        {kycStatus === 'PENDING' && (
          <View style={styles.pendingCard}>
            <Ionicons name="hourglass-outline" size={48} color={colors.brand} style={styles.statusIcon} />
            <Text style={styles.pendingTitle}>Application under review</Text>
            <Text style={styles.pendingDesc}>
              Our team is currently reviewing your documents manually. This usually takes 24 to 72h. High AI confidence matches are prioritized.
            </Text>
          </View>
        )}

        {kycStatus === 'REJECTED' && (
          <View style={styles.rejectedCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger} style={styles.statusIcon} />
            <Text style={styles.rejectedTitle}>Application Rejected</Text>
            <Text style={styles.rejectedDesc}>
              {application?.rejection_reason || 'The documents you provided were unclear. Please resubmit clear photos.'}
            </Text>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResubmit}>
              <Text style={styles.dangerButtonText}>Resubmit Documents</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>


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
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  gridLineV: {
    position: 'absolute',
    left: '33.3%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#fff',
  },
  gridLineH: {
    position: 'absolute',
    top: '33.3%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#fff',
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 20,
  },
  maskRow: {
    flexDirection: 'row',
    height: 380, // Oval height
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ovalCutout: {
    width: 260, // Oval width
    borderRadius: 130, // Oval-ish
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  cameraInstructions: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  cameraSubInstructions: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  instructionsGlobe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  closeCameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
