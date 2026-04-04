import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView, StatusBar as RNStatusBar, ActivityIndicator} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function NewLinkScreen({ navigation }) {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = productName && price && !loading;

  const handleCreate = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError('');
    
    try {
      // Backend expects price in pesewas
      const priceInPesewas = Math.round(parseFloat(price) * 100);
      
      await api.post('/checkout-links', {
        product_name: productName,
        description: description,
        price: priceInPesewas,
        image_url: null // TODO: Image upload
      });
      
      navigation?.goBack();
    } catch (err) {
      setError(err.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Checkout Link</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Image Upload Area */}
          <TouchableOpacity style={styles.imageUploadBox} activeOpacity={0.7}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="camera-outline" size={28} color="#2B7DE9" />
            </View>
            <Text style={styles.uploadText}>Tap to add product photo</Text>
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Product Name"
                placeholderTextColor="#64748B"
                value={productName}
                onChangeText={setProductName}
              />
            </View>

            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (Optional)"
                placeholderTextColor="#64748B"
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
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#2B7DE9" />
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
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Link</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
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
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  imageUploadBox: {
    height: 180,
    backgroundColor: 'rgba(43, 125, 233, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(43, 125, 233, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    color: '#2B7DE9',
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    gap: 16,
    marginBottom: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#12131a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  textAreaWrapper: {
    height: 120,
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  input: {
    color: '#F1F5F9',
    fontSize: 16,
    width: '100%',
  },
  textArea: {
    height: '100%',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12131a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    height: 64,
    paddingHorizontal: 16,
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  currencyText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  priceInput: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '700',
    height: '100%',
  },
  infoCard: {
    backgroundColor: 'rgba(43, 125, 233, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.15)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  infoTitle: {
    color: '#2B7DE9',
    fontSize: 16,
    fontWeight: '700',
  },
  bulletList: {
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2B7DE9',
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    color: '#E3E1E9',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#2B7DE9',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
