import { SignalSample, QUALITY_THRESHOLDS } from '../signals/types';
import { GateReason, SettleGateConfig, SettleGateState } from './types';

/**
 * Pure evaluation function for the Settle Gate mechanic.
 * Evaluates whether current live sample meets settled criteria and updates state.
 *
 * NOTE: All thresholds and intervals are UX parameters for wellness convenience,
 * NOT clinical, diagnostic, or medical assessment thresholds.
 */
export function evaluateSettleGate(
  sample: SignalSample | null,
  config: SettleGateConfig,
  previousState: SettleGateState,
  deltaMs: number
): SettleGateState {
  // If already opened, keep state open
  if (previousState.isOpen) {
    return previousState;
  }

  const elapsedMs = previousState.elapsedMs + deltaMs;
  const minTimeoutMs = config.minTimeoutMs ?? 0;
  const maxTimeoutMs = config.maxTimeoutMs ?? Infinity;
  const minQuality = config.minSignalQuality ?? QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY;

  // 1. Check Max Timeout Fallback (Safety valve)
  if (elapsedMs >= maxTimeoutMs) {
    return {
      progress: 1.0,
      isOpen: true,
      reason: 'timeout',
      elapsedMs,
      continuousHoldMs: previousState.continuousHoldMs,
      statusMessage: 'Gate opened via safety maximum timeout.',
      isTimedOut: true,
    };
  }

  // 2. Check Signal Quality
  if (!sample || sample.signalQuality < minQuality) {
    // Low quality does NOT advance progress; resets or pauses hold
    return {
      progress: 0,
      isOpen: false,
      reason: 'poor_signal',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: 'Hold steady and ensure face is well-lit in the camera.',
      isTimedOut: false,
    };
  }

  // 3. Mode Evaluation
  if (config.mode === 'breathing') {
    return evaluateBreathingGate(sample, config, elapsedMs, previousState.continuousHoldMs, deltaMs);
  } else {
    return evaluatePulseGate(sample, config, elapsedMs, minTimeoutMs, previousState.continuousHoldMs, deltaMs);
  }
}

/**
 * Morning Calm Alarm Gate:
 * Requires breathing to stay steady and slow for continuous hold duration (e.g. 30 seconds).
 */
function evaluateBreathingGate(
  sample: SignalSample,
  config: SettleGateConfig,
  elapsedMs: number,
  previousHoldMs: number,
  deltaMs: number
): SettleGateState {
  const breathing = sample.breathingRate;

  if (breathing === null) {
    return {
      progress: 0,
      isOpen: false,
      reason: 'unsteady',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: 'Detecting breathing rhythm...',
      isTimedOut: false,
    };
  }

  // Target breathing band (default: 8 to 16 breaths per minute for calm wakefulness)
  const band = config.targetBreathingBand ?? [8, 16];
  const isWithinBand = breathing >= band[0] && breathing <= band[1];

  // Optional: check variation from user's calibrated baseline if provided
  let isWithinBaselineVariation = true;
  if (config.baselineBreathing !== undefined && config.breathingVariationMax !== undefined) {
    const diff = Math.abs(breathing - config.baselineBreathing);
    isWithinBaselineVariation = diff <= config.breathingVariationMax;
  }

  const isSteady = isWithinBand && isWithinBaselineVariation && sample.isStable;

  if (!isSteady) {
    // Unsteady breathing resets progress back to zero
    return {
      progress: 0,
      isOpen: false,
      reason: 'unsteady',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: 'Take slow, steady breaths to fill the ring.',
      isTimedOut: false,
    };
  }

  // Steady: accumulate hold duration
  const continuousHoldMs = previousHoldMs + deltaMs;
  const progress = Math.min(1.0, continuousHoldMs / config.holdDurationMs);
  const isOpen = continuousHoldMs >= config.holdDurationMs;

  return {
    progress,
    isOpen,
    reason: isOpen ? 'settled' : 'settling',
    elapsedMs,
    continuousHoldMs,
    statusMessage: isOpen
      ? 'Breathing is steady. Gate open!'
      : `Holding steady: ${Math.round(progress * 100)}%`,
    isTimedOut: false,
  };
}

/**
 * Training Rest Gate:
 * Requires pulse to drop back to within margin of user's own baseline, after min-rest.
 */
function evaluatePulseGate(
  sample: SignalSample,
  config: SettleGateConfig,
  elapsedMs: number,
  minTimeoutMs: number,
  previousHoldMs: number,
  deltaMs: number
): SettleGateState {
  // Check min-rest time first
  if (elapsedMs < minTimeoutMs) {
    const remainingSec = Math.ceil((minTimeoutMs - elapsedMs) / 1000);
    return {
      progress: 0,
      isOpen: false,
      reason: 'min_rest',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: `Minimum rest period active (${remainingSec}s remaining)...`,
      isTimedOut: false,
    };
  }

  const pulse = sample.pulseBpm;
  if (pulse === null) {
    return {
      progress: 0,
      isOpen: false,
      reason: 'poor_signal',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: 'Acquiring pulse signal...',
      isTimedOut: false,
    };
  }

  const baseline = config.baselinePulse ?? 75;
  const margin = config.pulseMarginBpm ?? 10;
  const targetCeiling = baseline + margin;

  const isWithinMargin = pulse <= targetCeiling;

  if (!isWithinMargin) {
    return {
      progress: 0,
      isOpen: false,
      reason: 'elevated_pulse',
      elapsedMs,
      continuousHoldMs: 0,
      statusMessage: `Pulse (${pulse.toFixed(0)} BPM) recovering toward target (≤ ${targetCeiling.toFixed(0)} BPM)...`,
      isTimedOut: false,
    };
  }

  // Pulse is within acceptable margin of baseline!
  const continuousHoldMs = previousHoldMs + deltaMs;
  const holdTarget = Math.max(1, config.holdDurationMs);
  const progress = Math.min(1.0, continuousHoldMs / holdTarget);
  const isOpen = continuousHoldMs >= holdTarget;

  return {
    progress,
    isOpen,
    reason: isOpen ? 'settled' : 'settling',
    elapsedMs,
    continuousHoldMs,
    statusMessage: isOpen
      ? `Pulse recovered to personal baseline (${pulse.toFixed(0)} BPM). Ready for next set!`
      : `Stabilizing at baseline: ${Math.round(progress * 100)}%`,
    isTimedOut: false,
  };
}
