import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  recipient?: string;
  phone?: string;
  amount: number;
  category: string;
  date: string;
  table: string;
}

interface TransactionsScreenProps {
  db: SQLite.SQLiteDatabase | null;
  userPhone: string;
  period: 'weekly' | 'monthly';
  onPeriodChange: (period: 'weekly' | 'monthly') => void;
  lastSyncAt?: number | null;
}

export default function TransactionsScreen({
  db,
  userPhone,
  period,
  onPeriodChange,
  lastSyncAt,
}: TransactionsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (db && userPhone) {
      loadTransactions();
    }
  }, [db, userPhone, period, lastSyncAt]);

  const loadTransactions = async () => {
    if (!db || !userPhone) {
      setIsLoading(true);
      return;
    }

    try {
      setIsLoading(true);
      const allTransactions: Transaction[] = [];

      // Calculate period start date
      const now = new Date();
      const startDate =
        period === 'monthly'
          ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Load Money Transfers (filtered by period)
      const [moneyTransfers] = await db.executeSql(
        'SELECT * FROM Money_Transfers WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < moneyTransfers.rows.length; i++) {
        const row = moneyTransfers.rows.item(i);
        allTransactions.push({
          id: row.Transfer_Id,
          type: row.Transaction_Type,
          recipient: row.Recipient_Name,
          phone: row.Recipient_Phone,
          amount: row.Amount,
          category: 'Transfer',
          date: row.Date,
          table: 'Money_Transfers',
        });
      }

      // Load Merchant Payments (filtered by period)
      const [merchantPayments] = await db.executeSql(
        'SELECT * FROM Merchant_Payment WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < merchantPayments.rows.length; i++) {
        const row = merchantPayments.rows.item(i);
        allTransactions.push({
          id: row.Transfer_Id,
          type: 'sent',
          recipient: row.Recipient_Name,
          phone: row.Recipient_Code,
          amount: row.Amount,
          category: 'Merchant',
          date: row.Date,
          table: 'Merchant_Payment',
        });
      }

      // Load Bundles (filtered by period)
      const [bundles] = await db.executeSql(
        'SELECT * FROM Bundles WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < bundles.rows.length; i++) {
        const row = bundles.rows.item(i);
        allTransactions.push({
          id: row.Bundle_Id,
          type: 'sent',
          recipient: row.Bundle_Type === 'DATA' ? 'MTN Data' : 'MTN Airtime',
          amount: row.Amount,
          category: row.Bundle_Type === 'DATA' ? 'Data' : 'Airtime',
          date: row.Date,
          table: 'Bundles',
        });
      }

      // Load Bank Transfers (filtered by period)
      const [bankTransfers] = await db.executeSql(
        'SELECT * FROM Bank_Transfers WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < bankTransfers.rows.length; i++) {
        const row = bankTransfers.rows.item(i);
        allTransactions.push({
          id: row.Transfer_Id,
          type: row.Transaction_Type,
          recipient: 'Bank Transfer',
          amount: row.Amount,
          category: 'Bank',
          date: row.Date,
          table: 'Bank_Transfers',
        });
      }

      // Load Others (filtered by period)
      const [others] = await db.executeSql(
        'SELECT * FROM Others WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < others.rows.length; i++) {
        const row = others.rows.item(i);
        allTransactions.push({
          id: row.Other_Id,
          type: 'sent',
          recipient: row.Name || 'Other',
          amount: row.Amount,
          category: 'Other',
          date: row.Date,
          table: 'Others',
        });
      }

      // Load Agent Transactions (filtered by period)
      const [agentTransactions] = await db.executeSql(
        'SELECT * FROM Agent_Transactions WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < agentTransactions.rows.length; i++) {
        const row = agentTransactions.rows.item(i);
        allTransactions.push({
          id: row.Transaction_Id,
          type: 'sent',
          recipient: row.Agent_Name || 'Agent',
          amount: row.Amount,
          category: 'Agent',
          date: row.Date,
          table: 'Agent_Transactions',
        });
      }

      // Load Utilities (filtered by period)
      const [utilities] = await db.executeSql(
        'SELECT * FROM Utilities WHERE Phone_Number = ? AND Date >= ? ORDER BY Date DESC LIMIT 100',
        [userPhone, startDate]
      );
      for (let i = 0; i < utilities.rows.length; i++) {
        const row = utilities.rows.item(i);
        allTransactions.push({
          id: row.Transaction_Id,
          type: 'sent',
          recipient: row.Name,
          amount: row.Amount,
          category: 'Utility',
          date: row.Date,
          table: 'Utilities',
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate totals correctly:
      // CREDITS = Money_Transfers (received) + Bank_Transfers (received)
      // DEBITS = All other transactions (sent)
      const received = allTransactions
        .filter((t) => t.type === 'received')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // All sent transactions are debits
      const sent = allTransactions
        .filter((t) => t.type === 'sent')
        .reduce((sum, t) => sum + t.amount, 0);

      setReceivedTotal(received);
      setSentTotal(sent);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Airtime':
      case 'Data':
        return '📱';
      case 'Utility':
        return '⚡';
      case 'Merchant':
        return '🛒';
      case 'Bank':
        return '🏦';
      case 'Agent':
        return '🏪';
      case 'Other':
        return '📋';
      default:
        return '💸';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isReceived = item.type === 'received';

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View style={[styles.iconContainer, isReceived ? styles.iconReceived : styles.iconSent]}>
              <Text style={styles.iconText}>
                {isReceived ? '↓' : getCategoryIcon(item.category)}
              </Text>
            </View>
            <View style={styles.recipientInfoContainer}>
              <Text style={styles.recipientName} numberOfLines={2} ellipsizeMode="tail">
                {item.recipient || 'Unknown'}
              </Text>
              {item.phone && <Text style={styles.phoneNumber}>{item.phone}</Text>}
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.amount, isReceived && styles.amountReceived]}>
              {isReceived ? '+' : '-'}RWF {item.amount.toLocaleString()}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>
            {period === 'monthly' ? 'This Month' : 'This Week'}
          </Text>
        </View>
      </View>

      {/* Period Toggle */}
      <View style={styles.periodToggleContainer}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}
          onPress={() => onPeriodChange('weekly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'weekly' && styles.periodButtonTextActive,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}
          onPress={() => onPeriodChange('monthly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'monthly' && styles.periodButtonTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Text style={styles.summaryIcon}>↓</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={styles.summaryAmount}>RWF {receivedTotal.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.summaryIcon, { color: '#DC2626' }]}>↑</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Sent</Text>
            <Text style={styles.summaryAmount}>RWF {sentTotal.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  searchIcon: {
    fontSize: 18,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 20,
    color: '#059669',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  recipientInfoContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconReceived: {
    backgroundColor: '#D1FAE5',
  },
  iconSent: {
    backgroundColor: '#FEE2E2',
  },
  iconText: {
    fontSize: 20,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  transactionRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
  },
  phoneNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  amountReceived: {
    color: '#059669',
  },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  periodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 24,
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
