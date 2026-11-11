import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { saveConsentStatus } from '../consent/consentManager';

interface ConsentScreenProps {
  onConsentAccepted: () => void;
  onConsentDeclined: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  onConsentAccepted,
  onConsentDeclined,
}) => {
  const handleAccept = async () => {
    await saveConsentStatus('accepted');
    onConsentAccepted();
  };

  const handleDecline = async () => {
    await saveConsentStatus('declined');
    onConsentDeclined();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Repose</Text>
        <Text style={styles.title}>Camera Consent & Privacy</Text>
        <Text style={styles.subtitle}>
          Please review how Steady uses your camera and handles your data
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Core Principles */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>1. WHEN THE CAMERA IS USED</Text>
          <Text style={styles.cardBody}>
            The camera operates <Text style={styles.bold}>ONLY</Text> during an
            active sensing session:
          </Text>
          <Text style={styles.bulletPoint}>
            • During initial 30-second baseline calibration.
          </Text>
          <Text style={styles.bulletPoint}>
            • While an active morning alarm is ringing in the foreground.
          </Text>
          <Text style={styles.bulletPoint}>
            • While actively resting between workout sets in Training mode.
          </Text>
          <Text style={styles.cardBody}>
            The camera <Text style={styles.bold}>NEVER</Text> runs in the
            background or while your phone screen is locked. A prominent red
            "CAMERA ON" badge is always displayed when the camera is active.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>2. WHAT SIGNALS ARE MEASURED</Text>
          <Text style={styles.cardBody}>
            Using the Presage SmartSpectra SDK, your front camera measures subtle
            optical color fluctuations on skin (pulse rate in BPM) and chest/facial
            respiratory micro-motions (breathing rate in breaths/min).
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>
            3. ON-DEVICE PROCESSING VS. SDK TELEMETRY
          </Text>
          <Text style={styles.cardBody}>
            <Text style={styles.bold}>• 100% Local Video Processing:</Text> Raw
            video frames, facial landmarks, and biometric signals are processed
            entirely on your device's neural engine. No video frames or biometric
            waveforms are ever transmitted to any server or cloud service.
          </Text>
          <Text style={styles.cardBody}>
            <Text style={styles.bold}>• Presage SDK Diagnostic Telemetry:</Text>{' '}
            The SmartSpectra SDK sends a single, aggregate diagnostic summary
            once per session to Presage's servers to evaluate software stability.
            This summary contains only technical metadata (SDK version, commit
            hash, platform type, session success/fail status). It does not contain
            any personal identity or biometric data.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>4. WELLNESS & REGULATORY STATUS</Text>
          <Text style={styles.cardBody}>
            Steady is intended strictly for personal wellness, biofeedback, and
            timer convenience. It does not diagnose, treat, prevent, or mitigate
            any disease or medical condition, and does not provide medical
            advice.
          </Text>
          <Text style={styles.cardBody}>
            <Text style={styles.bold}>• Self-Use Only:</Text> Steady is designed
            strictly for personal self-use and includes no tools for monitoring
            third parties.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>5. HOW TO DELETE ALL DATA</Text>
          <Text style={styles.cardBody}>
            All workout records, calibration baselines, and preferences are saved
            exclusively in your phone's local storage. You can permanently wipe
            all stored records at any time by pressing "Delete All My Data" in
            Settings.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            accessibilityLabel="Accept consent and enable camera"
          >
            <Text style={styles.acceptButtonText}>
              I CONSENT & ENABLE CAMERA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            accessibilityLabel="Decline camera access and use camera-free mode"
          >
            <Text style={styles.declineButtonText}>
              Decline (Use Camera-Free Mode)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Persistent Disclaimer */}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  appName: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardBody: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  bulletPoint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    marginBottom: 4,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  declineButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  declineButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
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
