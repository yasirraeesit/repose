import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { ConsentScreen } from './src/screens/ConsentScreen';
import { CalibrationScreen } from './src/screens/CalibrationScreen';
import { TrainingRestScreen } from './src/screens/TrainingRestScreen';
import { MorningAlarmSetupScreen } from './src/screens/MorningAlarmSetupScreen';
import { MorningRingingScreen } from './src/screens/MorningRingingScreen';
import { StartOfDayScreen } from './src/screens/StartOfDayScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { DebugSignalScreen } from './src/screens/DebugSignalScreen';
import {
  getConsentStatus,
  ConsentStatus,
} from './src/consent/consentManager';
import { loadBaseline } from './src/signals/baselineCalibration';
import { BaselineMetrics } from './src/signals/types';
import {
  MorningAlarmConfig,
  DEFAULT_ALARM_CONFIG,
} from './src/alarm/alarmScheduler';

type AppScreen =
  | 'consent'
  | 'home'
  | 'calibration'
  | 'morning_setup'
  | 'morning_ringing'
  | 'start_of_day'
  | 'training_rest'
  | 'history'
  | 'settings'
  | 'debug';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [activeAlarmConfig, setActiveAlarmConfig] =
    useState<MorningAlarmConfig>(DEFAULT_ALARM_CONFIG);

  useEffect(() => {
    // Check initial consent status
    getConsentStatus().then((status) => {
      setConsent(status);
      if (status === 'pending') {
        setCurrentScreen('consent');
      }
    });

    // Check existing personal baseline
    loadBaseline().then(setBaseline);
  }, []);

  const handleConsentAccepted = () => {
    setConsent('accepted');
    if (!baseline) {
      setCurrentScreen('calibration');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleConsentDeclined = () => {
    setConsent('declined');
    setCurrentScreen('home');
  };

  const handleCalibrationComplete = (newBaseline: BaselineMetrics) => {
    setBaseline(newBaseline);
    setCurrentScreen('home');
  };

  const handleStartAlarmTest = (config: MorningAlarmConfig) => {
    setActiveAlarmConfig(config);
    setCurrentScreen('morning_ringing');
  };

  const handleAlarmGateUnlocked = () => {
    setCurrentScreen('start_of_day');
  };

  const handleDataDeleted = () => {
    setConsent('pending');
    setBaseline(null);
    setCurrentScreen('consent');
  };

  return (
    <SafeAreaProvider>
      {currentScreen === 'consent' && (
        <ConsentScreen
          onConsentAccepted={handleConsentAccepted}
          onConsentDeclined={handleConsentDeclined}
        />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          baseline={baseline}
          consent={consent}
          onSelectMode={(mode) => {
            if (mode === 'morning') setCurrentScreen('morning_setup');
            else if (mode === 'training') {
              if (!baseline) {
                setCurrentScreen('calibration');
              } else {
                setCurrentScreen('training_rest');
              }
            } else if (mode === 'calibration') setCurrentScreen('calibration');
            else if (mode === 'history') setCurrentScreen('history');
            else if (mode === 'settings') setCurrentScreen('settings');
            else if (mode === 'debug') setCurrentScreen('debug');
          }}
        />
      )}

      {currentScreen === 'calibration' && (
        <CalibrationScreen
          onCalibrationComplete={handleCalibrationComplete}
          onCancel={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'training_rest' && (
        <TrainingRestScreen
          baseline={baseline || {
            baselinePulse: 72,
            baselineBreathing: 13,
            calibratedAt: Date.now(),
            sampleCount: 30,
          }}
          onFinishWorkout={() => setCurrentScreen('history')}
          onNavigateHome={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'morning_setup' && (
        <MorningAlarmSetupScreen
          onStartAlarmTest={handleStartAlarmTest}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'morning_ringing' && (
        <MorningRingingScreen
          alarmConfig={activeAlarmConfig}
          onGateUnlocked={handleAlarmGateUnlocked}
        />
      )}

      {currentScreen === 'start_of_day' && (
        <StartOfDayScreen
          firstTask={activeAlarmConfig.firstTask}
          onDone={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'history' && (
        <HistoryScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={() => setCurrentScreen('home')}
          onNavigateCalibration={() => setCurrentScreen('calibration')}
          onDataDeleted={handleDataDeleted}
          onReviewConsent={() => setCurrentScreen('consent')}
        />
      )}

      {currentScreen === 'debug' && <DebugSignalScreen />}
    </SafeAreaProvider>
  );
}
