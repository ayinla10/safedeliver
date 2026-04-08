import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, StatusBar as RNStatusBar, RefreshControl, Share, Alert, Platform, Modal} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useTheme } from '../ThemeContext';
import * as Clipboard from 'expo-clipboard';

export default function LinksScreen({ navigation }) {
  const { colors } = useTheme();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState(null); // Used for Options Modal
  const [previewImage, setPreviewImage] = useState(null); // Image preview modal

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const data = await api.get('/checkout-links');
      setLinks(data);
    } catch (err) {
      console.error('Fetch links error:', err);
    } finally {
      setLoading(false);
    }
  };

  const SERVER_HOST = '192.168.17.97';

  const handleShare = async (code, product) => {
    try {
      const url = `http://${SERVER_HOST}:3000/pay/${code}`;
      const result = await Share.share({
        message: `Checkout for ${product} via SafeDeliver: ${url}`,
        url: url, // iOS only
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCopyLink = async () => {
    if (!selectedLink) return;
    const url = `http://${SERVER_HOST}:3000/pay/${selectedLink.link_code}`;
    await Clipboard.setStringAsync(url);
    setSelectedLink(null);
    Alert.alert('Link Copied', 'The checkout link has been copied to your clipboard.', [{ text: 'OK' }]);
  };

  const handleToggleStatus = async () => {
    if (!selectedLink) return;
    try {
      await api.patch(`/checkout-links/${selectedLink.link_code}`, { is_active: !selectedLink.is_active });
      setSelectedLink(null);
      fetchLinks();
    } catch (err) {
      Alert.alert('Error', 'Could not update link status');
      console.log(err);
    }
  };

  const handleDelete = () => {
    if (!selectedLink) return;
    Alert.alert('Delete Link', `Are you sure you want to delete ${selectedLink.product_name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/checkout-links/${selectedLink.link_code}`);
            setSelectedLink(null);
            fetchLinks();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete link');
          }
      }}
    ]);
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Checkout Links</Text>
          <Text style={styles.headerSub}>Manage your payment links</Text>
        </View>
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => navigation.navigate('NewLink')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={links}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLinks} tintColor={colors.brand} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={48} color={colors.brandLight} />
            <Text style={styles.emptyText}>{loading ? 'Loading links...' : 'No checkout links yet'}</Text>
            <TouchableOpacity 
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('NewLink')}
            >
              <Text style={styles.emptyBtnText}>Create Your First Link</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: link }) => (
          <TouchableOpacity 
            style={styles.linkCard} 
            activeOpacity={0.9}
            longPressDelay={350}
            onLongPress={() => setSelectedLink(link)}
            onPress={() => handleShare(link.link_code, link.product_name)}
          >
            <View style={styles.cardImageContainer}>
              {link.image_url ? (
                <Image source={{ uri: link.image_url }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.border} />
                </View>
              )}
              
              <View style={[styles.statusIndicator, { backgroundColor: link.is_active ? colors.success : colors.danger }]} />
              
              {link.images && link.images.length > 1 && (
                <View style={styles.multiImageBadge}>
                  <Ionicons name="images" size={10} color={colors.white} />
                  <Text style={styles.multiImageText}>{link.images.length}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.miniOptionsBtn}
                onPress={() => setSelectedLink(link)}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.productTitle} numberOfLines={1}>{link.product_name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>GHS {(link.price / 100).toFixed(0)}</Text>
                <View style={styles.codeTag}>
                  <Text style={styles.linkCode}>{link.link_code}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Options Modal Bottom Sheet */}
      <Modal
        visible={!!selectedLink}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLink(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedLink(null)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedLink?.product_name}</Text>
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={24} color={colors.text} />
              <Text style={styles.sheetOptionText}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleToggleStatus}>
              <Ionicons name={selectedLink?.is_active ? "pause-circle-outline" : "play-circle-outline"} size={24} color={selectedLink?.is_active ? colors.warning : colors.success} />
              <Text style={[styles.sheetOptionText, { color: selectedLink?.is_active ? colors.warning : colors.success }]}>
                {selectedLink?.is_active ? 'Pause Link' : 'Resume Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => { setSelectedLink(null); navigation.navigate('NewLink', { linkCode: selectedLink.link_code }); }}>
              <Ionicons name="create-outline" size={24} color={colors.brand} />
              <Text style={[styles.sheetOptionText, { color: colors.brand }]}>Edit Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={colors.danger} />
              <Text style={[styles.sheetOptionText, { color: colors.danger }]}>Delete Link</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity style={styles.imagePreviewClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  emptyState: {
    width: '100%',
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardGlass,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.brandLight,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: colors.brand,
    fontWeight: '700',
    fontSize: 15,
  },
  linkCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: colors.cardAlt,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  multiImageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  multiImageText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  miniOptionsBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brand,
  },
  codeTag: {
    backgroundColor: colors.brandLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  linkCode: {
    fontSize: 10,
    color: colors.brand,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.sheetBg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 16,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 16 : 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imagePreviewFull: {
    width: '100%',
    height: '80%',
  },
});
