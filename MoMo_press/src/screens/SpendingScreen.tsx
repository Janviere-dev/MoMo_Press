import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { palette } from '../styles/colors';

interface SpendingScreenProps {
  db: SQLite.SQLiteDatabase | null;
  userPhone: string;
  period: 'weekly' | 'monthly';
  onPeriodChange?: (period: 'weekly' | 'monthly') => void;
  lastSyncAt?: number | null;
}

export default function SpendingScreen({ db, userPhone, period, onPeriodChange, lastSyncAt }: SpendingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    moneyTransfers: 0,
    bankTransfers: 0,
    airtime: 0,
    merchants: 0,
    utilities: 0,
    others: 0,
    agents: 0,
  });

  useEffect(() => {
    loadTotals();
    // re-run when period, db or userPhone changes or when a sync completes
  }, [db, userPhone, period, lastSyncAt]);

  const loadTotals = async () => {
    if (!db || !userPhone) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const startDate = period === 'monthly'
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [moneyTransfers] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Money_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, startDate]
      );

      const [bankTransfers] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Bank_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, startDate]
      );

      const [bundles] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Bundles WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      const [merchantPayments] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      const [utilities] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Utilities WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      const [others] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Others WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      const [agentTransactions] = await db.executeSql(
        `SELECT COALESCE(SUM(Amount),0) as total FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      const moneyTransfersTotal = (moneyTransfers.rows.item(0)?.total || 0);
      const bankTransfersTotal = (bankTransfers.rows.item(0)?.total || 0);
      const airtimeTotal = (bundles.rows.item(0)?.total || 0);
      const merchantsTotal = (merchantPayments.rows.item(0)?.total || 0);
      const utilitiesTotal = (utilities.rows.item(0)?.total || 0);
      const othersTotal = (others.rows.item(0)?.total || 0);
      const agentsTotal = (agentTransactions.rows.item(0)?.total || 0);

      setTotals({
        moneyTransfers: moneyTransfersTotal,
        bankTransfers: bankTransfersTotal,
        airtime: airtimeTotal,
        merchants: merchantsTotal,
        utilities: utilitiesTotal,
        others: othersTotal,
        agents: agentsTotal,
      });
    } catch (e) {
      console.error('Error loading spending totals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAll = totals.moneyTransfers + totals.bankTransfers + totals.airtime + totals.merchants + totals.utilities + totals.others + totals.agents || 1;

  const renderRow = (label: string, value: number, color: string) => {
    const pct = Math.round((value / totalAll) * 100);
    return (
      <View style={styles.row} key={label}>
        <View style={styles.rowLeft}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.amount}>RWF {value.toLocaleString()}</Text>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Spending Breakdown</Text>
          <Text style={styles.subtitle}>{period === 'monthly' ? 'This Month' : 'Last 7 days'}</Text>
        </View>
      </View>

      {/* Period Toggle */}
      {onPeriodChange && (
        <View style={styles.periodToggleContainer}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}
            onPress={() => onPeriodChange('weekly')}
          >
            <Text style={[styles.periodButtonText, period === 'weekly' && styles.periodButtonTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}
            onPress={() => onPeriodChange('monthly')}
          >
            <Text style={[styles.periodButtonText, period === 'monthly' && styles.periodButtonTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Categories</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : (
          <View style={styles.list}>
            {renderRow('Money Transfers', totals.moneyTransfers, palette.moneyTransfers)}
            {renderRow('Bank Transfers', totals.bankTransfers, palette.bankTransfers)}
            {renderRow('Airtime', totals.airtime, palette.bundles)}
            {renderRow('Merchants', totals.merchants, palette.merchantPayments)}
            {renderRow('Utilities', totals.utilities, palette.utilities)}
            {renderRow('Others', totals.others, palette.others)}
            {renderRow('Agents', totals.agents, palette.agentTransactions)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF3C7' },
  content: { padding: 20, paddingBottom: 80 },
  header: {
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  periodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FBBF24',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#1F2937',
  },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  loading: { color: '#6B7280' },
  list: { gap: 12 },
  row: { marginBottom: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 14, color: '#374151' },
  rowRight: { marginTop: 6 },
  amount: { fontSize: 13, color: '#1F2937', marginBottom: 6 },
  barBackground: { width: '100%', height: 8, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%' },
  pct: { fontSize: 12, color: '#6B7280' },
});