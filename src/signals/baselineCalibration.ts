import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaselineMetrics, QUALITY_THRESHOLDS, SignalSample } from './types';

const STORAGE_KEY_BASELINE = '@repose_user_baseline_v1';

export interface CalibrationProgress {
  sampleCount: number;
  targetSamples: number;
  percent: number;
  currentPulse: number | null;
  currentBreathing: number | null;
  isQualityGood: boolean;
  guidance: string;
}

export class BaselineCalibrator {
  private samples: SignalSample[] = [];
  private targetDurationMs: number;

  constructor(targetDurationSeconds: number = 30) {
    this.targetDurationMs = targetDurationSeconds * 1000;
  }

  public reset() {
    this.samples = [];
  }

  public addSample(sample: SignalSample): CalibrationProgress {
    // Only accept samples with sufficient optical quality
    if (sample.signalQuality >= QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY) {
      this.samples.push(sample);
    }

    // Estimate 2 samples per second
    const targetSamples = Math.round((this.targetDurationMs / 1000) * 2);
    const validCount = this.samples.length;
    const percent = Math.min(100, Math.round((validCount / targetSamples) * 100));

    let guidance = 'Rest comfortably and breathe naturally.';
    if (sample.signalQuality < QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY) {
      guidance = 'Hold steady and ensure good lighting to calibrate.';
    } else if (percent < 30) {
      guidance = 'Acquiring initial biometric readings...';
    } else if (percent < 80) {
      guidance = 'Calibrating personal baseline vitals...';
    } else {
      guidance = 'Almost done! Finalizing calibration...';
    }

    return {
      sampleCount: validCount,
      targetSamples,
      percent,
      currentPulse: sample.pulseBpm,
      currentBreathing: sample.breathingRate,
      isQualityGood: sample.signalQuality >= QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY,
      guidance,
    };
  }

  public isComplete(targetDurationSeconds: number = 30): boolean {
    const minSamples = targetDurationSeconds * 1.5; // at least 1.5 valid samples per second
    return this.samples.length >= minSamples;
  }

  public computeBaseline(): BaselineMetrics {
    if (this.samples.length === 0) {
      // Sensible standard fallback if no valid frames
      return {
        baselinePulse: 72,
        baselineBreathing: 13,
        calibratedAt: Date.now(),
        sampleCount: 0,
      };
    }

    const pulseValues = this.samples
      .map((s) => s.pulseBpm)
      .filter((v): v is number => v !== null && v >= 40 && v <= 180)
      .sort((a, b) => a - b);

    const breathingValues = this.samples
      .map((s) => s.breathingRate)
      .filter((v): v is number => v !== null && v >= 6 && v <= 30)
      .sort((a, b) => a - b);

    const baselinePulse =
      pulseValues.length > 0
        ? calculateTrimmedMean(pulseValues, 0.15)
        : 72;

    const baselineBreathing =
      breathingValues.length > 0
        ? calculateTrimmedMean(breathingValues, 0.15)
        : 13;

    return {
      baselinePulse: Number(baselinePulse.toFixed(1)),
      baselineBreathing: Number(baselineBreathing.toFixed(1)),
      calibratedAt: Date.now(),
      sampleCount: this.samples.length,
    };
  }
}

/**
 * Calculates a trimmed mean by discarding the lowest and highest alpha fraction of samples.
 * Prevents intermittent movement artifacts from distorting personal baseline.
 */
function calculateTrimmedMean(sortedValues: number[], trimRatio: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length < 5) {
    // Median for small sets
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues[mid];
  }

  const trimCount = Math.floor(sortedValues.length * trimRatio);
  const trimmed = sortedValues.slice(trimCount, sortedValues.length - trimCount);

  if (trimmed.length === 0) return sortedValues[0];
  const sum = trimmed.reduce((acc, v) => acc + v, 0);
  return sum / trimmed.length;
}

// Storage helpers
export async function saveBaseline(baseline: BaselineMetrics): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_BASELINE, JSON.stringify(baseline));
  } catch (err) {
    console.warn('Failed to save baseline metrics to local storage', err);
  }
}

export async function loadBaseline(): Promise<BaselineMetrics | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BASELINE);
    if (!raw) return null;
    return JSON.parse(raw) as BaselineMetrics;
  } catch (err) {
    console.warn('Failed to load baseline metrics from local storage', err);
    return null;
  }
}

export async function clearBaseline(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_BASELINE);
  } catch (err) {
    console.warn('Failed to clear baseline metrics', err);
  }
}

