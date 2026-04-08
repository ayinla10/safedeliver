import React, { useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function WaitingQuoteScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      {/* Product Header Thumbnail */}
      <View style={styles.headerImageContainer}>
        <Image source={{ uri: mockOrder.image }} style={styles.headerImage} />
        <View style={styles.imageOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Waiting Animation/Icon Area */}
        <TouchableOpacity activeOpacity={1} delayLongPress={1500} onLongPress={handleSimulateQuote} style={styles.loadingContainer}>
          <View style={styles.iconOuterCircle}>
            <View style={styles.iconInnerCircle}>
              <Ionicons name="hourglass-outline" size={32} color={colors.brand} />
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
            <Ionicons name="cube-outline" size={18} color={colors.textMuted} style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1}>{mockOrder.productTitle}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} style={styles.detailIcon} />
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

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0,
  },
  headerImageContainer: {
    height: 220,
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
    backgroundColor: colors.bg + '20', 
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    transform: [{ translateY: -60 }], 
  },
  loadingContainer: {
    marginBottom: 32,
  },
  iconOuterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brandLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.brandBorder,
  },
  iconInnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 44,
    paddingHorizontal: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.cardGlass,
    borderRadius: 32,
    padding: 28,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardDate: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  detailText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 'auto',
    width: '100%',
    paddingBottom: 40,
  },
  cancelBtn: {
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger + '30',
    backgroundColor: colors.danger + '08',
  },
  cancelBtnText: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
