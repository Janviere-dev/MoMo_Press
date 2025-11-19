import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { getDBConnection, initDatabase } from './src/database/database';
import { parseMomoMessage } from './src/utils/parseMomoMessage';
import { saveAsXML } from './src/xmlProcessor';
import SQLite from 'react-native-sqlite-storage';

export default function App() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    requestSMSPermission();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database and tables
      await initDatabase();
      const database = await getDBConnection();
      setDb(database);

      // Check if a user exists
      const [results] = await database.executeSql('SELECT * FROM Users LIMIT 1;');
      if (results.rows.length > 0) {
        setUserExists(true);
      }
    } catch (error) {
      console.error('DB init error:', error);
    }
  };

  const createUser = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone number and password.');
      return;
    }
    if (!db) return;

    try {
      await db.executeSql(
        'INSERT INTO Users (Phone_Number, Name, Password) VALUES (?, ?, ?);',
        [phone, '', password]
      );
      setUserExists(true);
      Alert.alert('Success', 'User created successfully!');
      readMMoneyMessages();
    } catch (error) {
      console.error('Create user error:', error);
      Alert.alert('Error', 'Failed to create user.');
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

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          readMMoneyMessages();
        } else {
          Alert.alert('Permission denied', 'Cannot read SMS messages.');
        }
      } else {
        Alert.alert('Unsupported', 'SMS reading is only supported on Android.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const readMMoneyMessages = () => {
    if (!db) return;

    SmsAndroid.list(
      JSON.stringify({
        box: 'inbox',
        minDate: 0,
        maxDate: Date.now(),
        bodyRegex: '.*',
      }),
      fail => console.log('Failed to fetch SMS:', fail),
      async (count, smsList) => {
        const messages = JSON.parse(smsList);

        const mMoneyMessages = messages.filter(
          (m: { address: string; body: string }) => m.address === 'M-Money'
        );

        // saveAsXML(mMoneyMessages.map((m: { body: string }) => m.body));

        const parsedMessages = mMoneyMessages.map((m: { body: string }) =>
          parseMomoMessage(m.body, phone)
        );

        for (const msg of parsedMessages) {
          const table = msg.table;
          const columns = Object.keys(msg.data).join(', ');
          const placeholders = Object.keys(msg.data).map(() => '?').join(', ');
          const values = Object.values(msg.data);
          await db.executeSql(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values);
        }

        Alert.alert('Done', `${parsedMessages.length} M-Money messages saved to DB.`);
        }
      );
    };

  if (!userExists) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Enter User Details</Text>
        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={{ borderBottomWidth: 1, marginBottom: 10 }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderBottomWidth: 1, marginBottom: 10 }}
        />
        <Button title="Create User" onPress={createUser} />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>M-Money SMS Reader</Text>
      <Text>Reading all messages from M-Money and saving to DB/XML...</Text>
      <Button title="Grant SMS Permission" onPress={requestSMSPermission} />
    </View>
  );
}
