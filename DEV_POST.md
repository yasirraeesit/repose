---
title: "Repose: Timers that wait for your body (Calm Alarm & Rest Until Ready)"
published: true
tags: devchallenge, presagechallenge, reactnative, android
cover_image: https://raw.githubusercontent.com/Yasir-Raees/Repose/main/docs/assets/cover.png
canonical_url: https://dev.to/yasirraees/repose-timers-that-wait-for-your-body
description: "A React Native app using live Presage SmartSpectra signals where timers and alarms cannot finish until your live physiology settles."
---

*This article is submitted for the [Presage SmartSpectra SDK Challenge on DEV](https://dev.to/challenges/presage) under the **Best Thoughtful Real-World Use** and **Most Creative or Delightful Use** categories.*

---

## 💡 What I Built

Every timer on your smartphone is fundamentally mechanical: it counts down arbitrary wall-clock seconds. But our bodies do not operate on mechanical clocks. 

- When waking up, slamming snooze on an alarm leaves you in sleep inertia and adrenaline spikes.
- When lifting weights or performing intervals, resting for an arbitrary 90 seconds either cuts you off before your cardiovascular system has recovered or wastes time when you are already primed.

**Repose** is a mobile application built with React Native and native Android Kotlin that replaces arbitrary fixed timers with a shared biological mechanic: the **"Settle Gate"**. A timer or alarm cannot complete until your **live physiological signals** measured through the front camera via the **Presage SmartSpectra SDK** prove your body has actually settled.

Repose operates in two primary modes:

1. **🌅 MORNING MODE (Calm Alarm):**  
   The alarm rings and **cannot be snoozed or dismissed** until your breathing has been slow, calm, and continuous for ~30 seconds (configurable). If you panic, breathe frantically, or look away, the progress ring resets to zero. A safety max-ring timeout prevents lockout. Once the gate unlocks, the alarm silences itself and presents a gentle start-of-day screen with your first task.

2. **⚡ TRAINING MODE (Rest Until Ready):**  
   A gym rest timer that ends only when your live pulse returns to within an acceptable margin of **your own calibrated resting baseline** (e.g. $\le$ baseline + 10 BPM)—not after a fixed number of seconds. It enforces a minimum rest period for muscular recovery, caps maximum rest, and automatically charts your "time-to-baseline" recovery curve across sets.

---

## 🎥 Demo

Watch the full 2.5-minute video walkthrough demonstrating the live SmartSpectra SDK optical signals, gate progress filling, reset behavior, and recovery charts:

{% embed https://youtu.be/your-demo-video-id %}

### Key Moments in the Demo:
- **0:15** — Plain-language Camera Consent flow and privacy disclosures.
- **0:38** — Live 30-second resting baseline calibration showing real-time rPPG pulse and respiratory motion.
- **1:05** — Morning Alarm ringing with locked dismissal; rapid breathing keeps gate locked at 0%; transitioning to slow, steady breathing fills the gate and silences the alarm.
- **1:52** — Training Rest timer: pulse tracking down from post-exercise elevation (108 BPM) toward personal baseline (72 BPM); gate unlocks when recovery is confirmed.
- **2:30** — Set-by-set recovery time fatigue chart and permanent data deletion in Settings.

---

## 💻 Code Repository

The complete source code is public and open-source under the MIT License:

👉 **[GitHub: Yasir-Raees/Repose](https://github.com/Yasir-Raees/Repose)**

### Repository Architecture:
- `/android`: Bare Android native project linking `com.presagetech:smartspectra:3.4.0` via Maven Central.
- `/android/app/src/main/java/com/repose/app/SmartSpectraModule.kt`: Thin native Kotlin bridge exposing `start()`, `stop()`, and emitting `onSmartSpectraMetrics`.
- `/native`: TypeScript bridge interface mapping protobuf `MeasurementWithConfidence` telemetry to React Native.
- `/src/signals`: Signal smoothing (exponential moving average), physiological outlier filtering, and 30-second baseline calibrator.
- `/src/gate`: Pure Settle Gate evaluation logic (`evaluateSettleGate`) and `useSettleGate` React hook.
- `/src/screens`: Consent, Baseline Calibration, Home mode picker, Morning setup/ringing/start-of-day, Training rest, Recovery history, Settings, and Live Signal Monitor.
- `/src/storage`: Local-only persistence using AsyncStorage for sessions and sets.

---

## 🫀 How It Responds to Human Signals

Repose integrates the **Presage SmartSpectra Android SDK** directly through its official Maven Central release (`com.presagetech:smartspectra:3.4.0`), leveraging front-facing camera remote photoplethysmography (rPPG) and respiratory micro-motion detection:

```
[Camera Stream] ──> [SmartSpectra SDK (On-Device)] 
                         │
                         ├──> Cardio PPG: pulseRateList (MeasurementWithConfidence)
                         └──> Respiration: rateList (MeasurementWithConfidence)
                                  │
[Native Kotlin Bridge] ───────────┘
         │
         ▼ (Emits: { pulseBpm, breathingRate, signalQuality, timestampMs, isStable })
[JS Signal Pipeline]
         │
         ├──> Exponential Moving Average (alpha = 0.25)
         ├──> Outlier Filter (35 ≤ BPM ≤ 220, 4 ≤ BR/M ≤ 40)
         └──> Quality Gate (Confidence ≥ 40%)
                   │
                   ▼
         [The Settle Gate]
         ├── Morning: Continuous steady breathing in [8, 16] BR/M for 30s
         └── Training: Pulse ≤ (Personal Baseline + Margin) after Min-Rest
```

### 1. Protobuf Field Mapping
The native bridge extracts metrics from the SDK's `MeasurementWithConfidence` protobuf payload:
- `pulseBpm`: `metrics.cardio.pulseRateList.lastOrNull { it.timestamp > 0 }?.value`
- `breathingRate`: `metrics.breathing.rateList.lastOrNull { it.timestamp > 0 }?.value`
- `signalQuality`: Normalized from `confidence / 100.0` (where $\ge 40\%$ satisfies SDK stability standards).
- `timestampMs`: Microsecond timestamps converted to epoch milliseconds (`timestamp / 1000L`).
- `isStable`: Boolean indicator matching the SDK accuracy threshold.

### 2. The Settle Gate Mechanic
- **Continuous Hold Requirement:** The Morning gate does not advance on a single calm breath. It requires a continuous hold (default: 30 seconds). If breathing becomes irregular or rapid, or if the user turns away from the camera, the hold resets to zero.
- **Personal Baseline Normalization:** Instead of judging heart rate by generic population tables, the Training gate requires a 30-second calibration. Recovery is defined as returning to **within 10 BPM of your own resting baseline**.
- **Quality Gating:** Degraded frames (poor lighting, face partially obscured) never silently advance the gate. The UI provides real-time coaching ("Center face in frame", "Increase lighting") and holds progress until optimal optical tracking is restored.

---

## 🏆 Prize Categories

### 1. Primary: Best Thoughtful Real-World Use
Repose directly tackles two universal everyday pain points:
- **Sleep Inertia & Morning Stress:** Research shows waking up to loud, panicked alarms triggers cortisol spikes and grogginess. Forcing 30 seconds of slow, regulated breathing before dismissing the alarm activates the parasympathetic nervous system, ensuring you leave bed in a calm, intentional state.
- **Autoregulated Gym Recovery:** Fixed 90-second rest timers ignore cardiovascular fatigue. Repose autoregulates rest periods based on true physiological recovery, showing lifters their recovery curves across sets and preventing overtraining.

### 2. Secondary: Most Creative or Delightful Use
Inverting the traditional timer paradigm—where the human waits on the clock, to where the clock waits on the human body—creates an inherently delightful biofeedback loop. Watching a glowing progress ring fill only as you calm your breathing turns a stressful morning alarm into a mindful morning ritual.

---

## 🔒 Consent and Data Handling

Repose was engineered with strict privacy principles and transparent data governance:

1. **When Camera is Used:** The front camera operates **strictly during active user sessions** (30s calibration, ringing alarm, or rest period). It is automatically halted on `onHostPause()`. A bright red **`CAMERA ON`** indicator is always visible during active capture.
2. **100% On-Device Biometrics:** All optical video frames, facial tracking landmarks, and physiological signals are processed locally on the device using the SmartSpectra neural runtime. **Zero video frames or biometric waveforms are ever uploaded to any cloud server.**
3. **SDK Telemetry Disclosure:** The SmartSpectra SDK transmits a single anonymous diagnostic summary once per session to Presage's servers. This summary includes only non-identifying technical metadata (SDK version, commit hash, platform identifier, session success/fail status) for reliability monitoring. Telemetry contains zero biometrics or personal identifiers.
4. **Local-Only Storage:** Session logs, set recovery times, and baseline metrics are saved exclusively in local AsyncStorage. No cloud accounts, third-party trackers, or analytics packages exist.
5. **Right to Deletion:** Users can permanently delete all baselines, workout records, and preferences at any time with a single tap of **"Delete All My Data"** in Settings.
6. **No Medical Claims:** Repose is designed solely for wellness, biofeedback, and convenience. Output is strictly descriptive (e.g. "time to return to personal baseline"). It does not diagnose, treat, or provide medical advice.
7. **Self-Use Only:** Repose is strictly built for individual self-monitoring.

---

## 📱 Platform Limitations & Honest Architecture

Modern mobile operating systems (Android and iOS) enforce strict security sandboxes that prohibit applications from accessing the camera feed while running in the background or when the phone screen is locked. 

Rather than pretending this limitation does not exist, Repose handles it honestly:
- **Morning Alarm Flow:** At the scheduled alarm time, Steady fires a high-priority alarm notification with sound and vibration.
- **Foreground Wake:** Tapping the notification or launching the app immediately brings Steady into the foreground, where the front camera initializes and engages the breathing Settle Gate.
- **Transparent Communication:** This behavior is documented clearly in the app's setup screen, in the repository README, and in this submission.

---

## 🤖 Agent Session

Repose was developed autonomously using **Google Antigravity** (`agy`), following rigorous test-driven development:
- **Research Phase:** Analyzed the Presage SmartSpectra C++, Swift, and Android SDK specifications, confirming that no official React Native package existed and choosing Android Kotlin with Maven Central distribution (`com.presagetech:smartspectra:3.4.0`).
- **Bridge Construction:** Built a lightweight Android native module bridging live Protobuf vitals directly into React Native's event emitter.
- **Verification:** Authored 17 unit tests across 5 test suites covering gate hold logic, unsteady resets, low-quality holds, safety timeout fallbacks, baseline trimmed means, and local storage persistence.

---

*Steady is for wellness and convenience only. It does not diagnose, treat, or give medical advice.*

