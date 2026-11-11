import { SignalSmoother, assessSignalQuality } from '../src/signals/smoothing';
import { QUALITY_THRESHOLDS, SignalSample } from '../src/signals/types';
import { SmartSpectraBridge, SmartSpectraNativeEvent } from '../native/SmartSpectraBridge';
import { NativeModules } from 'react-native';

describe('SmartSpectra Signal Stream & Smoothing Pipeline', () => {
  it('correctly assesses signal quality thresholds', () => {
    const poorSample: SignalSample = {
      pulseBpm: null,
      breathingRate: null,
      signalQuality: 0.2,
      timestampMs: Date.now(),
      isStable: false,
    };
    const poorAssessment = assessSignalQuality(poorSample);
    expect(poorAssessment.isQualityAcceptable).toBe(false);
    expect(poorAssessment.guidanceMessage).toContain('lighting');

    const goodSample: SignalSample = {
      pulseBpm: 72,
      breathingRate: 14,
      signalQuality: 0.85,
      timestampMs: Date.now(),
      isStable: true,
    };
    const goodAssessment = assessSignalQuality(goodSample);
    expect(goodAssessment.isQualityAcceptable).toBe(true);
    expect(goodAssessment.hasFace).toBe(true);
    expect(goodAssessment.isAdequatelyLit).toBe(true);
  });

  it('smoothes incoming noisy samples and rejects non-physiological outliers', () => {
    const smoother = new SignalSmoother(0.5);

    // Initial reading
    const s1 = smoother.update({
      pulseBpm: 70,
      breathingRate: 12,
      signalQuality: 0.8,
      timestampMs: 1000,
      isStable: true,
    });
    expect(s1.pulseBpm).toBe(70);
    expect(s1.breathingRate).toBe(12);

    // Step change with noise
    const s2 = smoother.update({
      pulseBpm: 80,
      breathingRate: 16,
      signalQuality: 0.8,
      timestampMs: 1500,
      isStable: true,
    });
    // With alpha 0.5, smoothed = 0.5 * 80 + 0.5 * 70 = 75
    expect(s2.pulseBpm).toBe(75);
    expect(s2.breathingRate).toBe(14);

    // Non-physiological glitch sample (> 220 bpm)
    const s3 = smoother.update({
      pulseBpm: 999,
      breathingRate: 99,
      signalQuality: 0.2,
      timestampMs: 2000,
      isStable: false,
    });
    // Outliers are rejected, returning previous smoothed state
    expect(s3.pulseBpm).toBe(75);
    expect(s3.breathingRate).toBe(14);
  });

  it('demonstrates realistic live stream log matching Presage SmartSpectra SDK proto format', () => {
    const smoother = new SignalSmoother(0.3);
    const mockSdkStream: SmartSpectraNativeEvent[] = [
      {
        pulseBpm: 78.4,
        breathingRate: 14.1,
        signalQuality: 0.62,
        timestampMs: 1731333000000,
        isStable: true,
      },
      {
        pulseBpm: 76.8,
        breathingRate: 13.9,
        signalQuality: 0.74,
        timestampMs: 1731333000500,
        isStable: true,
      },
      {
        pulseBpm: 75.1,
        breathingRate: 13.5,
        signalQuality: 0.82,
        timestampMs: 1731333001000,
        isStable: true,
      },
      {
        pulseBpm: 73.6,
        breathingRate: 13.2,
        signalQuality: 0.88,
        timestampMs: 1731333001500,
        isStable: true,
      },
      {
        pulseBpm: 72.0,
        breathingRate: 12.8,
        signalQuality: 0.91,
        timestampMs: 1731333002000,
        isStable: true,
      },
    ];

    const streamLogs: string[] = [];
    mockSdkStream.forEach((evt) => {
      const smoothed = smoother.update({
        ...evt,
        isSimulated: false,
      });
      const logLine = `[SmartSpectra] time=${smoothed.timestampMs} pulse=${smoothed.pulseBpm} bpm, breathing=${smoothed.breathingRate} br/m, quality=${(smoothed.signalQuality * 100).toFixed(0)}%, stable=${smoothed.isStable}`;
      streamLogs.push(logLine);
      expect(smoothed.pulseBpm).toBeGreaterThan(70);
      expect(smoothed.pulseBpm).toBeLessThan(80);
      expect(smoothed.signalQuality).toBeGreaterThanOrEqual(
        QUALITY_THRESHOLDS.MIN_ACCEPTABLE_QUALITY
      );
    });

    expect(streamLogs.length).toBe(5);
  });
});

