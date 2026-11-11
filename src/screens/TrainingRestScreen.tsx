import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Vibration,
} from 'react-native';
import { useSmartSpectraSignal } from '../signals/useSmartSpectraSignal';
import { useSettleGate } from '../gate/useSettleGate';
import { SettleGateConfig } from '../gate/types';
import { BaselineMetrics } from '../signals/types';
import { WorkoutSessionRecord, WorkoutSetRecord } from '../storage/types';
import { saveWorkoutSession } from '../storage/workoutStorage';

interface TrainingRestScreenProps {
  baseline: BaselineMetrics;
  onFinishWorkout?: (session: WorkoutSessionRecord) => void;
  onNavigateHome?: () => void;
}

export const TrainingRestScreen: React.FC<TrainingRestScreenProps> = ({
  baseline,
  onFinishWorkout,
  onNavigateHome,
}) => {
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [completedSets, setCompletedSets] = useState<WorkoutSetRecord[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const sessionStartTimeRef = useRef(Date.now());
  const currentSetStartTimeRef = useRef(Date.now());
  const initialPulseRef = useRef<number | null>(null);

  // Training Rest Gate Configuration
  const [minRestSeconds] = useState(30);   // 30s min rest
  const [maxRestSeconds] = useState(150);  // 2.5 min max rest cap
  const [marginBpm] = useState(10);        // within 10 BPM of baseline

  const targetCeiling = baseline.baselinePulse + marginBpm;

  const gateConfig: SettleGateConfig = {
    mode: 'pulse',
    baselinePulse: baseline.baselinePulse,
    pulseMarginBpm: marginBpm,
    minTimeoutMs: minRestSeconds * 1000,
    maxTimeoutMs: maxRestSeconds * 1000,
    holdDurationMs: 4000, // 4s stabilization
    minSignalQuality: 0.4,
  };

  const {
    isStreaming,
    smoothedSample,
    qualityState,
    startStream,
    stopStream,
  } = useSmartSpectraSignal({ autoStart: true });

  const gate = useSettleGate(smoothedSample, gateConfig, true);

  // Capture starting pulse at the beginning of rest
  useEffect(() => {
    if (smoothedSample?.pulseBpm && initialPulseRef.current === null) {
      initialPulseRef.current = smoothedSample.pulseBpm;
    }
  }, [smoothedSample]);

  // Vibrate / alert when gate opens
  useEffect(() => {
    if (gate.isOpen) {
      try {
        Vibration.vibrate([0, 200, 100, 200]);
      } catch (_e) {}
    }
  }, [gate.isOpen]);

  const handleNextSet = () => {
    const now = Date.now();
    const timeToBaselineMs = now - currentSetStartTimeRef.current;

    const newSetRecord: WorkoutSetRecord = {
      setId: `set_${currentSetNumber}_${now}`,
      setNumber: currentSetNumber,
      startedAt: currentSetStartTimeRef.current,
      endedAt: now,
      timeToBaselineMs,
      startPulseBpm: initialPulseRef.current,
      endPulseBpm: smoothedSample?.pulseBpm ?? null,
      baselinePulseBpm: baseline.baselinePulse,
      targetCeilingBpm: targetCeiling,
      isTimedOut: gate.isTimedOut,
    };

    setCompletedSets((prev) => [...prev, newSetRecord]);
    setCurrentSetNumber((prev) => prev + 1);

    // Reset for next rest cycle
    currentSetStartTimeRef.current = Date.now();
    initialPulseRef.current = smoothedSample?.pulseBpm ?? null;
    gate.resetGate();
  };

  const handleEndWorkout = async () => {
    stopStream();

    const now = Date.now();
    let setsToSave = [...completedSets];

    // If currently resting and gate had opened or timed out, log that set too
    if (gate.isOpen) {
      setsToSave.push({
        setId: `set_${currentSetNumber}_${now}`,
        setNumber: currentSetNumber,
        startedAt: currentSetStartTimeRef.current,
        endedAt: now,
        timeToBaselineMs: now - currentSetStartTimeRef.current,
        startPulseBpm: initialPulseRef.current,
        endPulseBpm: smoothedSample?.pulseBpm ?? null,
        baselinePulseBpm: baseline.baselinePulse,
        targetCeilingBpm: targetCeiling,
        isTimedOut: gate.isTimedOut,
      });
    }

    const recoveryTimes = setsToSave.map((s) => s.timeToBaselineMs);
    const avgRecovery =
      recoveryTimes.length > 0
        ? Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length)
        : 0;
    const fastestRecovery =
      recoveryTimes.length > 0 ? Math.min(...recoveryTimes) : 0;

    const sessionRecord: WorkoutSessionRecord = {
      sessionId,
      startedAt: sessionStartTimeRef.current,
      completedAt: now,
      baselinePulseBpm: baseline.baselinePulse,
      sets: setsToSave,
      averageRecoveryTimeMs: avgRecovery,
      fastestRecoveryTimeMs: fastestRecovery,
    };

    await saveWorkoutSession(sessionRecord);

    if (onFinishWorkout) {
      onFinishWorkout(sessionRecord);
    } else if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const currentPulse = smoothedSample?.pulseBpm;
  const pulseDelta =
    currentPulse !== null && currentPulse !== undefined
      ? currentPulse - baseline.baselinePulse
      : null;

  const minRestRemainingSec = Math.max(
    0,
    Math.ceil((minRestSeconds * 1000 - gate.elapsedMs) / 1000)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.modeTag}>TRAINING MODE</Text>
          <Text style={styles.title}>Rest Until Ready</Text>
        </View>
        <TouchableOpacity
          style={styles.endWorkoutButton}
          onPress={handleEndWorkout}
          accessibilityLabel="End Workout session"
        >
          <Text style={styles.endWorkoutText}>FINISH</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Camera and Set Header */}
        <View style={styles.topMetaRow}>
          <View style={styles.setBadge}>
            <Text style={styles.setBadgeText}>SET {currentSetNumber}</Text>
          </View>
          <View style={styles.cameraRow}>
            <View
              style={[
                styles.indicatorDot,
                { backgroundColor: isStreaming ? '#ef4444' : '#64748b' },
              ]}
            />
            <Text style={styles.indicatorText}>
              {isStreaming ? 'LIVE SENSING' : 'IDLE'}
            </Text>
          </View>
        </View>

        {/* Central Settle Gate Progress Ring */}
        <View style={styles.gateCenterContainer}>
          <View
            style={[
              styles.gateRing,
              gate.isOpen && styles.gateRingOpen,
              gate.isTimedOut && styles.gateRingTimeout,
            ]}
          >
            {gate.isOpen ? (
              <View style={styles.gateOpenContent}>
                <Text style={styles.openCheckmark}>✓</Text>
                <Text style={styles.openReadyTitle}>READY</Text>
                <Text style={styles.openReadySub}>
                  {gate.isTimedOut ? 'Max Rest Cap' : 'Pulse Recovered'}
                </Text>
              </View>
            ) : (
              <View style={styles.gateActiveContent}>
                <Text style={styles.mainPulseNumber}>
                  {currentPulse ? Math.round(currentPulse) : '--'}
                </Text>
                <Text style={styles.pulseBpmUnit}>BPM</Text>
                <Text style={styles.targetCeilingText}>
                  Target: ≤ {targetCeiling} BPM
                </Text>
              </View>
            )}
          </View>

          {/* Progress Percent Bar */}
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(gate.progress * 100)}%`,
                  backgroundColor: gate.isOpen ? '#10b981' : '#3b82f6',
                },
              ]}
            />
          </View>
        </View>

        {/* Guidance and Rest Status Banner */}
        <View
          style={[
            styles.statusBanner,
            gate.isOpen && styles.statusBannerOpen,
          ]}
        >
          <Text style={styles.statusBannerText}>
            {gate.isOpen
              ? 'Your pulse has returned to your personal baseline margin. Ready for your next set!'
              : minRestRemainingSec > 0
              ? `Minimum rest active: ${minRestRemainingSec}s remaining before gate can unlock`
              : gate.statusMessage}
          </Text>
        </View>

        {/* Personal Baseline Comparison Metric Cards */}
        <View style={styles.metaCardsRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>YOUR BASELINE</Text>
            <Text style={styles.metaValue}>{baseline.baselinePulse} BPM</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>RECOVERY ELEVATION</Text>
            <Text
              style={[
                styles.metaValue,
                {
                  color:
                    pulseDelta === null
                      ? '#94a3b8'
                      : pulseDelta <= marginBpm
                      ? '#10b981'
                      : '#f59e0b',
                },
              ]}
            >
              {pulseDelta !== null
                ? pulseDelta > 0
                  ? `+${pulseDelta.toFixed(0)} BPM`
                  : `${pulseDelta.toFixed(0)} BPM`
                : '--'}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>REST ELAPSED</Text>
            <Text style={styles.metaValue}>
              {Math.floor(gate.elapsedMs / 1000)}s
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextSetButton,
              !gate.isOpen && styles.nextSetButtonDisabled,
            ]}
            disabled={!gate.isOpen}
            onPress={handleNextSet}
            accessibilityLabel="Start next set"
          >
            <Text style={styles.nextSetButtonText}>
              {gate.isOpen ? 'START NEXT SET →' : 'RESTING (GATE LOCKED)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Completed Sets Summary */}
        {completedSets.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>SESSION RECOVERY LOG</Text>
            {completedSets.map((s) => (
              <View key={s.setId} style={styles.historyRow}>
                <Text style={styles.historySet}>SET {s.setNumber}</Text>
                <Text style={styles.historyTime}>
                  Recovery:{' '}
                  {Math.round(s.timeToBaselineMs / 1000)}s
                </Text>
                <Text
                  style={[
                    styles.historyTag,
                    s.isTimedOut ? styles.historyTagTimeout : styles.historyTagSettled,
                  ]}
                >
                  {s.isTimedOut ? 'Max Cap' : 'Baseline'}
                </Text>
              </View>
            ))}
          </View>
        )}

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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modeTag: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  endWorkoutButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endWorkoutText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  setBadgeText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 10,
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
  gateCenterContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  gateRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1e293b',
    borderWidth: 8,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateRingOpen: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  gateRingTimeout: {
    borderColor: '#f59e0b',
    backgroundColor: '#78350f',
  },
  gateActiveContent: {
    alignItems: 'center',
  },
  mainPulseNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#f8fafc',
    lineHeight: 60,
  },
  pulseBpmUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  targetCeilingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
    marginTop: 6,
  },
  gateOpenContent: {
    alignItems: 'center',
  },
  openCheckmark: {
    fontSize: 48,
    color: '#10b981',
    fontWeight: '900',
  },
  openReadyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  openReadySub: {
    fontSize: 12,
    color: '#d1fae5',
    fontWeight: '600',
    marginTop: 2,
  },
  progressBarWrapper: {
    width: 200,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusBanner: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBannerOpen: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b',
  },
  statusBannerText: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  metaCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  metaCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  nextSetButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextSetButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.7,
  },
  nextSetButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 24,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historySet: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  historyTime: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  historyTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyTagSettled: {
    backgroundColor: '#065f46',
    color: '#a7f3d0',
  },
  historyTagTimeout: {
    backgroundColor: '#78350f',
    color: '#fde68a',
  },
  disclaimerBox: {
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 20,
    marginBottom: 16,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});

