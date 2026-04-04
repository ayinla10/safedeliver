import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, StatusBar as RNStatusBar, RefreshControl, Share, Alert, Platform, Modal} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import * as Clipboard from 'expo-clipboard';

export default function LinksScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="light-content" backgroundColor="#0a0b10" />
      
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
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLinks} tintColor="#2B7DE9" />
        }
      >
        {links.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={48} color="rgba(255,255,255,0.05)" />
            <Text style={styles.emptyText}>{loading ? 'Loading links...' : 'No checkout links yet'}</Text>
            <TouchableOpacity 
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('NewLink')}
            >
              <Text style={styles.emptyBtnText}>Create Your First Link</Text>
            </TouchableOpacity>
          </View>
        ) : (
          links.map((link) => (
            <TouchableOpacity key={link.id} style={styles.linkCard} activeOpacity={0.8}>
              <TouchableOpacity 
                style={styles.cardImageContainer} 
                activeOpacity={0.9}
                onPress={() => link.image_url && setPreviewImage(link.image_url)}
              >
                {link.image_url ? (
                  <Image source={{ uri: link.image_url }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.1)" />
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: link.is_active ? '#22C55E20' : '#EF444420' }]}>
                  <Text style={[styles.statusText, { color: link.is_active ? '#22C55E' : '#EF4444' }]}>
                    {link.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
                {link.image_url && (
                  <View style={styles.previewHint}>
                    <Ionicons name="expand-outline" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.cardContent}>
                <View style={styles.contentLeft}>
                  <Text style={styles.productTitle} numberOfLines={1}>{link.product_name}</Text>
                  <Text style={styles.productPrice}>GHS {(link.price / 100).toFixed(2)}</Text>
                  <Text style={styles.linkCode}>Code: {link.link_code}</Text>
                </View>

                <View style={styles.contentRight}>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleShare(link.link_code, link.product_name)}
                  >
                    <Ionicons name="share-social-outline" size={20} color="#2B7DE9" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => setSelectedLink(link)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

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
              <Ionicons name="copy-outline" size={24} color="#F1F5F9" />
              <Text style={styles.sheetOptionText}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={handleToggleStatus}>
              <Ionicons name={selectedLink?.is_active ? "pause-circle-outline" : "play-circle-outline"} size={24} color={selectedLink?.is_active ? "#EAB308" : "#22C55E"} />
              <Text style={[styles.sheetOptionText, { color: selectedLink?.is_active ? "#EAB308" : "#22C55E" }]}>
                {selectedLink?.is_active ? 'Pause Link' : 'Resume Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => { setSelectedLink(null); navigation.navigate('NewLink', { linkCode: selectedLink.link_code }); }}>
              <Ionicons name="create-outline" size={24} color="#2B7DE9" />
              <Text style={[styles.sheetOptionText, { color: '#2B7DE9' }]}>Edit Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Link</Text>
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
            <Ionicons name="close" size={28} color="#fff" />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2B7DE9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#2B7DE9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12131a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 20,
  },
  emptyText: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(43, 125, 233, 0.1)',
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#2B7DE9',
    fontWeight: '600',
  },
  linkCard: {
    backgroundColor: '#12131a',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardImageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: '#1a1b21',
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backdropFilter: 'blur(10px)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B7DE9',
    marginBottom: 4,
  },
  linkCode: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  contentRight: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#1a1b21',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetOptionText: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '600',
    marginLeft: 16,
  },
  previewHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 12 : 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imagePreviewFull: {
    width: '100%',
    height: '80%',
  },
});
