import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SmartSpectraBridge, SmartSpectraNativeEvent } from '../../native/SmartSpectraBridge';
import { SignalSample } from './types';
import { SignalSmoother, assessSignalQuality } from './smoothing';
import { SimulatedSignal } from './simulatedSignal';

export interface UseSmartSpectraOptions {
  apiKey?: string;
  autoStart?: boolean;
  smoothingAlpha?: number;
}

export function useSmartSpectraSignal(options: UseSmartSpectraOptions = {}) {
  const { apiKey, autoStart = false, smoothingAlpha = 0.25 } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSample, setCurrentSample] = useState<SignalSample | null>(null);
  const [smoothedSample, setSmoothedSample] = useState<SignalSample | null>(null);
  const [sampleHistory, setSampleHistory] = useState<SignalSample[]>([]);

  const smootherRef = useRef(new SignalSmoother(smoothingAlpha));
  const isMountedRef = useRef(true);

  const handleNewSample = useCallback((raw: SignalSample) => {
    if (!isMountedRef.current) return;
    setCurrentSample(raw);

    const smoothed = smootherRef.current.update(raw);
    setSmoothedSample(smoothed);

    setSampleHistory((prev) => {
      // Keep trailing 60 samples (approx. 30-60 seconds)
      const next = [...prev, smoothed];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    smootherRef.current.reset();

    // Check if simulated mode is explicitly on
    if (__DEV__ && SimulatedSignal.isEnabled()) {
      SimulatedSignal.start();
      setIsStreaming(true);
      return;
    }

    try {
      if (!SmartSpectraBridge.isAvailable()) {
        throw new Error(
          'SmartSpectra native module is not available. Please test on an Android build or toggle simulation mode in dev.'
        );
      }
      await SmartSpectraBridge.start(apiKey);
      if (isMountedRef.current) {
        setIsStreaming(true);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to start SmartSpectra camera session');
        setIsStreaming(false);
      }
    }
  }, [apiKey]);

  const stopStream = useCallback(async () => {
    if (__DEV__ && SimulatedSignal.isEnabled()) {
      SimulatedSignal.stop();
      if (isMountedRef.current) {
        setIsStreaming(false);
      }
      return;
    }

    try {
      await SmartSpectraBridge.stop();
    } catch (_err) {
      // Ignore stop errors
    } finally {
      if (isMountedRef.current) {
        setIsStreaming(false);
      }
    }
  }, []);

  // Listen to native events or simulated events
  useEffect(() => {
    let unsubscribeNative: (() => void) | null = null;
    let unsubscribeSim: (() => void) | null = null;

    if (__DEV__ && SimulatedSignal.isEnabled()) {
      unsubscribeSim = SimulatedSignal.subscribe((sample) => {
        handleNewSample(sample);
      });
    } else {
      unsubscribeNative = SmartSpectraBridge.subscribe(
        (nativeEvt: SmartSpectraNativeEvent) => {
          handleNewSample({
            pulseBpm: nativeEvt.pulseBpm,
            breathingRate: nativeEvt.breathingRate,
            signalQuality: nativeEvt.signalQuality,
            timestampMs: nativeEvt.timestampMs,
            isStable: nativeEvt.isStable,
            isSimulated: false,
          });
        }
      );
    }

    return () => {
      if (unsubscribeNative) unsubscribeNative();
      if (unsubscribeSim) unsubscribeSim();
    };
  }, [handleNewSample]);

  // Handle AppState lifecycle (stop stream when backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState !== 'active' && isStreaming) {
          stopStream();
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, [isStreaming, stopStream]);

  // Auto-start if requested
  useEffect(() => {
    isMountedRef.current = true;
    if (autoStart) {
      startStream();
    }
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, [autoStart, startStream, stopStream]);

  const qualityState = assessSignalQuality(smoothedSample);

  return {
    isStreaming,
    error,
    currentSample,
    smoothedSample,
    sampleHistory,
    qualityState,
    startStream,
    stopStream,
  };
}

