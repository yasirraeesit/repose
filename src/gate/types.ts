import { SignalSample } from '../signals/types';

export type GateMode = 'breathing' | 'pulse';

export type GateReason =
  | 'idle'
  | 'min_rest'
  | 'poor_signal'
  | 'unsteady'
  | 'elevated_pulse'
  | 'settling'
  | 'settled'
  | 'timeout';

export interface SettleGateConfig {
  mode: GateMode;
  /** Hold duration in milliseconds that signal must stay settled before opening (e.g. 30s for morning, 5s for training) */
  holdDurationMs: number;
  /** Minimum elapsed time before gate is allowed to open (e.g. minimum rest in gym) */
  minTimeoutMs?: number;
  /** Maximum safety timeout after which gate force-opens (e.g. alarm max-ring fallback or gym max rest) */
  maxTimeoutMs?: number;

  // Training mode specific configuration
  /** User's calibrated baseline pulse in BPM */
  baselinePulse?: number;
  /** Acceptable margin above baseline pulse in BPM (default: 10 bpm UX threshold) */
  pulseMarginBpm?: number;

  // Morning mode specific configuration
  /** Target slow and calm breathing range [min, max] breaths/min (default: [8, 16] br/min UX threshold) */
  targetBreathingBand?: [number, number];
  /** Calibrated baseline breathing rate in br/min */
  baselineBreathing?: number;
  /** Max allowable breathing variation from baseline */
  breathingVariationMax?: number;

  /** Minimum signal quality required to advance hold progress [0.0 - 1.0] (default: 0.40) */
  minSignalQuality?: number;
}

export interface SettleGateState {
  /** Progress towards gate opening [0.0 to 1.0] */
  progress: number;
  /** Whether the gate has opened */
  isOpen: boolean;
  /** Current evaluation status / reason */
  reason: GateReason;
  /** Elapsed session time in milliseconds */
  elapsedMs: number;
  /** Continuous milliseconds spent meeting settled criteria */
  continuousHoldMs: number;
  /** Human-readable status description for UI */
  statusMessage: string;
  /** Whether the gate opened due to safety max timeout fallback */
  isTimedOut: boolean;
}

