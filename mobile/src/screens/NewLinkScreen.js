import React, { useState, useMemo } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, StatusBar as RNStatusBar, ActivityIndicator, Image, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

export default function NewLinkScreen({ navigation }) {
  const { colors } = useTheme();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = productName && price && imageUri && !loading;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload product images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const handleCreate = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError('');
    
    try {
      // Upload image first
      setUploading(true);
      const uploadData = await api.upload(imageUri);
      setUploading(false);

      // Backend expects price in pesewas
      const priceInPesewas = Math.round(parseFloat(price) * 100);
      
      await api.post('/checkout-links', {
        product_name: productName,
        description: description,
        price: priceInPesewas,
        image_url: uploadData.url,
      });
      
      navigation?.goBack();
    } catch (err) {
      setError(err.message || 'Failed to create link');
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Checkout Link</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Image Upload Area */}
          <TouchableOpacity style={[styles.imageUploadBox, imageUri && styles.imageUploadBoxFilled]} activeOpacity={0.7} onPress={pickImage}>
            {imageUri ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera-outline" size={22} color="#fff" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera-outline" size={28} color={colors.brand} />
                </View>
                <Text style={styles.uploadText}>Tap to add product photo</Text>
                <Text style={styles.uploadRequired}>Required *</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                placeholderTextColor={colors.textMuted}
                value={productName}
                onChangeText={setProductName}
              />
            </View>

            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (Optional)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.priceInputContainer}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyText}>GHS</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={colors.brand} />
              <Text style={styles.infoTitle}>How delivery works</Text>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>The buyer will provide their delivery address securely.</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>You will review their location and quote a delivery fee.</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>SafeDeliver takes a 5% platform fee from the final payment.</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, (!isFormValid || loading) && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.primaryButtonText}>{uploading ? 'Uploading Image...' : 'Creating...'}</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Create Link</Text>
            )}
          </TouchableOpacity>

          {!imageUri && productName && price ? (
            <Text style={styles.hintText}>Add a product photo to enable creating the link</Text>
          ) : null}

        </ScrollView>
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
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.buttonGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  imageUploadBox: {
    height: 200,
    backgroundColor: colors.cardGlass,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  imageUploadBoxFilled: {
    borderStyle: 'solid',
    borderColor: colors.brand,
    borderWidth: 2,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.overlay,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: '700',
  },
  uploadRequired: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  formGroup: {
    gap: 20,
    marginBottom: 32,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    height: 60,
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textAreaWrapper: {
    height: 140,
    paddingTop: 18,
    alignItems: 'flex-start',
  },
  input: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    width: '100%',
  },
  textArea: {
    height: '100%',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    height: 72,
    paddingHorizontal: 20,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  currencyBadge: {
    backgroundColor: colors.brandLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 16,
  },
  currencyText: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 16,
  },
  priceInput: {
    flex: 1,
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    height: '100%',
  },
  infoCard: {
    backgroundColor: colors.brandBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  infoTitle: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '800',
  },
  bulletList: {
    gap: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
    marginTop: 8,
    marginRight: 14,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  hintText: {
    color: colors.warning,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
});
