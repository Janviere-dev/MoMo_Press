import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

interface SendMoneyScreenProps {
  onSuccess?: () => void;
}

export default function SendMoneyScreen({ onSuccess }: SendMoneyScreenProps) {
  const [isPhone, setIsPhone] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const makeUssd = (isPhoneNumber: boolean, recipientVal: string, amountVal: string) => {
    // For phone transfers: *182*1*1*number*amount#
    // For merchant payments: *182*8*1*code*amount#
    if (!recipientVal || !amountVal) return null;
    const sanitizedRecipient = recipientVal.replace(/\s+/g, '');
    const sanitizedAmount = amountVal.replace(/[^0-9]/g, '');
    let code = '';
    if (isPhoneNumber) {
      code = `*182*1*1*${sanitizedRecipient}*${sanitizedAmount}#`;
    } else {
      code = `*182*8*1*${sanitizedRecipient}*${sanitizedAmount}#`;
    }
    // Encode hash for tel: URL
    return encodeURIComponent(code);
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Validation', 'Please enter recipient and amount');
      return;
    }

    const ussdEncoded = makeUssd(isPhone, recipient, amount);
    if (!ussdEncoded) return;

    const url = `tel:${ussdEncoded}`;
    try {
      // On Android request CALL_PHONE permission first so the app can place the call without extra confirmation
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'Call Permission',
            message: 'This app needs permission to place calls to perform USSD transactions.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot place calls without permission.');
          return;
        }
      }

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', 'Unable to open dialer for USSD code');
      }
    } catch (e) {
      console.error('Error dialing USSD', e);
      Alert.alert('Error', 'Failed to initiate transaction');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Money</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => setIsPhone(true)}
          style={[styles.toggleButton, isPhone && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, isPhone && styles.toggleTextActive]}>Phone Number</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsPhone(false)}
          style={[styles.toggleButton, !isPhone && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, !isPhone && styles.toggleTextActive]}>Merchant Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{isPhone ? 'Phone Number' : 'Merchant Code'}</Text>
        <TextInput
          value={recipient}
          onChangeText={setRecipient}
          placeholder={isPhone ? '078XXXXXXXX' : 'Enter merchant code'}
          style={styles.input}
          keyboardType={isPhone ? 'phone-pad' : 'default'}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount (RWF)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          style={styles.input}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.quickRow}>
        {quickAmounts.map((q) => (
          <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={styles.quickBtn}>
            <Text style={styles.quickTxt}>{q.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
        <Text style={styles.sendTxt}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FEF3C7' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: '#FBBF24' },
  toggleText: { color: '#4B5563', fontWeight: '600' },
  toggleTextActive: { color: '#1F2937' },
  inputGroup: { marginBottom: 12 },
  label: { color: '#6B7280', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 16 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: 6 },
  quickBtn: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  quickTxt: { color: '#374151' },
  sendBtn: { backgroundColor: '#FBBF24', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sendTxt: { color: '#1F2937', fontWeight: '700' },
});