import { QUALITY_THRESHOLDS, SignalQualityState, SignalSample } from './types';

export class SignalSmoother {
  private smoothedPulse: number | null = null;
  private smoothedBreathing: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.25) {
    this.alpha = alpha;
  }

  public reset() {
    this.smoothedPulse = null;
    this.smoothedBreathing = null;
  }

  public update(sample: SignalSample): SignalSample {
    let pulse = sample.pulseBpm;
    if (
      pulse !== null &&
      (pulse < QUALITY_THRESHOLDS.MIN_PULSE_BPM ||
        pulse > QUALITY_THRESHOLDS.MAX_PULSE_BPM)
    ) {
      pulse = null;
    }

    let breathing = sample.breathingRate;
    if (
      breathing !== null &&
      (breathing < QUALITY_THRESHOLDS.MIN_BREATHING_BPM ||
        breathing > QUALITY_THRESHOLDS.MAX_BREATHING_BPM)
    ) {
      breathing = null;
    }

    if (pulse !== null) {
      this.smoothedPulse =
        this.smoothedPulse === null
          ? pulse
          : this.alpha * pulse + (1 - this.alpha) * this.smoothedPulse;
    }

    if (breathing !== null) {
      this.smoothedBreathing =
        this.smoothedBreathing === null
          ? breathing
          : this.alpha * breathing + (1 - this.alpha) * this.smoothedBreathing;
    }

    return {
      pulseBpm:
        this.smoothedPulse !== null
          ? Number(this.smoothedPulse.toFixed(1))
          : null,
      breathingRate:
        this.smoothedBreathing !== null
          ? Number(this.smoothedBreathing.toFixed(1))
          : null,
      signalQuality: sample.signalQuality,
      timestampMs: sample.timestampMs,
      isStable: sample.isStable,
      isSimulated: sample.isSimulated,
    };
  }
}

export function assessSignalQuality(
  sample: SignalSample | null
): SignalQualityState {
  if (!sample) {
    return {
      hasFace: false,
      isAdequatelyLit: false,
      isQualityAcceptable: false,
      guidanceMessage: 'Position your face in front of the camera',
    };
  }

  const isQualityAcceptable =
    sample.signalQuality >= QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY;
  const hasFace = sample.signalQuality > 0.15;
  const isAdequatelyLit = sample.signalQuality >= 0.35;

  let guidanceMessage: string | null = null;
  if (!hasFace) {
    guidanceMessage = 'Center your face in the camera frame';
  } else if (!isAdequatelyLit) {
    guidanceMessage = 'Increase lighting or adjust angle to reduce glare';
  } else if (!isQualityAcceptable) {
    guidanceMessage = 'Hold steady and breathe naturally';
  }

  return {
    hasFace,
    isAdequatelyLit,
    isQualityAcceptable,
    guidanceMessage,
  };
}

