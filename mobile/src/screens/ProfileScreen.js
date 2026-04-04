import React, { useState } from 'react';
import {View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, StatusBar as RNStatusBar, Platform} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';

export default function ProfileScreen() {
  const { seller, logout } = useAuth();
  
  const [fullName, setFullName] = useState(seller?.full_name || 'Kwame Ansah');
  const [businessName, setBusinessName] = useState(seller?.business_name || 'Kwame Tech Store');
  const [phone, setPhone] = useState(seller?.phone || '0244556677');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogout = () => {
    logout();
  };

  const handleSave = () => {
    // TODO: Implement profile update API
    console.log('Saved profile:', { fullName, businessName, phone });
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
          <TouchableOpacity style={styles.editIconBtn}>
            <Ionicons name="pencil" size={18} color="#64748B" />
          </TouchableOpacity>
          
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{seller?.email || 'kwame@example.com'}</Text>
          
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>Tier 2 — Verified</Text>
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

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeaderRow}>
            <Ionicons name="location-outline" size={24} color="#2B7DE9" />
            <Text style={styles.locationTitle}>Delivery Origin</Text>
          </View>
          
          <View style={styles.locationDetails}>
            <Text style={styles.locationCity}>Accra</Text>
            <Text style={styles.locationRegion}>Greater Accra Region</Text>
          </View>

          <View style={styles.locationActionRow}>
            <Text style={styles.locationLimits}>2 changes per year remaining</Text>
            <TouchableOpacity style={styles.changeLocationBtn}>
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
              onValueChange={setIsDarkMode}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 32,
    position: 'relative',
  },
  editIconBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(43, 125, 233, 0.15)',
    borderWidth: 2,
    borderColor: '#2B7DE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B7DE9',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 16,
  },
  tierBadge: {
    backgroundColor: 'rgba(43, 125, 233, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tierBadgeText: {
    color: '#2B7DE9',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionForm: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0b10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    height: 52,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 15,
    height: '100%',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: 'rgba(43, 125, 233, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(43, 125, 233, 0.2)',
    marginBottom: 24,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    color: '#2B7DE9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDetails: {
    marginBottom: 20,
  },
  locationCity: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRegion: {
    color: '#64748B',
    fontSize: 14,
  },
  locationActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(43, 125, 233, 0.15)',
    paddingTop: 16,
  },
  locationLimits: {
    color: '#64748B',
    fontSize: 12,
  },
  changeLocationBtn: {
    backgroundColor: '#2B7DE9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeLocationText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#12131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
});
