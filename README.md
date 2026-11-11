# Repose ("Steady") — Timers that wait for your body

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-green.svg)](https://developer.android.com)
[![SDK: Presage SmartSpectra](https://img.shields.io/badge/SDK-Presage%20SmartSpectra%203.4.0-red.svg)](https://smartspectra.presagetech.com/)
[![DEV Challenge](https://img.shields.io/badge/DEV-presagechallenge-purple.svg)](https://dev.to/challenges/presage)

**Repose** is a React Native mobile application created for the **Presage SmartSpectra SDK Challenge on DEV** (`#presagechallenge`). 

Every standard timer counts down fixed seconds on a mechanical clock. Repose replaces that paradigm with the **"Settle Gate"**: a timer or alarm that cannot finish until your **live physiological signals** (pulse and breathing rate measured through the front camera via the **Presage SmartSpectra SDK**) show that your body has settled.

---

## 🌟 Two Modes, One Biological Mechanic

### 1. 🌅 MORNING MODE: Calm Alarm
- An alarm sounds and **cannot be snoozed or dismissed** until your breathing has been slow, calm, and steady for ~30 continuous seconds (configurable UX threshold).
- Rapid, panicked, or erratic breathing immediately resets the progress ring to zero.
- A configurable safety timeout (e.g. 3 minutes) guarantees you are never locked out if lighting is poor.
- Once the gate unlocks, the alarm silences itself and presents a gentle **Start-of-Day Screen** showing the time, an encouraging prompt, and your first morning task.

### 2. ⚡ TRAINING MODE: Rest Until Ready
- A gym rest timer that ends only when your live pulse returns to within an acceptable margin of **your own calibrated resting baseline** (e.g. $\le$ baseline + 10 BPM)—not after an arbitrary 90 seconds.
- Enforces a minimum rest period (e.g. 30s) for muscular recovery and caps maximum rest (e.g. 2.5 min) with a clear "timed out" indicator.
- Automatically records and charts your set-by-set "time-to-baseline" recovery curve across the session to track fatigue.

---

## 🛠 Tech Stack & Architecture

- **Framework:** React Native (Bare Workflow, New Architecture ready) + TypeScript
- **Target Platform:** Android (minSdk 28+, CameraX, Kotlin 2.2+)
- **Biometric Engine:** Presage SmartSpectra Android SDK (`com.presagetech:smartspectra:3.4.0` via Maven Central)
- **Local Storage:** Local-only `@react-native-async-storage/async-storage` (zero cloud databases, zero third-party analytics)

### Project Directory Structure
```
Repose/
├── android/                      # Native Android project linking SmartSpectra
│   └── app/src/main/java/com/repose/app/
│       ├── MainActivity.kt
│       ├── MainApplication.kt
│       ├── SmartSpectraModule.kt # Kotlin native bridge to SmartSpectraSdk.shared
│       └── SmartSpectraPackage.kt
├── native/                       # TypeScript bridge interface
│   ├── SmartSpectraBridge.ts     # Native module method & event definitions
│   └── README.md
├── src/
│   ├── signals/                  # Signal ingestion, smoothing & calibration
│   │   ├── types.ts              # SignalSample, BaselineMetrics & thresholds
│   │   ├── smoothing.ts          # Outlier filtering & Exponential Moving Average
│   │   ├── baselineCalibration.ts# 30s trimmed-mean baseline calibrator
│   │   ├── useSmartSpectraSignal.ts # Primary React Hook
│   │   └── simulatedSignal.ts    # Dev-only simulation provider (strictly __DEV__)
│   ├── gate/                     # The Settle Gate pure evaluation engine
│   │   ├── types.ts              # SettleGateConfig & SettleGateState
│   │   ├── settleGateLogic.ts    # Pure math & state transition logic
│   │   └── useSettleGate.ts      # React hook driving UI progress loops
│   ├── storage/                  # Local session & set records
│   │   ├── types.ts              # WorkoutSessionRecord & WorkoutSetRecord
│   │   └── workoutStorage.ts     # Local persistence & analytics
│   ├── alarm/                    # Alarm scheduling & config persistence
│   │   └── alarmScheduler.ts
│   ├── consent/                  # Transparent consent & permanent wipe
│   │   └── consentManager.ts
│   └── screens/                  # Application screens
│       ├── ConsentScreen.tsx
│       ├── CalibrationScreen.tsx
│       ├── HomeScreen.tsx
│       ├── MorningAlarmSetupScreen.tsx
│       ├── MorningRingingScreen.tsx
│       ├── StartOfDayScreen.tsx
│       ├── TrainingRestScreen.tsx
│       ├── HistoryScreen.tsx
│       ├── SettingsScreen.tsx
│       └── DebugSignalScreen.tsx
└── __tests__/                    # Comprehensive Jest unit test suites
```

---

## 🔬 Real SDK Field Mapping

The native module binds directly to the Presage SmartSpectra SDK's `MeasurementWithConfidence` protobuf payload:

| JavaScript Event Field | Native SDK Source (Kotlin) | Description |
| :--- | :--- | :--- |
| `pulseBpm` | `metrics.cardio.pulseRateList.last.value` | Live pulse rate in BPM (null during initial warm-up) |
| `breathingRate` | `metrics.breathing.rateList.last.value` | Respiration rate in breaths per minute |
| `signalQuality` | `(confidence / 100.0)` | Normalized confidence score $[0.0, 1.0]$ |
| `timestampMs` | `timestampUs / 1000L` | Microsecond epoch converted to milliseconds |
| `isStable` | `proto.stable` | Boolean flag indicating SDK accuracy standard met |

---

## 🔒 Consent, Privacy & Telemetry Disclosures

Repose was built from day one to respect user privacy:

1. **Active Session Bounds:** The camera runs **ONLY** during an active session (calibration, ringing alarm, or gym rest). It is strictly halted whenever the app is paused or sent to the background (`onHostPause()`). A prominent red **`CAMERA ON`** indicator is always visible during active streaming.
2. **100% On-Device Processing:** Optical rPPG frames, chest motion traces, and facial tracking are processed entirely on-device by the SmartSpectra neural runtime. **Raw video and biometric frames never leave your device.**
3. **Presage SDK Telemetry:** The SmartSpectra SDK transmits a single anonymous diagnostic summary once per session to Presage's servers. This packet contains only non-identifying technical metadata (SDK build version, commit hash, platform identifier, session outcome) to monitor crash rates and platform stability. It contains zero biometrics or personal identifiers.
4. **Permanent Data Wipe:** You can permanently delete all local baselines, workout history, and preferences at any time by pressing **"Delete All My Data"** in Settings.
5. **No Medical Claims:** Steady is intended strictly for personal wellness, biofeedback, and timer convenience. It does not diagnose, treat, or provide medical advice.

---

## 📱 Platform Limitations & Honest Architecture

Modern mobile operating systems strictly prohibit applications from running the camera feed while in the background or while the screen is locked:
- **Our Approach:** At your scheduled alarm time, Steady sounds a high-priority alarm notification with sound and vibration.
- **Foreground Wake:** Tapping the notification brings Steady into the foreground, where the front camera initializes and activates the breathing Settle Gate.
- **Documentation:** This platform boundary is documented honestly in the app UI, here in the README, and in the submission post.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ & npm 11+
- Java Development Kit (JDK 17+)
- Android Studio with Android SDK 34/35 (`minSdk 28`)
- Physical Android device connected with USB debugging (or Android Emulator with webcam enabled)

### 1. Clone & Install
```bash
git clone https://github.com/Yasir-Raees/Repose.git
cd Repose
npm install
```

### 2. Configure Your Presage API Key
1. Register for an API key at [Presage Physiology Portal](https://physiology.presagetech.com/auth/register).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and add your key:
   ```env
   PRESAGE_API_KEY=your_actual_presage_api_key_here
   ENABLE_SIMULATED_SIGNAL=false
   ```
   *(Note: `.env` is gitignored and will never be committed).*

### 3. Run on Android
```bash
# Start the Metro bundler
npm start

# In a separate terminal, build and run on your Android device
npm run android
```

---

## 🧪 Testing

Repose includes 17 unit tests across 5 test suites verifying gate logic, outlier rejection, baseline calculations, and storage persistence:

```bash
npm test
```

### Test Coverage Highlights:
- **`__tests__/SignalStream.test.ts`**: Signal smoothing, physiological bounds filtering (35-220 BPM), and optical quality assessment.
- **`__tests__/SettleGate.test.ts`**: Steady breathing hold advancement, instantaneous reset on erratic breathing, low-signal hold, min-rest enforcement, baseline margin matching, and safety timeout fallbacks.
- **`__tests__/WorkoutStorage.test.ts`**: Session persistence, set recovery time math, and data deletion.
- **`__tests__/AlarmScheduler.test.ts`**: Alarm time calculation and configuration persistence.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Steady is for wellness and convenience only. It does not diagnose, treat, or give medical advice.*
