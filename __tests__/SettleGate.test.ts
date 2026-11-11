import { evaluateSettleGate } from '../src/gate/settleGateLogic';
import { SettleGateConfig, SettleGateState } from '../src/gate/types';
import { SignalSample } from '../src/signals/types';
import { BaselineCalibrator } from '../src/signals/baselineCalibration';

const INITIAL_STATE: SettleGateState = {
  progress: 0,
  isOpen: false,
  reason: 'idle',
  elapsedMs: 0,
  continuousHoldMs: 0,
  statusMessage: 'Ready',
  isTimedOut: false,
};

describe('Settle Gate - Morning Mode (Calm Breathing Gate)', () => {
  const morningConfig: SettleGateConfig = {
    mode: 'breathing',
    holdDurationMs: 10000, // 10 seconds for test
    maxTimeoutMs: 60000,   // 60s max safety fallback
    targetBreathingBand: [8, 16],
    minSignalQuality: 0.4,
  };

  it('progressively fills the progress ring while breathing is steady and opens at hold duration', () => {
    let state = INITIAL_STATE;
    const steadySample: SignalSample = {
      pulseBpm: 68,
      breathingRate: 12,
      signalQuality: 0.85,
      timestampMs: 1000,
      isStable: true,
    };

    // First 5 seconds of steady breathing
    for (let i = 0; i < 5; i++) {
      state = evaluateSettleGate(steadySample, morningConfig, state, 1000);
      expect(state.isOpen).toBe(false);
      expect(state.reason).toBe('settling');
    }

    expect(state.continuousHoldMs).toBe(5000);
    expect(state.progress).toBeCloseTo(0.5, 2);

    // Another 5 seconds of steady breathing -> Reach 10 seconds hold
    for (let i = 0; i < 5; i++) {
      state = evaluateSettleGate(steadySample, morningConfig, state, 1000);
    }

    expect(state.continuousHoldMs).toBe(10000);
    expect(state.progress).toBe(1.0);
    expect(state.isOpen).toBe(true);
    expect(state.reason).toBe('settled');
    expect(state.isTimedOut).toBe(false);
  });

  it('resets progress back to zero if breathing spikes or becomes unsteady', () => {
    let state = INITIAL_STATE;
    const steadySample: SignalSample = {
      pulseBpm: 68,
      breathingRate: 12,
      signalQuality: 0.85,
      timestampMs: 1000,
      isStable: true,
    };

    // 4 seconds of steady breathing (progress reaches 40%)
    for (let i = 0; i < 4; i++) {
      state = evaluateSettleGate(steadySample, morningConfig, state, 1000);
    }
    expect(state.progress).toBeCloseTo(0.4, 2);

    // Sudden rapid erratic breathing (24 br/min)
    const erraticSample: SignalSample = {
      pulseBpm: 85,
      breathingRate: 24,
      signalQuality: 0.8,
      timestampMs: 5000,
      isStable: false,
    };

    state = evaluateSettleGate(erraticSample, morningConfig, state, 1000);

    expect(state.progress).toBe(0);
    expect(state.continuousHoldMs).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.reason).toBe('unsteady');
  });

  it('never silently opens when signal quality is low and resets hold progress', () => {
    let state = INITIAL_STATE;
    const poorSample: SignalSample = {
      pulseBpm: null,
      breathingRate: null,
      signalQuality: 0.25, // below 0.40 threshold
      timestampMs: 1000,
      isStable: false,
    };

    // Run for 15 seconds under degraded signal
    for (let i = 0; i < 15; i++) {
      state = evaluateSettleGate(poorSample, morningConfig, state, 1000);
      expect(state.isOpen).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.reason).toBe('poor_signal');
    }
  });

  it('force-opens gate at maxTimeoutMs safety valve with clear timeout indicator', () => {
    let state = INITIAL_STATE;
    const erraticSample: SignalSample = {
      pulseBpm: 90,
      breathingRate: 25,
      signalQuality: 0.75,
      timestampMs: 1000,
      isStable: false,
    };

    // Run past maxTimeoutMs (60 seconds)
    state = evaluateSettleGate(erraticSample, morningConfig, state, 60000);

    expect(state.isOpen).toBe(true);
    expect(state.reason).toBe('timeout');
    expect(state.isTimedOut).toBe(true);
    expect(state.progress).toBe(1.0);
  });
});

