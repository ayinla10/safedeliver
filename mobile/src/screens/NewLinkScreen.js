import React, { useState, useMemo } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, StatusBar as RNStatusBar, ActivityIndicator, Image, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import { api } from '../api';
import { optimizeImage } from '../utils/image';

export default function NewLinkScreen({ navigation }) {
  const { colors } = useTheme();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]); // Array of { uri, id }
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = productName && price && images.length > 0 && !loading;

  const pickImage = async () => {
    if (images.length >= 6) {
      Alert.alert('Limit Reached', 'You can upload up to 6 images per product.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to email product images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 6 - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          id: Math.random().toString(36).substring(7)
        }));
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open image picker');
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleCreate = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError('');
    
    try {
      // Optimize all images before upload
      setUploading(true);
      const optimizedImages = await Promise.all(images.map(img => optimizeImage(img.uri)));
      
      // Upload all optimized images concurrently
      const uploadPromises = optimizedImages.map(uri => api.upload(uri));
      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map(res => res.url);
      setUploading(false);

      // Backend expects price in pesewas
      const priceInPesewas = Math.round(parseFloat(price) * 100);
      
      await api.post('/checkout-links', {
        product_name: productName,
        description: description,
        price: priceInPesewas,
        image_url: imageUrls[0], // Primary image
        images: imageUrls, // Full list
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

          {/* Multi-Image Upload Area */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionLabel}>Product Images ({images.length}/6)</Text>
              {images.length < 6 && (
                <TouchableOpacity onPress={pickImage} style={styles.addMoreBtn}>
                  <Ionicons name="add-circle" size={20} color={colors.brand} />
                  <Text style={styles.addMoreText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageGrid}
            >
              {images.map((img) => (
                <View key={img.id} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => removeImage(img.id)}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length === 0 && (
                <TouchableOpacity style={styles.uploadPlaceholder} onPress={pickImage}>
                  <View style={styles.uploadIconCircle}>
                    <Ionicons name="camera-outline" size={28} color={colors.brand} />
                  </View>
                  <Text style={styles.uploadPlaceholderText}>Tap to add product photos</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

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
                <Text style={styles.primaryButtonText}>{uploading ? `Uploading Images (${images.length})...` : 'Creating...'}</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Create Link</Text>
            )}
          </TouchableOpacity>

          {!images.length && productName && price ? (
            <Text style={styles.hintText}>Add at least one product photo to enable creating the link</Text>
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
  imageSection: {
    marginBottom: 32,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMoreText: {
    color: colors.brand,
    fontWeight: '800',
    fontSize: 14,
  },
  imageGrid: {
    gap: 12,
    paddingRight: 20,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  uploadPlaceholder: {
    width: 200,
    height: 140,
    borderRadius: 24,
    backgroundColor: colors.cardGlass,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadPlaceholderText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
