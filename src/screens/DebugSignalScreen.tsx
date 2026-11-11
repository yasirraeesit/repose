import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSmartSpectraSignal } from '../signals/useSmartSpectraSignal';
import { SimulatedSignal, SimulationScenario } from '../signals/simulatedSignal';

export const DebugSignalScreen: React.FC = () => {
  const [simEnabled, setSimEnabled] = useState(SimulatedSignal.isEnabled());
  const [simScenario, setSimScenario] = useState<SimulationScenario>('settling-pulse');

  const {
    isStreaming,
    error,
    currentSample,
    smoothedSample,
    sampleHistory,
    qualityState,
    startStream,
    stopStream,
  } = useSmartSpectraSignal();

  const toggleSimulation = () => {
    if (!__DEV__) return;
    const next = !simEnabled;
    SimulatedSignal.setEnabled(next);
    setSimEnabled(next);
  };

  const selectScenario = (sc: SimulationScenario) => {
    setSimScenario(sc);
    SimulatedSignal.setScenario(sc);
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.7) return '#4ade80'; // Green
    if (quality >= 0.4) return '#fbbf24'; // Amber
    return '#f87171'; // Red
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dev Simulation Banner if Active */}
      {simEnabled && (
        <View style={styles.simBanner}>
          <Text style={styles.simBannerText}>
            ⚠️ SIMULATED SIGNAL ACTIVE (DEV ONLY - NOT FOR DEMO)
          </Text>
        </View>
      )}

      {/* Header with Camera Indicator */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Repose</Text>
          <Text style={styles.subtitle}>SmartSpectra Signal Monitor</Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isStreaming ? '#ef4444' : '#64748b' },
            ]}
          />
          <Text style={styles.indicatorText}>
            {isStreaming ? 'CAMERA ON' : 'CAMERA OFF'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Error Alert */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Signal Pipeline Alert</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* Live Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Pulse Card */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PULSE RATE</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricValue}>
                {smoothedSample?.pulseBpm !== null &&
                smoothedSample?.pulseBpm !== undefined
                  ? smoothedSample.pulseBpm
                  : '--'}
              </Text>
              <Text style={styles.metricUnit}>BPM</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.footerSub}>
                Raw: {currentSample?.pulseBpm ?? '--'}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: smoothedSample?.isStable
                      ? '#065f46'
                      : '#374151',
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {smoothedSample?.isStable ? 'STABLE' : 'CALIBRATING'}
                </Text>
              </View>
            </View>
          </View>

          {/* Breathing Card */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>BREATHING RATE</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricValue}>
                {smoothedSample?.breathingRate !== null &&
                smoothedSample?.breathingRate !== undefined
                  ? smoothedSample.breathingRate
                  : '--'}
              </Text>
              <Text style={styles.metricUnit}>BR/MIN</Text>
            </View>
            <View style={styles.metricFooter}>
              <Text style={styles.footerSub}>
                Raw: {currentSample?.breathingRate ?? '--'}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      smoothedSample?.breathingRate !== null &&
                      smoothedSample?.breathingRate !== undefined
                        ? '#1e3a8a'
                        : '#374151',
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {smoothedSample?.breathingRate ? 'ACTIVE' : 'SEARCHING'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signal Quality Card */}
        <View style={styles.qualityCard}>
          <View style={styles.qualityHeader}>
            <Text style={styles.qualityTitle}>SIGNAL QUALITY</Text>
            <Text
              style={[
                styles.qualityPercent,
                {
                  color: getQualityColor(
                    smoothedSample?.signalQuality ?? 0
                  ),
                },
              ]}
            >
              {Math.round((smoothedSample?.signalQuality ?? 0) * 100)}%
            </Text>
          </View>

          {/* Quality Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(
                    (smoothedSample?.signalQuality ?? 0) * 100
                  )}%`,
                  backgroundColor: getQualityColor(
                    smoothedSample?.signalQuality ?? 0
                  ),
                },
              ]}
            />
          </View>

          {/* Coaching Guidance */}
          {qualityState.guidanceMessage && (
            <Text style={styles.guidanceText}>
              💡 {qualityState.guidanceMessage}
            </Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlSection}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: isStreaming ? '#dc2626' : '#2563eb' },
            ]}
            onPress={isStreaming ? stopStream : startStream}
            accessibilityLabel={
              isStreaming ? 'Stop camera capture' : 'Start camera capture'
            }
          >
            <Text style={styles.primaryButtonText}>
              {isStreaming ? 'STOP CAMERA FEED' : 'START CAMERA FEED'}
            </Text>
          </TouchableOpacity>

          {/* Dev Simulation Controls */}
          {__DEV__ && (
            <View style={styles.devControlsContainer}>
              <View style={styles.devControlsHeader}>
                <Text style={styles.devTitle}>DEV TOOLS</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { backgroundColor: simEnabled ? '#d97706' : '#334155' },
                  ]}
                  onPress={toggleSimulation}
                >
                  <Text style={styles.toggleBtnText}>
                    {simEnabled ? 'SIMULATION ON' : 'ENABLE SIMULATION'}
                  </Text>
                </TouchableOpacity>
              </View>

              {simEnabled && (
                <View style={styles.scenarioRow}>
                  {(
                    [
                      'settling-pulse',
                      'steady-breathing',
                      'unsteady-breathing',
                      'low-quality',
                    ] as SimulationScenario[]
                  ).map((sc) => (
                    <TouchableOpacity
                      key={sc}
                      style={[
                        styles.scenarioChip,
                        simScenario === sc && styles.scenarioChipActive,
                      ]}
                      onPress={() => selectScenario(sc)}
                    >
                      <Text
                        style={[
                          styles.scenarioChipText,
                          simScenario === sc && styles.scenarioChipTextActive,
                        ]}
                      >
                        {sc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Live Rolling Stream Log */}
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>
            LIVE EVENT STREAM (LATEST {sampleHistory.length} SAMPLES)
          </Text>
          <View style={styles.logContainer}>
            {sampleHistory.length === 0 ? (
              <Text style={styles.emptyLogText}>
                {isStreaming
                  ? 'Awaiting first metric window from camera...'
                  : 'Start camera feed or enable simulation to stream samples.'}
              </Text>
            ) : (
              sampleHistory
                .slice(-8)
                .reverse()
                .map((s, idx) => (
                  <View key={idx} style={styles.logRow}>
                    <Text style={styles.logTime}>
                      {new Date(s.timestampMs).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.logPulse}>
                      ♥ {s.pulseBpm ? `${s.pulseBpm} bpm` : '--'}
                    </Text>
                    <Text style={styles.logBreathing}>
                      💨 {s.breathingRate ? `${s.breathingRate}/m` : '--'}
                    </Text>
                    <Text
                      style={[
                        styles.logQuality,
                        { color: getQualityColor(s.signalQuality) },
                      ]}
                    >
                      {Math.round(s.signalQuality * 100)}%
                    </Text>
                  </View>
                ))
            )}
          </View>
        </View>

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
  simBanner: {
    backgroundColor: '#b45309',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  simBannerText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusRow: {
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
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  content: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#450a0a',
    borderColor: '#991b1b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fecaca',
    fontWeight: '700',
    fontSize: 13,
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 10,
  },
  metricValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f8fafc',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerSub: {
    fontSize: 11,
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '700',
  },
  qualityCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  qualityPercent: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  guidanceText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 10,
  },
  controlSection: {
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  devControlsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  devControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  scenarioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  scenarioChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scenarioChipActive: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  scenarioChipText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  scenarioChipTextActive: {
    color: '#ffffff',
  },
  logSection: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  logTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  logContainer: {
    minHeight: 120,
  },
  emptyLogText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 20,
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  logTime: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logPulse: {
    color: '#f43f5e',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  logBreathing: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  logQuality: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  disclaimerBox: {
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 8,
    marginBottom: 24,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