describe('Settle Gate - Training Mode (Pulse Rest Gate)', () => {
  const trainingConfig: SettleGateConfig = {
    mode: 'pulse',
    baselinePulse: 70,       // Calibrated baseline
    pulseMarginBpm: 10,      // Gate target <= 80 BPM
    minTimeoutMs: 30000,     // Must rest at least 30s
    maxTimeoutMs: 120000,    // Max rest 120s
    holdDurationMs: 3000,    // 3s steady hold once in range
    minSignalQuality: 0.4,
  };

  it('enforces minimum rest time even if pulse drops immediately', () => {
    let state = INITIAL_STATE;
    const lowPulseSample: SignalSample = {
      pulseBpm: 72, // Already near baseline
      breathingRate: 15,
      signalQuality: 0.9,
      timestampMs: 1000,
      isStable: true,
    };

    // Advance 15 seconds (less than 30s minTimeout)
    state = evaluateSettleGate(lowPulseSample, trainingConfig, state, 15000);

    expect(state.isOpen).toBe(false);
    expect(state.reason).toBe('min_rest');
    expect(state.progress).toBe(0);
  });

  it('stays closed while pulse is elevated above baseline + margin', () => {
    let state = INITIAL_STATE;
    const highPulseSample: SignalSample = {
      pulseBpm: 95, // Above target <= 80 BPM
      breathingRate: 18,
      signalQuality: 0.85,
      timestampMs: 35000,
      isStable: true,
    };

    // Past min rest (35 seconds)
    state = evaluateSettleGate(highPulseSample, trainingConfig, state, 35000);

    expect(state.isOpen).toBe(false);
    expect(state.reason).toBe('elevated_pulse');
    expect(state.progress).toBe(0);
  });

  it('opens gate once past min rest and pulse recovers to baseline margin', () => {
    let state = INITIAL_STATE;

    // 1. Min rest period: 30 seconds
    const elevatedSample: SignalSample = {
      pulseBpm: 92,
      breathingRate: 18,
      signalQuality: 0.9,
      timestampMs: 30000,
      isStable: true,
    };
    state = evaluateSettleGate(elevatedSample, trainingConfig, state, 30000);
    expect(state.isOpen).toBe(false);

    // 2. Pulse drops to 78 BPM (within 70 + 10 = 80 BPM)
    const recoveredSample: SignalSample = {
      pulseBpm: 78,
      breathingRate: 14,
      signalQuality: 0.92,
      timestampMs: 31000,
      isStable: true,
    };

    // Hold for 3 seconds
    state = evaluateSettleGate(recoveredSample, trainingConfig, state, 1000);
    expect(state.isOpen).toBe(false);
    expect(state.reason).toBe('settling');

    state = evaluateSettleGate(recoveredSample, trainingConfig, state, 1000);
    expect(state.isOpen).toBe(false);

    state = evaluateSettleGate(recoveredSample, trainingConfig, state, 1000);
    expect(state.isOpen).toBe(true);
    expect(state.reason).toBe('settled');
    expect(state.isTimedOut).toBe(false);
  });

  it('force-opens at max rest cap with timeout flag', () => {
    let state = INITIAL_STATE;
    const elevatedSample: SignalSample = {
      pulseBpm: 98,
      breathingRate: 20,
      signalQuality: 0.85,
      timestampMs: 120000,
      isStable: true,
    };

    state = evaluateSettleGate(elevatedSample, trainingConfig, state, 120000);

    expect(state.isOpen).toBe(true);
    expect(state.reason).toBe('timeout');
    expect(state.isTimedOut).toBe(true);
  });
});

describe('Baseline Calibrator', () => {
  it('collects valid samples and computes trimmed mean baseline', () => {
    const calibrator = new BaselineCalibrator(5); // 5 second calibration for test

    // Feed 10 samples with a couple outlier glitches
    const pulseSeries = [72, 73, 71, 74, 72, 120 /* artifact */, 73, 71, 45 /* artifact */, 72];
    pulseSeries.forEach((pulse, idx) => {
      calibrator.addSample({
        pulseBpm: pulse,
        breathingRate: 13,
        signalQuality: 0.8,
        timestampMs: 1000 + idx * 500,
        isStable: true,
      });
    });

    const baseline = calibrator.computeBaseline();
    // Trimmed mean rejects the 120 and 45 artifacts, keeping baseline around 72
    expect(baseline.baselinePulse).toBeGreaterThanOrEqual(71);
    expect(baseline.baselinePulse).toBeLessThanOrEqual(74);
    expect(baseline.baselineBreathing).toBe(13);
    expect(baseline.sampleCount).toBe(10);
  });
});
