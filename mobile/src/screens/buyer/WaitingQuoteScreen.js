import React from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WaitingQuoteScreen({ navigation }) {
  // Mock data representing the submitted order
  const mockOrder = {
    productTitle: 'MacBook Pro M2 2023',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    address: '12 Independence Ave, Ridge, Accra',
    date: 'Today, 10:30 AM'
  };

  const handleCancel = () => {
    // Navigate back or cancel order logic
    navigation?.goBack();
  };

  const handleSimulateQuote = () => {
    // Hidden dev shortcut to advance the flow
    navigation?.navigate('BuyerQuoteReceived');
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
      {/* Product Header Thumbnail */}
      <View style={styles.headerImageContainer}>
        <Image source={{ uri: mockOrder.image }} style={styles.headerImage} />
        <View style={styles.imageOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Waiting Animation/Icon Area */}
        <TouchableOpacity activeOpacity={1} delayLongPress={1500} onLongPress={handleSimulateQuote} style={styles.loadingContainer}>
          <View style={styles.iconOuterCircle}>
            <View style={styles.iconInnerCircle}>
              <Ionicons name="hourglass-outline" size={32} color="#2B7DE9" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Status Text */}
        <Text style={styles.title}>Waiting for Delivery Quote</Text>
        <Text style={styles.subtitle}>
          The seller is reviewing your location to provide an accurate delivery fee. You will be notified once it's ready.
        </Text>

        {/* Request Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Request Details</Text>
            <Text style={styles.cardDate}>{mockOrder.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={18} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>{mockOrder.productTitle}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color="#64748B" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={2}>{mockOrder.address}</Text>
          </View>
        </View>

        {/* Action Bottom */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
    },
  headerImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 16, 0.6)',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    transform: [{ translateY: -40 }], // Pull content up over the image
  },
  loadingContainer: {
    marginBottom: 24,
  },
  iconOuterCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.2)',
  },
  iconInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#12131a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B7DE9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDate: {
    color: '#64748B',
    fontSize: 13,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  detailText: {
    flex: 1,
    color: '#E3E1E9',
    fontSize: 15,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 'auto',
    width: '100%',
    paddingBottom: 40,
  },
  cancelBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
