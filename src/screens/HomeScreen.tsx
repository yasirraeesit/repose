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
import { BaselineMetrics } from '../signals/types';
import { ConsentStatus } from '../consent/consentManager';

interface HomeScreenProps {
  baseline: BaselineMetrics | null;
  consent: ConsentStatus;
  onSelectMode: (
    mode: 'morning' | 'training' | 'calibration' | 'history' | 'debug' | 'settings'
  ) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  baseline,
  consent,
  onSelectMode,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Repose</Text>
          <Text style={styles.brandTagline}>Timers that wait for your body</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => onSelectMode('settings')}
          accessibilityLabel="Open settings and privacy"
        >
          <Text style={styles.settingsIconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Baseline & Camera Status Bar */}
        <View style={styles.statusBarRow}>
          <TouchableOpacity
            style={styles.statusPill}
            onPress={() => onSelectMode('calibration')}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: baseline ? '#10b981' : '#f59e0b' },
              ]}
            />
            <Text style={styles.statusPillText}>
              {baseline
                ? `Baseline: ${baseline.baselinePulse} BPM`
                : 'Calibrate Baseline'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusPill}
            onPress={() => onSelectMode('settings')}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: consent === 'accepted' ? '#10b981' : '#ef4444' },
              ]}
            />
            <Text style={styles.statusPillText}>
              {consent === 'accepted' ? 'Camera Ready' : 'Camera Declined'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode 1: Morning Calm Alarm Card */}
        <TouchableOpacity
          style={[styles.modeCard, styles.morningCard]}
          onPress={() => onSelectMode('morning')}
          accessibilityLabel="Launch Morning Calm Alarm mode"
        >
          <View style={styles.modeCardTop}>
            <View style={styles.modeTagContainer}>
              <Text style={styles.morningTag}>MORNING MODE</Text>
            </View>
            <Text style={styles.modeIcon}>🌅</Text>
          </View>
          <Text style={styles.modeTitle}>Calm Alarm</Text>
          <Text style={styles.modeDescription}>
            The alarm cannot be silenced or snoozed until your live breathing
            rate has remained steady and slow for 30 continuous seconds. Start your
            day with physiological regulation.
          </Text>
          <View style={styles.modeFooter}>
            <Text style={styles.modeMechanic}>Breathing Settle Gate</Text>
            <Text style={styles.modeArrow}>OPEN ALARM →</Text>
          </View>
        </TouchableOpacity>

        {/* Mode 2: Training Rest Until Ready Card */}
        <TouchableOpacity
          style={[styles.modeCard, styles.trainingCard]}
          onPress={() => onSelectMode('training')}
          accessibilityLabel="Launch Training Rest Until Ready mode"
        >
          <View style={styles.modeCardTop}>
            <View style={styles.modeTagContainer}>
              <Text style={styles.trainingTag}>TRAINING MODE</Text>
            </View>
            <Text style={styles.modeIcon}>⚡</Text>
          </View>
          <Text style={styles.modeTitle}>Rest Until Ready</Text>
          <Text style={styles.modeDescription}>
            Gym rest timer that finishes only when your live pulse returns to within
            margin of your own calibrated baseline—not an arbitrary fixed clock.
            Logs recovery time for every set.
          </Text>
          <View style={styles.modeFooter}>
            <Text style={styles.modeMechanic}>Pulse Settle Gate</Text>
            <Text style={styles.modeArrow}>START REST TIMER →</Text>
          </View>
        </TouchableOpacity>

        {/* Secondary Navigation Row */}
        <View style={styles.secondaryGrid}>
          {/* Workout History */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => onSelectMode('history')}
            accessibilityLabel="View recovery history"
          >
            <Text style={styles.secondaryIcon}>📈</Text>
            <Text style={styles.secondaryTitle}>Recovery History</Text>
            <Text style={styles.secondarySub}>View set-by-set trends</Text>
          </TouchableOpacity>

          {/* Live Debug Signal Monitor */}
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => onSelectMode('debug')}
            accessibilityLabel="View live camera signal monitor"
          >
            <Text style={styles.secondaryIcon}>🔬</Text>
            <Text style={styles.secondaryTitle}>Signal Monitor</Text>
            <Text style={styles.secondarySub}>Live camera feed test</Text>
          </TouchableOpacity>
        </View>

        {/* Baseline Calibrator Shortcut */}
        <TouchableOpacity
          style={styles.calibrationCard}
          onPress={() => onSelectMode('calibration')}
        >
          <View>
            <Text style={styles.calibTitle}>Personal Calibration</Text>
            <Text style={styles.calibSub}>
              {baseline
                ? `Last calibrated at ${baseline.baselinePulse} BPM resting pulse`
                : 'Take a 30s capture to calibrate your resting vitals'}
            </Text>
          </View>
          <Text style={styles.calibArrow}>→</Text>
        </TouchableOpacity>

        {/* Regulatory Disclaimer */}
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
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingsIconBtn: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 10,
  },
  settingsIconText: {
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  statusBarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusPillText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  morningCard: {
    backgroundColor: '#1e293b',
    borderColor: '#f59e0b',
  },
  trainingCard: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
  },
  modeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeTagContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
  },
  morningTag: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trainingTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modeDescription: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  modeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modeMechanic: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeArrow: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  secondaryTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  secondarySub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  calibrationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calibTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  calibSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  calibArrow: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
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

