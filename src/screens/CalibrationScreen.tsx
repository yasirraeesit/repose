import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSmartSpectraSignal } from '../signals/useSmartSpectraSignal';
import {
  BaselineCalibrator,
  CalibrationProgress,
  saveBaseline,
} from '../signals/baselineCalibration';
import { BaselineMetrics } from '../signals/types';

interface CalibrationScreenProps {
  onCalibrationComplete: (baseline: BaselineMetrics) => void;
  onCancel?: () => void;
  targetDurationSeconds?: number;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  onCalibrationComplete,
  onCancel,
  targetDurationSeconds = 30,
}) => {
  const calibratorRef = useRef(new BaselineCalibrator(targetDurationSeconds));
  const [progress, setProgress] = useState<CalibrationProgress>({
    sampleCount: 0,
    targetSamples: targetDurationSeconds * 2,
    percent: 0,
    currentPulse: null,
    currentBreathing: null,
    isQualityGood: false,
    guidance: 'Position your face in front of the camera and hold still.',
  });

  const [calibratedMetrics, setCalibratedMetrics] = useState<BaselineMetrics | null>(null);

  const {
    isStreaming,
    smoothedSample,
    qualityState,
    startStream,
    stopStream,
  } = useSmartSpectraSignal({ autoStart: true });

  useEffect(() => {
    if (!isStreaming || calibratedMetrics) return;

    if (smoothedSample) {
      const p = calibratorRef.current.addSample(smoothedSample);
      setProgress(p);

      if (p.percent >= 100 && calibratorRef.current.isComplete(targetDurationSeconds)) {
        const result = calibratorRef.current.computeBaseline();
        setCalibratedMetrics(result);
        saveBaseline(result);
        stopStream();
      }
    }
  }, [smoothedSample, isStreaming, calibratedMetrics, targetDurationSeconds, stopStream]);

  const handleFinish = () => {
    if (calibratedMetrics) {
      onCalibrationComplete(calibratedMetrics);
    }
  };

  const handleRecalibrate = () => {
    calibratorRef.current.reset();
    setCalibratedMetrics(null);
    setProgress({
      sampleCount: 0,
      targetSamples: targetDurationSeconds * 2,
      percent: 0,
      currentPulse: null,
      currentBreathing: null,
      isQualityGood: false,
      guidance: 'Position your face in front of the camera and hold still.',
    });
    startStream();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Baseline Calibration</Text>
        <Text style={styles.subtitle}>
          Establish your own resting physiology baseline
        </Text>
      </View>

      <View style={styles.content}>
        {/* Camera Indicator */}
        <View style={styles.cameraRow}>
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isStreaming ? '#ef4444' : '#64748b' },
            ]}
          />
          <Text style={styles.indicatorText}>
            {isStreaming ? 'CAMERA ON (CALIBRATING)' : 'CAMERA IDLE'}
          </Text>
        </View>

        {!calibratedMetrics ? (
          <>
            {/* Visual Ring / Progress Box */}
            <View style={styles.progressContainer}>
              <View style={styles.circleOutline}>
                <Text style={styles.percentText}>{progress.percent}%</Text>
                <Text style={styles.percentSub}>Calibrating</Text>
              </View>
            </View>

            {/* Current Real-time Readings */}
            <View style={styles.vitalsPreviewRow}>
              <View style={styles.vitalPreviewCard}>
                <Text style={styles.previewLabel}>PULSE</Text>
                <Text style={styles.previewValue}>
                  {progress.currentPulse ? `${progress.currentPulse} BPM` : '--'}
                </Text>
              </View>
              <View style={styles.vitalPreviewCard}>
                <Text style={styles.previewLabel}>BREATHING</Text>
                <Text style={styles.previewValue}>
                  {progress.currentBreathing
                    ? `${progress.currentBreathing} BR/M`
                    : '--'}
                </Text>
              </View>
            </View>

            {/* Coaching Guidance Banner */}
            <View style={styles.guidanceBox}>
              <Text style={styles.guidanceIcon}>💡</Text>
              <Text style={styles.guidanceMessage}>
                {qualityState.guidanceMessage || progress.guidance}
              </Text>
            </View>
          </>
        ) : (
          /* Calibration Success Result Card */
          <View style={styles.successCard}>
            <Text style={styles.successBadge}>✓ CALIBRATION COMPLETE</Text>
            <Text style={styles.successTitle}>Your Personal Baseline</Text>

            <View style={styles.resultRow}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Resting Pulse</Text>
                <Text style={styles.resultValue}>
                  {calibratedMetrics.baselinePulse}{' '}
                  <Text style={styles.resultUnit}>BPM</Text>
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Resting Respiration</Text>
                <Text style={styles.resultValue}>
                  {calibratedMetrics.baselineBreathing}{' '}
                  <Text style={styles.resultUnit}>BR/M</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.resultNote}>
              Saved securely on this device. Steady will compare live recovery
              against these personal baseline values.
            </Text>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleFinish}
              accessibilityLabel="Continue with calibrated baseline"
            >
              <Text style={styles.continueButtonText}>APPLY & CONTINUE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recalibrateButton}
              onPress={handleRecalibrate}
            >
              <Text style={styles.recalibrateText}>Recalibrate</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel button if provided */}
        {onCancel && !calibratedMetrics && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        {/* Disclaimer */}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 24,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  circleOutline: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    color: '#f8fafc',
    fontSize: 42,
    fontWeight: '800',
  },
  percentSub: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  vitalsPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  vitalPreviewCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  previewValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  guidanceBox: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginVertical: 12,
  },
  guidanceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  guidanceMessage: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  successCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  successBadge: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  successTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  resultLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  resultValue: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  resultUnit: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  resultNote: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 12,
  },
  continueButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recalibrateButton: {
    marginTop: 12,
    paddingVertical: 6,
  },
  recalibrateText: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
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
