import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.shieldWrapper}>
            <Ionicons name="shield-checkmark" size={64} color={colors.brand} />
          </View>
          <Text style={styles.logoText}>SafeDeliver</Text>
          <Text style={styles.tagline}>Social commerce, secured with trust.</Text>
        </View>

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('Register')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginLinkContainer}
          onPress={() => navigation?.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextHighlight}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  shieldWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: colors.brand + '20',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.brand,
    width: 32,
  },
  footerContainer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    paddingTop: 24,
  },
  primaryButton: {
    backgroundColor: colors.brand,
    paddingVertical: 22,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  loginLinkContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  loginTextHighlight: {
    color: colors.brand,
    fontWeight: '800',
  },
});
