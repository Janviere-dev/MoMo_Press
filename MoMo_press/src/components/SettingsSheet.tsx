import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

interface SettingsSheetProps {
  db: SQLite.SQLiteDatabase | null;
  userPhone: string;
  onSave?: () => void;
}

export default function SettingsSheet({ db, userPhone, onSave }: SettingsSheetProps) {
  const [limits, setLimits] = useState({
    general: '0',
    moneyTransfer: '0',
    bankTransfer: '0',
    merchant: '0',
    bundles: '0',
    utilities: '0',
    agents: '0',
    others: '0',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [db, userPhone]);

  const loadSettings = async () => {
    if (!db || !userPhone) return;

    try {
      setIsLoading(true);
      const [result] = await db.executeSql(
        `SELECT General_Spending_Limit, Money_Transfer_Limit, Bank_Transfer_Limit, 
                Merchant_Limit, Bundles_Limit, Utilities_Limit, Agent_Limit, Others_Limit 
         FROM Settings WHERE Phone_Number = ? LIMIT 1`,
        [userPhone]
      );

      if (result.rows.length > 0) {
        const settings = result.rows.item(0);
        setLimits({
          general: (settings.General_Spending_Limit || 0).toString(),
          moneyTransfer: (settings.Money_Transfer_Limit || 0).toString(),
          bankTransfer: (settings.Bank_Transfer_Limit || 0).toString(),
          merchant: (settings.Merchant_Limit || 0).toString(),
          bundles: (settings.Bundles_Limit || 0).toString(),
          utilities: (settings.Utilities_Limit || 0).toString(),
          agents: (settings.Agent_Limit || 0).toString(),
          others: (settings.Others_Limit || 0).toString(),
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLimits = async () => {
    if (!db || !userPhone) return;

    try {
      await db.executeSql(
        `INSERT OR REPLACE INTO Settings (
          Settings_Id, Phone_Number, General_Spending_Limit, Money_Transfer_Limit,
          Bank_Transfer_Limit, Merchant_Limit, Bundles_Limit, Utilities_Limit,
          Agent_Limit, Others_Limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `SETTINGS-${userPhone}`,
          userPhone,
          parseInt(limits.general) || 0,
          parseInt(limits.moneyTransfer) || 0,
          parseInt(limits.bankTransfer) || 0,
          parseInt(limits.merchant) || 0,
          parseInt(limits.bundles) || 0,
          parseInt(limits.utilities) || 0,
          parseInt(limits.agents) || 0,
          parseInt(limits.others) || 0,
        ]
      );

      Alert.alert('Success', 'Budget limits saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving limits:', error);
      Alert.alert('Error', 'Failed to save budget limits');
    }
  };

  const renderLimitInput = (label: string, key: keyof typeof limits) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0 = no limit"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={limits[key]}
          onChangeText={(text) => setLimits({ ...limits, [key]: text })}
        />
        <Text style={styles.currency}>RWF</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Budget Limits</Text>
      <Text style={styles.subtitle}>Set monthly spending limits (0 = no limit)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overall Spending</Text>
        {renderLimitInput('Monthly General Limit', 'general')}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category Limits</Text>
        {renderLimitInput('Money Transfers', 'moneyTransfer')}
        {renderLimitInput('Bank Transfers', 'bankTransfer')}
        {renderLimitInput('Merchant Payments', 'merchant')}
        {renderLimitInput('Bundles (Airtime/Data)', 'bundles')}
        {renderLimitInput('Utilities', 'utilities')}
        {renderLimitInput('Agents', 'agents')}
        {renderLimitInput('Others', 'others')}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveLimits}>
        <Text style={styles.saveButtonText}>Save Limits</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ How it works</Text>
        <Text style={styles.infoText}>
          • Set a limit for any category (enter 0 or leave blank for no limit){'\n'}
          • If you exceed a limit, an alert will appear at the top of the app{'\n'}
          • Limits apply only to monthly spending{'\n'}
          • Check your spending on the Spending tab
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
});