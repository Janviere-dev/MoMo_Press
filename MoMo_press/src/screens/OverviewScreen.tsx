import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { palette } from '../styles/colors';

interface OverviewScreenProps {
  onSendMoney: () => void;
  db: SQLite.SQLiteDatabase | null;
  userPhone: string;
  balance?: number;
  monthlySpending?: number;
  transactionCount?: number;
  period: 'weekly' | 'monthly';
  onPeriodChange: (period: 'weekly' | 'monthly') => void;
  lastSyncAt?: number | null;
}

const { width } = Dimensions.get('window');

export default function OverviewScreen({
  onSendMoney,
  db,
  userPhone,
  balance: propBalance,
  monthlySpending: propMonthlySpending,
  transactionCount: propTransactionCount,
  period,
  onPeriodChange,
  lastSyncAt,
}: OverviewScreenProps) {
  const [balance, setBalance] = useState(propBalance || 0);
  const [periodSpending, setPeriodSpending] = useState(propMonthlySpending || 0);
  const [transactionCount, setTransactionCount] = useState(propTransactionCount || 0);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionTypePercentages, setTransactionTypePercentages] = useState({
    moneyTransfers: 0,
    merchantPayments: 0,
    bundles: 0,
    bankTransfers: 0,
    agentTransactions: 0,
    others: 0,
    utilities: 0,
  });

  // Wait for DB to be ready before loading
  useEffect(() => {
    if (db && userPhone) {
      // Longer delay on first load to ensure DB is fully ready, then load stats
      const timer = setTimeout(() => {
        loadStats();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  }, [db, userPhone, period, lastSyncAt]);

  const loadStats = async () => {
    if (!db || !userPhone) {
      setIsLoading(true);
      return;
    }

    try {
      setIsLoading(true);
      
      // Additional check to ensure DB is ready
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
      // Get balance from Users table
      const [userResult] = await db.executeSql(
        'SELECT Amount FROM Users WHERE Phone_Number = ?',
        [userPhone]
      );
      if (userResult.rows.length > 0) {
        const userBalance = userResult.rows.item(0).Amount || 0;
        setBalance(userBalance);
      }

      // Calculate period (weekly or monthly) - all debits
      const now = new Date();
      const startDate = period === 'monthly' 
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get amounts for each transaction type for the period
      const [moneyTransfersSent] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Money_Transfers 
         WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, startDate]
      );
      const [merchantPayments] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Merchant_Payment 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );
      const [bundles] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Bundles 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );
      const [bankTransfersSent] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Bank_Transfers 
         WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?`,
        [userPhone, startDate]
      );
      const [others] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Others 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );
      const [agentTransactions] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Agent_Transactions 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );
      const [utilities] = await db.executeSql(
        `SELECT SUM(Amount) as total FROM Utilities 
         WHERE Phone_Number = ? AND Date >= ?`,
        [userPhone, startDate]
      );

      // Calculate totals for each category individually
      const moneyTransfersTotal = (moneyTransfersSent.rows.item(0)?.total || 0);
      const merchantPaymentsTotal = (merchantPayments.rows.item(0)?.total || 0);
      const bundlesTotal = (bundles.rows.item(0)?.total || 0);
      const bankTransfersTotal = (bankTransfersSent.rows.item(0)?.total || 0);
      const othersTotal = (others.rows.item(0)?.total || 0);
      const agentTransactionsTotal = (agentTransactions.rows.item(0)?.total || 0);
      const utilitiesTotal = (utilities.rows.item(0)?.total || 0);

      const periodDebits =
        moneyTransfersTotal +
        merchantPaymentsTotal +
        bundlesTotal +
        bankTransfersTotal +
        othersTotal +
        agentTransactionsTotal +
        utilitiesTotal;

      setPeriodSpending(periodDebits);

      // Calculate percentages for each transaction type (raw floats)
      if (periodDebits > 0) {
        setTransactionTypePercentages({
          moneyTransfers: (moneyTransfersTotal / periodDebits) * 100,
          merchantPayments: (merchantPaymentsTotal / periodDebits) * 100,
          bundles: (bundlesTotal / periodDebits) * 100,
          bankTransfers: (bankTransfersTotal / periodDebits) * 100,
          agentTransactions: (agentTransactionsTotal / periodDebits) * 100,
          others: (othersTotal / periodDebits) * 100,
          utilities: (utilitiesTotal / periodDebits) * 100,
        });
      } else {
        setTransactionTypePercentages({
          moneyTransfers: 0,
          merchantPayments: 0,
          bundles: 0,
          bankTransfers: 0,
          agentTransactions: 0,
          others: 0,
          utilities: 0,
        });
      }

      // Get data for chart based on period
      if (period === 'weekly') {
        // Weekly: last 7 days
        const weeklyAmounts: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now);
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayStartStr = dayStart.toISOString();
          const dayEndStr = dayEnd.toISOString();

          const [dayDebits] = await db.executeSql(
            `SELECT COALESCE(
              (SELECT SUM(Amount) FROM Money_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Bundles WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Bank_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Others WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT SUM(Amount) FROM Utilities WHERE Phone_Number = ? AND Date >= ? AND Date <= ?), 0) as total`,
            [userPhone, dayStartStr, dayEndStr, userPhone, dayStartStr, dayEndStr, userPhone, dayStartStr, dayEndStr, 
             userPhone, dayStartStr, dayEndStr, userPhone, dayStartStr, dayEndStr, userPhone, dayStartStr, dayEndStr, 
             userPhone, dayStartStr, dayEndStr]
          );
          weeklyAmounts.push(dayDebits.rows.item(0)?.total || 0);
        }
        setWeeklyData(weeklyAmounts);
      } else {
        // Monthly: 4 weeks of the current month
        const monthlyWeekAmounts: number[] = [];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
          const weekStart = new Date(monthStart);
          weekStart.setDate(weekStart.getDate() + weekIndex * 7);
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Don't go beyond current date
          if (weekStart > now) break;
          if (weekEnd > now) weekEnd.setTime(now.getTime());
          
          const weekStartStr = weekStart.toISOString();
          const weekEndStr = weekEnd.toISOString();

          const [weekDebits] = await db.executeSql(
            `SELECT 
              (SELECT COALESCE(SUM(Amount), 0) FROM Money_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Bundles WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Bank_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Others WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) +
              (SELECT COALESCE(SUM(Amount), 0) FROM Utilities WHERE Phone_Number = ? AND Date >= ? AND Date <= ?) as total`,
            [userPhone, weekStartStr, weekEndStr, userPhone, weekStartStr, weekEndStr, userPhone, weekStartStr, weekEndStr, 
             userPhone, weekStartStr, weekEndStr, userPhone, weekStartStr, weekEndStr, userPhone, weekStartStr, weekEndStr, 
             userPhone, weekStartStr, weekEndStr]
          );
          monthlyWeekAmounts.push(weekDebits.rows.item(0)?.total || 0);
        }
        setWeeklyData(monthlyWeekAmounts);
      }

      // Count transactions for the selected period
      const [countResult] = await db.executeSql(
        `SELECT COUNT(*) as count FROM (
          SELECT Transfer_Id FROM Money_Transfers WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transfer_Id FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Bundle_Id FROM Bundles WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transfer_Id FROM Bank_Transfers WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Other_Id FROM Others WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transaction_Id FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transaction_Id FROM Utilities WHERE Phone_Number = ? AND Date >= ?
        )`,
        [userPhone, startDate, userPhone, startDate, userPhone, startDate, userPhone, startDate, 
         userPhone, startDate, userPhone, startDate, userPhone, startDate]
      );
      setTransactionCount(countResult.rows.item(0)?.count || 0);

      // Count sent transactions for the period
      const [sentCountResult] = await db.executeSql(
        `SELECT COUNT(*) as count FROM (
          SELECT Transfer_Id FROM Money_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?
          UNION ALL
          SELECT Transfer_Id FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Bundle_Id FROM Bundles WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transfer_Id FROM Bank_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'sent' AND Date >= ?
          UNION ALL
          SELECT Other_Id FROM Others WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transaction_Id FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ?
          UNION ALL
          SELECT Transaction_Id FROM Utilities WHERE Phone_Number = ? AND Date >= ?
        )`,
        [userPhone, startDate, userPhone, startDate, userPhone, startDate, userPhone, startDate, 
         userPhone, startDate, userPhone, startDate, userPhone, startDate]
      );
      setSentCount(sentCountResult.rows.item(0)?.count || 0);

      // Count received transactions for the period
      const [receivedCountResult] = await db.executeSql(
        `SELECT COUNT(*) as count FROM (
          SELECT Transfer_Id FROM Money_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'received' AND Date >= ?
          UNION ALL
          SELECT Transfer_Id FROM Bank_Transfers WHERE Phone_Number = ? AND Transaction_Type = 'received' AND Date >= ?
        )`,
        [userPhone, startDate, userPhone, startDate]
      );
      setReceivedCount(receivedCountResult.rows.item(0)?.count || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MoMo Press</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>RWF {balance.toLocaleString()}</Text>
        <View style={styles.balanceFooter}>
          <View>
            <Text style={styles.monthlyLabel}>
              {period === 'monthly' ? 'This Month' : 'This Week'}
            </Text>
            <Text style={styles.monthlyAmount}>-RWF {periodSpending.toLocaleString()}</Text>
          </View>
          <View style={styles.mtnBadge}>
            <Text style={styles.mtnText}>MTN MoMo</Text>
          </View>
        </View>
      </View>

      {/* Period Toggle */}
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

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{transactionCount}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sentCount}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{receivedCount}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
      </View>

      {/* Spending Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Spending {period === 'monthly' ? 'This Month' : 'This Week'}
        </Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryChart}>
            {(() => {
              const categories = [
                { key: 'moneyTransfers', color: palette.moneyTransfers },
                { key: 'merchantPayments', color: palette.merchantPayments },
                { key: 'bundles', color: palette.bundles },
                { key: 'bankTransfers', color: palette.bankTransfers },
                { key: 'agentTransactions', color: palette.agentTransactions },
                { key: 'others', color: palette.others },
                { key: 'utilities', color: palette.utilities },
              ];

              return categories.map((cat) => {
                const percentage = (transactionTypePercentages as any)[cat.key] || 0;
                // Show bar only if percentage > 0, otherwise show minimal height
                const barHeight = percentage > 0 ? Math.max((percentage / 100) * 120, 8) : 0;
                return barHeight > 0 ? (
                  <View
                    key={cat.key}
                    style={[styles.chartBar, { height: barHeight, backgroundColor: cat.color }]}
                  />
                ) : null;
              });
            })()}
          </View>
          <View style={styles.summaryLegend}>
            {(() => {
              const categories = [
                { key: 'moneyTransfers', label: 'Money Transfers', color: palette.moneyTransfers },
                { key: 'merchantPayments', label: 'Merchant Payments', color: palette.merchantPayments },
                { key: 'bundles', label: 'Bundles', color: palette.bundles },
                { key: 'bankTransfers', label: 'Bank Transfers', color: palette.bankTransfers },
                { key: 'agentTransactions', label: 'Agents', color: palette.agentTransactions },
                { key: 'others', label: 'Others', color: palette.others },
                { key: 'utilities', label: 'Utilities', color: palette.utilities },
              ];

              return categories.map((cat) => {
                const raw = (transactionTypePercentages as any)[cat.key] || 0;
                // show category only when there's any non-zero contribution
                if (!(raw > 0)) return null;
                const display = raw >= 1 ? `${Math.round(raw)}%` : `${raw.toFixed(2)}%`;
                return (
                  <View key={cat.key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.legendText}>{cat.label} {display}</Text>
                  </View>
                );
              });
            })()}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceCard: {
    backgroundColor: '#FBBF24',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: 4,
  },
  monthlyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  mtnBadge: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mtnText: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 100,
  },
  chartBar: {
    width: 24,
    height: 40,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
  },
  summaryLegend: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
  },
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
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
});

