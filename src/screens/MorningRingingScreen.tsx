import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Vibration,
} from 'react-native';
import { useSmartSpectraSignal } from '../signals/useSmartSpectraSignal';
import { useSettleGate } from '../gate/useSettleGate';
import { SettleGateConfig } from '../gate/types';
import { MorningAlarmConfig } from '../alarm/alarmScheduler';

interface MorningRingingScreenProps {
  alarmConfig: MorningAlarmConfig;
  onGateUnlocked: () => void;
}

export const MorningRingingScreen: React.FC<MorningRingingScreenProps> = ({
  alarmConfig,
  onGateUnlocked,
}) => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Periodic clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Alarm vibration pulsing while ringing
  useEffect(() => {
    const vibrationInterval = setInterval(() => {
      try {
        Vibration.vibrate([0, 400, 200, 400]);
      } catch (_e) {}
    }, 1500);

    return () => {
      clearInterval(vibrationInterval);
      try {
        Vibration.cancel();
      } catch (_e) {}
    };
  }, []);

  const gateConfig: SettleGateConfig = {
    mode: 'breathing',
    holdDurationMs: alarmConfig.holdDurationSeconds * 1000,
    maxTimeoutMs: alarmConfig.maxRingTimeoutSeconds * 1000,
    targetBreathingBand: [8, 16], // UX band for calm regulated breathing
    minSignalQuality: 0.4,
  };

  const {
    isStreaming,
    smoothedSample,
    qualityState,
    stopStream,
  } = useSmartSpectraSignal({ autoStart: true });

  const gate = useSettleGate(smoothedSample, gateConfig, true);

  // Stop camera and vibration immediately when gate opens
  useEffect(() => {
    if (gate.isOpen) {
      stopStream();
      try {
        Vibration.cancel();
      } catch (_e) {}
    }
  }, [gate.isOpen, stopStream]);

  const maxRingRemainingSec = Math.max(
    0,
    Math.ceil(
      (alarmConfig.maxRingTimeoutSeconds * 1000 - gate.elapsedMs) / 1000
    )
  );

  const breathingRate = smoothedSample?.breathingRate;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Banner */}
      <View style={[styles.ringingBanner, gate.isOpen && styles.bannerUnlocked]}>
        <Text style={styles.ringingBannerText}>
          {gate.isOpen
            ? '✓ SETTLE GATE OPENED - ALARM SILENCED'
            : '🔔 MORNING ALARM RINGING'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Current Time Display */}
        <View style={styles.timeSection}>
          <Text style={styles.clockTime}>{currentTime}</Text>
          <Text style={styles.clockSub}>Calm Alarm Active</Text>
        </View>

        {/* Central Settle Gate Progress Ring */}
        <View style={styles.gateRingContainer}>
          <View
            style={[
              styles.gateRing,
              gate.isOpen && styles.gateRingUnlocked,
              gate.isTimedOut && styles.gateRingTimeout,
            ]}
          >
            {gate.isOpen ? (
              <View style={styles.unlockedCenter}>
                <Text style={styles.unlockedCheck}>✓</Text>
                <Text style={styles.unlockedTitle}>CALM</Text>
                <Text style={styles.unlockedSub}>
                  {gate.isTimedOut ? 'Safety Fallback' : 'Regulated'}
                </Text>
              </View>
            ) : (
              <View style={styles.lockedCenter}>
                <Text style={styles.liveBreathingValue}>
                  {breathingRate ? breathingRate.toFixed(0) : '--'}
                </Text>
                <Text style={styles.liveBreathingUnit}>BR / MIN</Text>
                <Text style={styles.targetBandText}>Target: 8 - 16 BR/M</Text>
              </View>
            )}
          </View>

          {/* Continuous Hold Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(gate.progress * 100)}%`,
                  backgroundColor: gate.isOpen ? '#10b981' : '#f59e0b',
                },
              ]}
            />
          </View>
        </View>

        {/* Status & Coaching Guidance */}
        <View
          style={[
            styles.guidanceCard,
            gate.isOpen && styles.guidanceCardUnlocked,
          ]}
        >
          <Text style={styles.guidanceText}>
            {gate.isOpen
              ? 'Your breathing is calm and steady. Alarm successfully dismissed.'
              : qualityState.guidanceMessage || gate.statusMessage}
          </Text>
          {!gate.isOpen && (
            <Text style={styles.safetyCountdownText}>
              Safety auto-dismiss in: {Math.floor(maxRingRemainingSec / 60)}m{' '}
              {maxRingRemainingSec % 60}s
            </Text>
          )}
        </View>

        {/* Camera Live Indicator */}
        <View style={styles.cameraRow}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isStreaming ? '#ef4444' : '#64748b' },
            ]}
          />
          <Text style={styles.indicatorText}>
            {isStreaming ? 'OPTICAL SENSING ON' : 'CAMERA OFF'}
          </Text>
        </View>

        {/* Action Button: Locked until gate opens */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.dismissButton,
              !gate.isOpen && styles.dismissButtonLocked,
            ]}
            disabled={!gate.isOpen}
            onPress={onGateUnlocked}
            accessibilityLabel="Dismiss Alarm and Begin Day"
          >
            <Text style={styles.dismissButtonText}>
              {gate.isOpen
                ? 'BEGIN YOUR DAY →'
                : `🔒 LOCKED (${Math.round(gate.progress * 100)}% STEADY)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Regulatory Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Steady is for wellness and convenience only. It does not diagnose,
            treat, or give medical advice.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  ringingBanner: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    alignItems: 'center',
  },
  bannerUnlocked: {
    backgroundColor: '#059669',
  },
  ringingBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  timeSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  clockTime: {
    fontSize: 58,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  clockSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  gateRingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  gateRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1e293b',
    borderWidth: 8,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateRingUnlocked: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  gateRingTimeout: {
    borderColor: '#f59e0b',
    backgroundColor: '#78350f',
  },
  lockedCenter: {
    alignItems: 'center',
  },
  liveBreathingValue: {
    fontSize: 52,
    fontWeight: '900',
    color: '#f8fafc',
    lineHeight: 58,
  },
  liveBreathingUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  targetBandText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
    marginTop: 6,
  },
  unlockedCenter: {
    alignItems: 'center',
  },
  unlockedCheck: {
    fontSize: 50,
    color: '#10b981',
    fontWeight: '900',
  },
  unlockedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
  },
  unlockedSub: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 2,
  },
  progressBarTrack: {
    width: 220,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  guidanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  guidanceCardUnlocked: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  guidanceText: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  safetyCountdownText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  indicatorText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  actionSection: {
    marginTop: 8,
  },
  dismissButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dismissButtonLocked: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimerBox: {
    padding: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 8,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 9,
    textAlign: 'center',
  },
});

