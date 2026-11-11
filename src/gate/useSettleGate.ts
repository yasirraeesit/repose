import { useState, useEffect, useRef, useCallback } from 'react';
import { SignalSample } from '../signals/types';
import { SettleGateConfig, SettleGateState } from './types';
import { evaluateSettleGate } from './settleGateLogic';

const INITIAL_GATE_STATE: SettleGateState = {
  progress: 0,
  isOpen: false,
  reason: 'idle',
  elapsedMs: 0,
  continuousHoldMs: 0,
  statusMessage: 'Gate ready.',
  isTimedOut: false,
};

export function useSettleGate(
  signal: SignalSample | null,
  config: SettleGateConfig,
  isActive: boolean = true
) {
  const [gateState, setGateState] = useState<SettleGateState>(INITIAL_GATE_STATE);
  const stateRef = useRef<SettleGateState>(INITIAL_GATE_STATE);
  const lastTickRef = useRef<number>(Date.now());
  const signalRef = useRef<SignalSample | null>(signal);
  const configRef = useRef<SettleGateConfig>(config);

  signalRef.current = signal;
  configRef.current = config;

  const resetGate = useCallback(() => {
    stateRef.current = INITIAL_GATE_STATE;
    lastTickRef.current = Date.now();
    setGateState(INITIAL_GATE_STATE);
  }, []);

  useEffect(() => {
    if (!isActive) {
      resetGate();
      return;
    }

    lastTickRef.current = Date.now();

    // 100ms evaluation tick for smooth progress animations
    const interval = setInterval(() => {
      if (stateRef.current.isOpen) {
        return;
      }

      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      const nextState = evaluateSettleGate(
        signalRef.current,
        configRef.current,
        stateRef.current,
        deltaMs
      );

      stateRef.current = nextState;
      setGateState(nextState);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, resetGate]);

  return {
    ...gateState,
    resetGate,
  };
}
