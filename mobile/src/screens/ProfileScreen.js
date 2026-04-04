import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, StatusBar as RNStatusBar, Platform, Alert, ActivityIndicator, Modal} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { api } from '../api';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East', 'Savannah',
];

export default function ProfileScreen() {
  const { seller, logout, refreshSeller } = useAuth();
  
  const [fullName, setFullName] = useState(seller?.full_name || '');
  const [businessName, setBusinessName] = useState(seller?.business_name || '');
  const [phone, setPhone] = useState(seller?.phone || '');
  const [city, setCity] = useState(seller?.city || 'Accra');
  const [region, setRegion] = useState(seller?.region || 'Greater Accra');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [tempRegion, setTempRegion] = useState(region);

  const handleLogout = () => {
    logout();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', { full_name: fullName, business_name: businessName, phone, city, region });
      Alert.alert('Saved', 'Profile updated successfully.');
      if (refreshSeller) refreshSeller();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = (val) => {
    if (!val) {
      Alert.alert('Coming Soon', 'Light mode is coming in the next update! Stay tuned. 🌞');
      return;
    }
    setIsDarkMode(val);
  };

  const handleLocationSave = () => {
    setCity(tempCity);
    setRegion(tempRegion);
    setShowLocationPicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="#0a0b10" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{seller?.email || ''}</Text>
          
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>Tier {seller?.kyc_tier || 1}</Text>
          </View>
        </View>

        {/* Editable Form Card */}
        <View style={styles.sectionForm}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="storefront-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Money Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeaderRow}>
            <Ionicons name="location-outline" size={24} color="#2B7DE9" />
            <Text style={styles.locationTitle}>Delivery Origin</Text>
          </View>
          
          <View style={styles.locationDetails}>
            <Text style={styles.locationCity}>{city}</Text>
            <Text style={styles.locationRegion}>{region} Region</Text>
          </View>

          <View style={styles.locationActionRow}>
            <Text style={styles.locationLimits}>2 changes per year remaining</Text>
            <TouchableOpacity style={styles.changeLocationBtn} onPress={() => { setTempCity(city); setTempRegion(region); setShowLocationPicker(true); }}>
              <Text style={styles.changeLocationText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={22} color="#F1F5F9" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: '#34343a', true: 'rgba(43, 125, 233, 0.4)' }}
              thumbColor={isDarkMode ? '#2B7DE9' : '#F1F5F9'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
            <View style={styles.settingRowLeft}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.dangerText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} transparent animationType="slide" onRequestClose={() => setShowLocationPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLocationPicker(false)}>
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Change Location</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempCity}
                  onChangeText={setTempCity}
                  placeholder="e.g. Kumasi"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Region</Text>
              <ScrollView horizontal={false} style={{ maxHeight: 180 }} showsVerticalScrollIndicator>
                {GHANA_REGIONS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.regionOption, tempRegion === r && styles.regionOptionActive]}
                    onPress={() => setTempRegion(r)}
                  >
                    <Text style={[styles.regionOptionText, tempRegion === r && styles.regionOptionTextActive]}>{r}</Text>
                    {tempRegion === r && <Ionicons name="checkmark" size={18} color="#2B7DE9" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.primarySaveBtn} onPress={handleLocationSave}>
              <Text style={styles.primarySaveBtnText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b10', paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#12131a', borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 32, position: 'relative',
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(43, 125, 233, 0.15)',
    borderWidth: 2, borderColor: '#2B7DE9', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#2B7DE9' },
  profileName: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileEmail: { color: '#64748B', fontSize: 14, marginBottom: 16 },
  tierBadge: { backgroundColor: 'rgba(43, 125, 233, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tierBadgeText: { color: '#2B7DE9', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  sectionForm: {
    backgroundColor: '#12131a', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 24,
  },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#64748B', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0b10',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', height: 52,
  },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, color: '#F1F5F9', fontSize: 15, height: '100%' },
  saveButton: {
    backgroundColor: '#2B7DE9', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  locationCard: {
    backgroundColor: 'rgba(43, 125, 233, 0.05)', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(43, 125, 233, 0.2)', marginBottom: 24,
  },
  locationHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationTitle: { color: '#2B7DE9', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  locationDetails: { marginBottom: 20 },
  locationCity: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  locationRegion: { color: '#64748B', fontSize: 14 },
  locationActionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(43, 125, 233, 0.15)', paddingTop: 16,
  },
  locationLimits: { color: '#64748B', fontSize: 12 },
  changeLocationBtn: { backgroundColor: '#2B7DE9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  changeLocationText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  settingsCard: {
    backgroundColor: '#12131a', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 24,
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { color: '#F1F5F9', fontSize: 16, fontWeight: '500' },
  dangerText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#1a1b21', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 16, textAlign: 'center' },
  regionOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4,
  },
  regionOptionActive: { backgroundColor: 'rgba(43, 125, 233, 0.1)' },
  regionOptionText: { color: '#94A3B8', fontSize: 15 },
  regionOptionTextActive: { color: '#2B7DE9', fontWeight: '600' },
  primarySaveBtn: { backgroundColor: '#2B7DE9', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  primarySaveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
