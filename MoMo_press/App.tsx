import React, { useEffect, useState, useRef } from 'react';
import type { AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Alert, PermissionsAndroid, Platform, StyleSheet, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmsAndroid from 'react-native-get-sms-android';
import SQLite from 'react-native-sqlite-storage';
import { getDBConnection, initDatabase } from './src/database/database';
import { parseMomoMessage } from './src/utils/parseMomoMessage';
import { extractBalance } from './src/utils/extractBalance';
import { checkBudgetLimits, BudgetAlert } from './src/utils/budgetUtils';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen, { OnboardingSettings } from './src/screens/OnboardingScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import SpendingScreen from './src/screens/SpendingScreen';
import SendMoneyScreen from './src/screens/SendMoneyScreen';
import BudgetAlertOverlay from './src/components/BudgetAlertOverlay';
import SettingsSheet from './src/components/SettingsSheet';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

interface User {
  phone: string;
  name: string;
}

export default function App() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingSettings, setOnboardingSettings] = useState<OnboardingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isSyncing = useRef(false);
  // AppState listener for auto-sync on resume
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !isSyncing.current
      ) {
        // App has come to foreground, trigger incremental sync
        await readMMoneyMessages(true);
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [db, user, lastSyncAt]);

  useEffect(() => {
    initializeApp();
  }, []);

  // Check budget limits when app fully loads (after user and db are ready)
  useEffect(() => {
    if (db && user && onboardingComplete) {
      checkAndSetBudgetAlerts();
    }
  }, [db, user, onboardingComplete]);

  // Show alert whenever new alerts are detected
  useEffect(() => {
    if (budgetAlerts.length > 0) {
      setShowBudgetAlert(true);
      console.log('Alerts detected, showing overlay:', budgetAlerts);
    }
  }, [budgetAlerts]);

  const checkAndSetBudgetAlerts = async () => {
    if (!db || !user) return;
    try {
      const alerts = await checkBudgetLimits(db, user.phone);
      console.log('Budget alerts checked:', alerts);
      setBudgetAlerts(alerts);
      // Setting budgetAlerts will trigger the useEffect that shows the alert
      if (alerts.length > 0) {
        console.log('Budget alerts found, will be displayed');
      } else {
        console.log('No budget alerts');
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  };

  const initializeApp = async () => {
    try {
      await initDatabase();
      const database = await getDBConnection();
      setDb(database);

      // Load last sync timestamp from storage
      try {
        const last = await AsyncStorage.getItem('@momo:lastSync');
        if (last) setLastSyncAt(Number(last));
      } catch (e) {
        console.log('Failed to read last sync time:', e);
      }

      // Wait a bit to ensure DB is fully ready
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

      // Check if a user exists
      try {
        const [results] = await database.executeSql('SELECT * FROM Users LIMIT 1;');
        if (results.rows.length > 0) {
          const userRow = results.rows.item(0);
          const userData = {
            phone: userRow.Phone_Number,
            name: userRow.Name || '',
          };
          setUser(userData);

          // Check onboarding status (stored in Settings table)
          try {
            const [settingsResults] = await database.executeSql(
              'SELECT * FROM Settings WHERE Phone_Number = ? LIMIT 1;',
              [userRow.Phone_Number]
            );
            if (settingsResults.rows.length > 0) {
              setOnboardingComplete(true);
            } else {
              setOnboardingComplete(false);
            }
          } catch (settingsError) {
            console.log('Settings check error (may not exist yet):', settingsError);
            setOnboardingComplete(false);
          }
        }
      } catch (queryError) {
        console.error('Error querying users:', queryError);
      }
    } catch (error) {
      console.error('App initialization error:', error);
      Alert.alert('Error', 'Failed to initialize app. Please restart.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (phone: string, password: string) => {
    if (!db) return;

    try {
      // Check if user exists
      const [results] = await db.executeSql(
        'SELECT * FROM Users WHERE Phone_Number = ? AND Password = ?;',
        [phone, password]
      );

      if (results.rows.length > 0) {
        const userRow = results.rows.item(0);
        setUser({
          phone: userRow.Phone_Number,
          name: userRow.Name || '',
        });

        // Check onboarding status
        const [settingsResults] = await db.executeSql(
          'SELECT * FROM Settings WHERE Phone_Number = ? LIMIT 1;',
          [phone]
        );
        setOnboardingComplete(settingsResults.rows.length > 0);

        // Request SMS permission
        await requestSMSPermission();
      } else {
        // Create new user
        await db.executeSql(
          'INSERT INTO Users (Phone_Number, Name, Password) VALUES (?, ?, ?);',
          [phone, '', password]
        );
        setUser({ phone, name: '' });
        setOnboardingComplete(false);
        await requestSMSPermission();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  const handleOnboardingComplete = async (settings: OnboardingSettings) => {
    if (!db || !user) return;

    try {
      // Save onboarding settings to Settings table with all fields
      await db.executeSql(
        `INSERT OR REPLACE INTO Settings (
          Settings_Id, Phone_Number, General_Spending_Limit, Money_Transfer_Limit,
          Bank_Transfer_Limit, Merchant_Limit, Bundles_Limit, Utilities_Limit,
          Agent_Limit, Others_Limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          `SETTINGS-${user.phone}`,
          user.phone,
          settings.monthlyLimit,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ]
      );

      setOnboardingSettings(settings);
      setOnboardingComplete(true);

      // Wait a bit to ensure settings are saved before reading messages
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 200));

      // Request required permissions on onboarding and then read M-Money messages
      await requestAllPermissions();
      
      // Check for budget alerts after onboarding
      checkAndSetBudgetAlerts();
      
      // Initial sync after onboarding (full sync, not incremental)
      await readMMoneyMessages(false);
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const requestAllPermissions = async () => {
    try {
      if (Platform.OS !== 'android') {
        return;
      }

      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const grantedAll = Object.values(results).every(
        (value) => value === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!grantedAll) {
        Alert.alert('Permissions required', 'Some features may not work without the requested permissions. You can enable them in system settings.');
      }
    } catch (err) {
      console.warn('Permission request error', err);
    }
  };

  const requestSMSPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs access to your SMS to read M-Money messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot read SMS messages without permission.');
        }
      } else {
        Alert.alert('Unsupported', 'SMS reading is only supported on Android.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  /**
   * Reads M-Money messages from SMS inbox and inserts new ones into the DB.
   * If incremental is true, only fetches messages since lastSyncAt.
   * Updates lastSyncAt in AsyncStorage and state if new messages are found.
   * Uses isSyncing flag to prevent concurrent syncs.
   */
  const readMMoneyMessages = async (incremental: boolean = false) => {
    if (!db || !user) return;
    if (isSyncing.current) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    isSyncing.current = true;
    try {
      // Use lastSyncAt for incremental sync
      let minDate = 0;
      if (incremental && lastSyncAt) {
        minDate = lastSyncAt + 1; // avoid reprocessing last message
      }

      SmsAndroid.list(
        JSON.stringify({
          box: 'inbox',
          minDate,
          maxDate: Date.now(),
          bodyRegex: '.*',
        }),
        (fail) => {
          console.log('Failed to fetch SMS:', fail);
          isSyncing.current = false;
        },
        async (count, smsList) => {
          try {
            const messages = JSON.parse(smsList);
            const mMoneyMessages = messages.filter(
              (m: { address: string; body: string }) => m.address === 'M-Money'
            );

            // Extract balance from messages (check all messages, use the latest one with balance)
            let latestBalance: number | null = null;
            for (const msg of mMoneyMessages) {
              const balance = extractBalance(msg.body);
              if (balance !== null) {
                latestBalance = balance;
                break;
              }
            }
            if (latestBalance !== null) {
              try {
                await db.executeSql(
                  'UPDATE Users SET Amount = ? WHERE Phone_Number = ?',
                  [latestBalance, user.phone]
                );
                console.log(`Updated user balance to: ${latestBalance}`);
              } catch (error) {
                console.error('Error updating user balance:', error);
              }
            }

            // Parse and insert new messages using SMS body hash as unique key
            let insertedCount = 0;
            let maxMsgDate = minDate;
            for (const m of mMoneyMessages) {
              // Use message date for incremental sync
              let msgDate = Date.now();
              if (m.date) {
                msgDate = typeof m.date === 'number' ? m.date : Date.parse(m.date);
              }
              if (msgDate > maxMsgDate) maxMsgDate = msgDate;

              const parsed = parseMomoMessage(m.body, user.phone);
              try {
                const table = parsed.table;
                const columns = Object.keys(parsed.data).join(', ');
                const placeholders = Object.keys(parsed.data).map(() => '?').join(', ');
                const values = Object.values(parsed.data);
                await db.executeSql(
                  `INSERT OR IGNORE INTO ${table} (${columns}) VALUES (${placeholders})`,
                  values
                );
                insertedCount++;
              } catch (error) {
                console.log('Skipping duplicate or error:', error);
              }
            }

            if (insertedCount > 0) {
              // Update lastSyncAt in AsyncStorage and state
              await AsyncStorage.setItem('@momo:lastSync', String(maxMsgDate));
              setLastSyncAt(maxMsgDate);
              console.log(`Synced ${insertedCount} new transaction(s)`);
              Alert.alert('Success', `${insertedCount} new M-Money message(s) saved.`);
            } else if (!incremental) {
              // On full sync, set lastSyncAt to now even if no new messages
              await AsyncStorage.setItem('@momo:lastSync', String(Date.now()));
              setLastSyncAt(Date.now());
              console.log('Sync complete, no new messages');
            }

            // Always check budget limits after reading messages
            await checkAndSetBudgetAlerts();
          } catch (error) {
            console.error('Error processing messages:', error);
          } finally {
            isSyncing.current = false;
          }
        }
      );
    } catch (error) {
      console.error('Error in readMMoneyMessages:', error);
      isSyncing.current = false;
    }
  };

  // Main Tab Navigator
  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FBBF24',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      >
        {({ navigation }) => (
            <OverviewScreen
              onSendMoney={() => navigation.navigate('SendMoney')}
              db={db}
              userPhone={user?.phone || ''}
              period={period}
              onPeriodChange={setPeriod}
              lastSyncAt={lastSyncAt}
            />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="SendMoney"
        options={{
          tabBarLabel: 'Send',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💸</Text>,
        }}
      >
        {() => (
          <SendMoneyScreen onSuccess={() => Alert.alert('Dialer opened')} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Spending"
        options={{
          tabBarLabel: 'Spending',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      >
        {() => (
            <SpendingScreen db={db} userPhone={user?.phone || ''} period={period} onPeriodChange={setPeriod} lastSyncAt={lastSyncAt} />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Transactions"
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      >
        {() => (
            <TransactionsScreen
              db={db}
              userPhone={user?.phone || ''}
              period={period}
              onPeriodChange={setPeriod}
              lastSyncAt={lastSyncAt}
            />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      >
        {() => (
          <SettingsSheet
            db={db}
            userPhone={user?.phone || ''}
            onSave={checkAndSetBudgetAlerts}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );

  // Main render with alert overlay
  const renderMainApp = () => (
    <View style={styles.mainContainer}>
      <MainTabs />
      <BudgetAlertOverlay
        alerts={budgetAlerts}
        visible={showBudgetAlert && budgetAlerts.length > 0}
        onClose={() => setShowBudgetAlert(false)}
      />
    </View>
  );

  // Don't render navigation until we've checked for existing user
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={handleLogin} />}
          </Stack.Screen>
        ) : !onboardingComplete ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {() => renderMainApp()}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  settingsContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FEF3C7',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingsText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
});
