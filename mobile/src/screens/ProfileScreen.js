import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, StatusBar as RNStatusBar, Platform, Alert, ActivityIndicator, Modal} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { api } from '../api';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East', 'Savannah',
];

export default function ProfileScreen() {
  const { seller, logout, refreshSeller } = useAuth();
  const { isDark, colors, toggleTheme } = useTheme();
  
  const [fullName, setFullName] = useState(seller?.full_name || '');
  const [businessName, setBusinessName] = useState(seller?.business_name || '');
  const [phone, setPhone] = useState(seller?.phone || '');
  const [city, setCity] = useState(seller?.city || 'Accra');
  const [region, setRegion] = useState(seller?.region || 'Greater Accra');
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
      const data = await api.patch('/auth/profile', { full_name: fullName, business_name: businessName, phone, city, region });
      Alert.alert('Saved', 'Profile updated successfully.');
      if (refreshSeller && data.seller) refreshSeller(data.seller);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch('/seller/location', { city: tempCity, region: tempRegion });
      Alert.alert('Location Updated', res.message);
      
      setCity(tempCity);
      setRegion(tempRegion);
      setShowLocationPicker(false);
      
      if (refreshSeller) {
          // Fetch updated profile to see new limits/stats
          const updated = await api.get('/seller/profile');
          refreshSeller(updated);
      }
    } catch (err) {
      Alert.alert('Limit Reached', err.message || 'Could not update location');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
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
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="storefront-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Money Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
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
            <Ionicons name="location-outline" size={24} color={colors.brand} />
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
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color={colors.text} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.brand + '66' }}
              thumbColor={isDark ? colors.brand : colors.bg}
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
                <Ionicons name="business-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={tempCity}
                  onChangeText={setTempCity}
                  placeholder="e.g. Kumasi"
                  placeholderTextColor={colors.textMuted}
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
                    {tempRegion === r && <Ionicons name="checkmark" size={18} color={colors.brand} />}
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

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 4 : 0 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: colors.cardGlass, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: 32, position: 'relative',
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brandLight,
    borderWidth: 1.5, borderColor: colors.brandBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.brand },
  profileName: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileEmail: { color: colors.textMuted, fontSize: 14, marginBottom: 16 },
  tierBadge: { backgroundColor: colors.brandLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tierBadgeText: { color: colors.brand, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  sectionForm: {
    backgroundColor: colors.card, borderRadius: 20, padding: 24,
    borderWidth: 1.5, borderColor: colors.border, marginBottom: 24,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, height: 56,
  },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, color: colors.text, fontSize: 15, height: '100%', fontWeight: '500' },
  saveButton: {
    backgroundColor: colors.brand, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  locationCard: {
    backgroundColor: colors.brandBg, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.brandBorder, marginBottom: 24,
  },
  locationHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationTitle: { color: colors.brand, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  locationDetails: { marginBottom: 20 },
  locationCity: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  locationRegion: { color: colors.textMuted, fontSize: 14, fontWeight: '500' },
  locationActionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.brandBorder, paddingTop: 16,
  },
  locationLimits: { color: colors.textMuted, fontSize: 12 },
  changeLocationBtn: { backgroundColor: colors.brand, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  changeLocationText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  settingsCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.border, marginBottom: 24,
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  dangerText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: colors.sheetBg, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20, textAlign: 'center', letterSpacing: -0.3 },
  regionOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8,
    backgroundColor: 'transparent',
  },
  regionOptionActive: { backgroundColor: colors.brandLight },
  regionOptionText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
  regionOptionTextActive: { color: colors.brand, fontWeight: '700' },
  primarySaveBtn: { 
    backgroundColor: colors.brand, paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 12,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 15, elevation: 6,
  },
  primarySaveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
