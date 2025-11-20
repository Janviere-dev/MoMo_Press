import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export interface OnboardingSettings {
  monthlyLimit: number;
}

interface OnboardingScreenProps {
  onComplete: (settings: OnboardingSettings) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [monthlyLimit, setMonthlyLimit] = useState('0');

  const handleComplete = () => {
    onComplete({
      monthlyLimit: parseInt(monthlyLimit) || 0,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>MoMo</Text>
            <Text style={styles.logoSubtext}>Press</Text>
          </View>
        </View>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome to MoMo Press</Text>
        <Text style={styles.subtitle}>Let's personalize your experience</Text>
      </View>

      {/* Monthly Limit Setup */}
      <View style={styles.stepContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F87171' }]}>
              <Text style={styles.icon}>🔔</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Monthly Spending Limit</Text>
              <Text style={styles.cardDescription}>
                Set a monthly spending cap. You'll receive an alert when you exceed this limit.
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Monthly Limit (RWF)</Text>
                <TextInput
                  style={styles.input}
                  value={monthlyLimit}
                  onChangeText={setMonthlyLimit}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  Set to 0 to disable monthly limit alerts
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✓</Text>
          <View style={styles.successTextContainer}>
            <Text style={styles.successTitle}>You're all set!</Text>
            <Text style={styles.successDescription}>
              You can change these settings anytime from the Settings menu.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleComplete}>
          <Text style={styles.nextButtonText}>Get Started ✓</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    padding: 32,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoText: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoSubtext: {
    color: '#FFFFFF',
    fontSize: 8,
    marginLeft: 2,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  stepContainer: {
    gap: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    gap: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 8,
    marginTop: 8,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    height: 56,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputHint: {
    color: '#6B7280',
    fontSize: 12,
  },
  successCard: {
    flexDirection: 'row',
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  successIcon: {
    fontSize: 20,
    color: '#10B981',
    marginTop: 2,
  },
  successTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  successTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  successDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#374151',
  },
  backButtonText: {
    color: '#D1D5DB',
    fontSize: 17,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
});

