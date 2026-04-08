import React, { useState, useEffect, useMemo } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar as RNStatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../ThemeContext';
import { api } from '../../api';

export default function OTPScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const { verifyOtp, verifyPhone, needsVerify } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await verifyOtp(verifyPhone, otp);
      // AuthContext handles setting seller and redirecting via state change
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      try {
        await api.post('/auth/resend-otp', { phone: verifyPhone });
        setTimer(60);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to resend OTP');
      }
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={56} color={colors.brand} />
          </View>
          
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to {'\n'}
            <Text style={styles.phoneText}>+233 {verifyPhone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={colors.textMuted + '40'}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(val) => {
                setOtp(val);
                if (error) setError('');
              }}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.verifyButton, (loading || otp.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || otp.length !== 6}
          >
            <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
              <Text style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1.5,
    borderColor: colors.brandBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 56,
    fontWeight: '500',
  },
  phoneText: {
    color: colors.text,
    fontWeight: '800',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    backgroundColor: colors.cardGlass,
    borderRadius: 24,
    height: 90,
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 10,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: colors.danger + '10',
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: colors.brand,
    paddingVertical: 20,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  resendLink: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '700',
  },
  resendDisabled: {
    color: colors.textMuted,
  },
});
