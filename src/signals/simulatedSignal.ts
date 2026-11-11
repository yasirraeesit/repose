import { SignalSample } from './types';

export type SimulationScenario =
  | 'steady-breathing'
  | 'unsteady-breathing'
  | 'settling-pulse'
  | 'low-quality';

/**
 * Dev-only simulated signal generator.
 * Strictly disabled in production builds.
 */
class SimulatedSignalGenerator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private scenario: SimulationScenario = 'steady-breathing';
  private tickCount = 0;
  private listeners: Set<(sample: SignalSample) => void> = new Set();
  private enabled = false;

  public isEnabled(): boolean {
    if (!__DEV__) return false;
    return this.enabled;
  }

  public setEnabled(enable: boolean) {
    if (!__DEV__) {
      this.enabled = false;
      return;
    }
    this.enabled = enable;
    if (!enable) {
      this.stop();
    }
  }

  public setScenario(scenario: SimulationScenario) {
    this.scenario = scenario;
    this.tickCount = 0;
  }

  public start() {
    if (!__DEV__ || !this.enabled) return;
    if (this.timer) return;

    this.tickCount = 0;
    this.timer = setInterval(() => {
      this.tickCount++;
      const sample = this.generateSample();
      this.listeners.forEach((listener) => listener(sample));
    }, 500); // 2Hz sample update rate
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.tickCount = 0;
  }

  public subscribe(listener: (sample: SignalSample) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private generateSample(): SignalSample {
    const now = Date.now();
    const t = this.tickCount * 0.5; // elapsed seconds

    switch (this.scenario) {
      case 'steady-breathing': {
        // Calm steady breathing around 12 bpm (0.2 Hz)
        const jitter = Math.sin(t * 0.8) * 0.4;
        const breathingRate = Number((12.5 + jitter).toFixed(1));
        const pulseBpm = Number((68 + Math.sin(t * 0.3) * 2).toFixed(1));
        return {
          pulseBpm,
          breathingRate,
          signalQuality: 0.88,
          timestampMs: now,
          isStable: true,
          isSimulated: true,
        };
      }

      case 'unsteady-breathing': {
        // Variable breathing, fluctuating widely
        const erratic = Math.sin(t * 1.5) * 8;
        const breathingRate = Number((20 + erratic).toFixed(1));
        const pulseBpm = Number((82 + Math.cos(t * 0.5) * 6).toFixed(1));
        return {
          pulseBpm,
          breathingRate,
          signalQuality: 0.65,
          timestampMs: now,
          isStable: false,
          isSimulated: true,
        };
      }

      case 'settling-pulse': {
        // Starts post-exercise at 115 bpm, decays exponentially toward baseline 72 bpm
        // Decay constant ~ 25 seconds
        const elevated = 43 * Math.exp(-t / 20);
        const noise = (Math.random() - 0.5) * 1.5;
        const pulseBpm = Number((72 + elevated + noise).toFixed(1));
        const breathingRate = Number((16 + 8 * Math.exp(-t / 25)).toFixed(1));
        return {
          pulseBpm,
          breathingRate,
          signalQuality: 0.92,
          timestampMs: now,
          isStable: true,
          isSimulated: true,
        };
      }

      case 'low-quality': {
        // Degraded signal (bad lighting or face away)
        return {
          pulseBpm: null,
          breathingRate: null,
          signalQuality: 0.22,
          timestampMs: now,
          isStable: false,
          isSimulated: true,
        };
      }
    }
  }
}

export const SimulatedSignal = new SimulatedSignalGenerator();

