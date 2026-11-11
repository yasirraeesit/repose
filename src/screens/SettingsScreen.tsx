import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import {
  getConsentStatus,
  saveConsentStatus,
  deleteAllUserData,
  ConsentStatus,
} from '../consent/consentManager';
import { loadBaseline } from '../signals/baselineCalibration';
import { BaselineMetrics } from '../signals/types';
import { SimulatedSignal } from '../signals/simulatedSignal';

interface SettingsScreenProps {
  onBack?: () => void;
  onNavigateCalibration?: () => void;
  onDataDeleted?: () => void;
  onReviewConsent?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onNavigateCalibration,
  onDataDeleted,
  onReviewConsent,
}) => {
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [isSimEnabled, setIsSimEnabled] = useState(SimulatedSignal.isEnabled());

  useEffect(() => {
    getConsentStatus().then(setConsent);
    loadBaseline().then(setBaseline);
  }, []);

  const handleToggleSimulation = (val: boolean) => {
    if (!__DEV__) return;
    SimulatedSignal.setEnabled(val);
    setIsSimEnabled(val);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All My Data',
      'This will permanently delete your baseline calibration vitals, workout session logs, alarm settings, and reset your consent preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAllUserData();
            Alert.alert(
              'Data Deleted',
              'All personal records have been completely wiped from local storage.'
            );
            if (onDataDeleted) {
              onDataDeleted();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Settings & Privacy</Text>
          <Text style={styles.subtitle}>
            Control your camera permissions and local data
          </Text>
        </View>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Camera Permission & Consent Status */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CAMERA ACCESS & CONSENT</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View
              style={[
                styles.consentBadge,
                consent === 'accepted'
                  ? styles.consentBadgeAccepted
                  : styles.consentBadgeDeclined,
              ]}
            >
              <Text
                style={[
                  styles.consentBadgeText,
                  consent === 'accepted'
                    ? styles.consentTextAccepted
                    : styles.consentTextDeclined,
                ]}
              >
                {consent === 'accepted' ? 'CONSENTED' : 'CAMERA DECLINED'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Camera is only ever activated during an active calibration, alarm,
            or workout rest period.
          </Text>

          {onReviewConsent && (
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={onReviewConsent}
            >
              <Text style={styles.actionBtnOutlineText}>
                Review Full Privacy Disclosures
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Baseline Status */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PERSONAL BASELINE VITALS</Text>
          {baseline ? (
            <View style={styles.baselinePreview}>
              <View style={styles.baselineItem}>
                <Text style={styles.baselineSub}>Resting Pulse</Text>
                <Text style={styles.baselineNum}>
                  {baseline.baselinePulse} BPM
                </Text>
              </View>
              <View style={styles.baselineItem}>
                <Text style={styles.baselineSub}>Resting Breathing</Text>
                <Text style={styles.baselineNum}>
                  {baseline.baselineBreathing} BR/M
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.notCalibratedText}>
              No baseline calibrated yet.
            </Text>
          )}

          {onNavigateCalibration && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onNavigateCalibration}
            >
              <Text style={styles.actionBtnText}>
                {baseline ? 'RE-CALIBRATE BASELINE' : 'CALIBRATE BASELINE NOW'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dev Tools (Dev Only) */}
        {__DEV__ && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DEVELOPMENT SIMULATION</Text>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.statusTitle}>Simulated Signal Provider</Text>
                <Text style={styles.cardDescription}>
                  For local UI/unit testing without camera (Dev only)
                </Text>
              </View>
              <Switch
                value={isSimEnabled}
                onValueChange={handleToggleSimulation}
                trackColor={{ false: '#334155', true: '#d97706' }}
              />
            </View>
          </View>
        )}

        {/* Storage & Privacy Summary */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DATA STORAGE & PRIVACY</Text>
          <Text style={styles.privacyBullet}>
            🔒 <Text style={styles.bold}>Zero Cloud Biometrics:</Text> All video
            frames and biometrics remain 100% on your device.
          </Text>
          <Text style={styles.privacyBullet}>
            📊 <Text style={styles.bold}>Local-Only Records:</Text> Sessions and
            baselines are saved exclusively in device SQLite/AsyncStorage.
          </Text>
          <Text style={styles.privacyBullet}>
            📡 <Text style={styles.bold}>SDK Diagnostic Telemetry:</Text> Presage
            receives one non-identifiable technical packet per session (SDK
            build version, platform, success status) with zero biometrics.
          </Text>
        </View>

        {/* Delete All Data Button */}
        <View style={styles.deleteSection}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAll}
            accessibilityLabel="Delete all user data permanently"
          >
            <Text style={styles.deleteButtonText}>DELETE ALL MY DATA</Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            Permanently removes your baseline, workout history, and preferences.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Steady is for wellness and convenience only. It does not diagnose,
            treat, or give medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  consentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consentBadgeAccepted: {
    backgroundColor: '#065f46',
  },
  consentBadgeDeclined: {
    backgroundColor: '#7f1d1d',
  },
  consentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  consentTextAccepted: {
    color: '#a7f3d0',
  },
  consentTextDeclined: {
    color: '#fecaca',
  },
  cardDescription: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  actionBtnOutline: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  baselinePreview: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
  },
  baselineItem: {
    flex: 1,
    alignItems: 'center',
  },
  baselineSub: {
    color: '#64748b',
    fontSize: 11,
  },
  baselineNum: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  notCalibratedText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  actionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyBullet: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteSection: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#991b1b',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deleteWarning: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  disclaimerBox: {
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});

