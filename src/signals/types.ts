export interface SignalSample {
  pulseBpm: number | null;
  breathingRate: number | null;
  signalQuality: number; // 0.0 to 1.0
  timestampMs: number;
  isStable: boolean;
  isSimulated?: boolean;
}

export interface BaselineMetrics {
  baselinePulse: number;
  baselineBreathing: number;
  calibratedAt: number;
  sampleCount: number;
}

export interface SignalQualityState {
  hasFace: boolean;
  isAdequatelyLit: boolean;
  isQualityAcceptable: boolean;
  guidanceMessage: string | null;
}

// Recommended quality thresholds (UX & signal stability parameters, NOT medical standards)
export const QUALITY_THRESHOLDS = {
  MIN_ACCEPTABLE_QUALITY: 0.40, // 40% confidence matches SDK cardio stable threshold
  OPTIMAL_QUALITY: 0.70,        // 70%+ confidence indicates clear rPPG / motion tracking
  MIN_BREATHING_BPM: 4,         // Physiological lower bound for adult resting respiration
  MAX_BREATHING_BPM: 40,        // Physiological upper bound
  MIN_PULSE_BPM: 35,            // Physiological lower bound
  MAX_PULSE_BPM: 220,           // Physiological upper bound
};

