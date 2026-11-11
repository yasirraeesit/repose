import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  EmitterSubscription,
} from 'react-native';

export interface SmartSpectraNativeEvent {
  /** Pulse rate in Beats Per Minute (BPM), or null during initial warm-up */
  pulseBpm: number | null;
  /** Respiratory rate in breaths per minute, or null during initial warm-up */
  breathingRate: number | null;
  /** Signal confidence score, normalized from 0.0 (unusable) to 1.0 (optimal) */
  signalQuality: number;
  /** Unix epoch timestamp in milliseconds */
  timestampMs: number;
  /** Whether the measurement currently satisfies SDK accuracy thresholds */
  isStable: boolean;
}

export interface ISmartSpectraModule {
  start(apiKey?: string): Promise<boolean>;
  stop(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const { SmartSpectraModule } = NativeModules;

const eventEmitter = SmartSpectraModule
  ? new NativeEventEmitter(SmartSpectraModule)
  : null;

export const EVENT_NAME = 'onSmartSpectraMetrics';

/**
 * Low-level bridge client for Presage SmartSpectra SDK.
 */
export const SmartSpectraBridge = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && SmartSpectraModule !== null && SmartSpectraModule !== undefined;
  },

  async start(apiKey?: string): Promise<boolean> {
    if (!SmartSpectraModule) {
      throw new Error(
        'SmartSpectraModule is not linked in native runtime. Ensure Android build includes SmartSpectraPackage.'
      );
    }
    return await SmartSpectraModule.start(apiKey || '');
  },

  async stop(): Promise<boolean> {
    if (!SmartSpectraModule) {
      return true;
    }
    return await SmartSpectraModule.stop();
  },

  subscribe(
    onMetric: (event: SmartSpectraNativeEvent) => void
  ): () => void {
    if (!eventEmitter) {
      return () => {};
    }

    const subscription: EmitterSubscription = eventEmitter.addListener(
      EVENT_NAME,
      (...args: any[]) => {
        if (args.length > 0) {
          onMetric(args[0] as SmartSpectraNativeEvent);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  },
};
