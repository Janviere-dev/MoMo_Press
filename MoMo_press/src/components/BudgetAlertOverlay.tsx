import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BudgetAlert {
  category: string;
  exceeded: number;
}

interface BudgetAlertOverlayProps {
  alerts: BudgetAlert[];
  visible: boolean;
  onClose: () => void;
}

export default function BudgetAlertOverlay({ alerts, visible, onClose }: BudgetAlertOverlayProps) {
  if (!visible || alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.alertContainer} pointerEvents="box-only">
        <View style={styles.alertContent}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertTextContainer}>
            {alerts.map((alert, index) => (
              <Text key={index} style={styles.alertText}>
                {alert.category} budget exceeded by {alert.exceeded.toLocaleString()} RWF
              </Text>
            ))}
          </View>
        </View>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  alertContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  alertIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 4,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: 'bold',
  },
});