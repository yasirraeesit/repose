# Repose ("Steady") — Official Demo Video Script
**Target Video Duration:** ~2 minutes 45 seconds  
**Challenge:** Presage SmartSpectra SDK Challenge on DEV (#presagechallenge)  
**Target Category:** Best Thoughtful Real-World Use (Eligible: Most Creative or Delightful Use)  

---

## Equipment & Prep Checklist Before Recording
1. **Physical Android Device** with front camera connected or running on Android Studio Emulator with virtual webcam enabled.
2. Front-facing camera clean, with even, diffuse front lighting (avoid direct harsh backlighting).
3. `ENABLE_SIMULATED_SIGNAL=false` in `.env` (Ensuring **LIVE SmartSpectra SDK** is active with zero simulated badges).
4. Microphone set up for voiceover.

---

## Detailed Shot List & Visual Cue Timeline

### [0:00 - 0:25] Scene 1: The Concept & Live Consent Flow
- **Visual:** Open Repose on Android device. The app presents the dark, calming **Consent Screen**.
- **Action:**
  - Show the plain-language consent explaining when camera is used (active sessions only), on-device biometrics processing, Presage SDK telemetry disclosure, and zero medical claims.
  - Tap **"I CONSENT & ENABLE CAMERA"**.
  - Camera permission dialog appears and is accepted.
- **Voiceover Narration:**
  > *"Every timer on your phone counts down arbitrary seconds on a mechanical clock. But our bodies don’t run on fixed seconds. Repose is a mobile app powered by the Presage SmartSpectra SDK that introduces the 'Settle Gate'—a timer that only unlocks when your live physiology proves you have settled."*

---

### [0:25 - 0:50] Scene 2: Personal Baseline Calibration
- **Visual:** Transition into the **Baseline Calibration Screen**.
- **Action:**
  - The front camera illuminates; the red **`CAMERA ON (CALIBRATING)`** badge lights up.
  - Position face centered in frame. The progress circle begins filling from 0% toward 100%.
  - Show real-time live pulse and breathing values updating in the cards below.
  - The calibration finishes and locks in personal baseline vitals: e.g. **Resting Pulse: 72 BPM**, **Resting Breathing: 13 BR/M**.
  - Tap **"APPLY & CONTINUE"** to enter the Home Dashboard.
- **Voiceover Narration:**
  > *"Because everyone has a unique physiology, Repose begins with a 30-second resting calibration. Using contactless remote photoplethysmography and respiration motion tracking, it establishes your personal baseline—stored strictly locally on your device."*

---

### [0:50 - 1:40] Scene 3: Mode 1 — Morning Calm Alarm
- **Visual:** On Home screen, select **Morning Mode: Calm Alarm**. Show the alarm settings (07:00 AM, 30s steady breathing hold, 3m safety max timeout).
- **Action:**
  - Tap **"🔔 TEST CALM ALARM GATE NOW"** to launch the active ringing flow.
  - The screen flashes red with **"🔔 MORNING ALARM RINGING"**. Pulsing vibration and alarm audio engage.
  - Point to the **Dismiss** button: it is visibly locked: **`🔒 LOCKED (0% STEADY)`**. Tapping it does nothing.
  - Begin breathing fast or erratically. The live breathing readout climbs (e.g. 24 BR/M). The progress ring stays at 0% with warning: *"Take slow, steady breaths to fill the ring."*
  - Now, look into the camera and take slow, deep, calm breaths (around 12-14 BR/M).
  - Watch the gold progress ring fill steadily: 25%... 50%... 75%... 100%!
  - Once 30 seconds of steady breathing are achieved, the gate flashes emerald green: **`✓ SETTLE GATE OPENED - ALARM SILENCED`**.
  - The alarm sound immediately terminates.
  - Tap **"BEGIN YOUR DAY →"** to reveal the gentle **Start of Day Screen** showing current time and the first task: *"Drink a glass of water and stretch"*. Check the task done.
- **Voiceover Narration:**
  > *"In Morning mode, standard snooze buttons don't exist. An alarm cannot be dismissed while you're groggy or panicking. The Settle Gate requires ~30 continuous seconds of slow, regulated breathing in front of the camera. If you breathe too fast or look away, the ring resets. When you calm your body, the alarm silences itself, transitioning gently into your day."*

---

### [1:40 - 2:25] Scene 4: Mode 2 — Training Rest ("Rest Until Ready")
- **Visual:** Return to Home screen and select **Training Mode: Rest Until Ready**.
- **Action:**
  - Start Set 1 Rest. Show Set 1 badge and live camera active indicator.
  - Show initial post-exercise pulse reading (e.g. 108 BPM). Target ceiling is displayed clearly: `Target: ≤ 82 BPM (Baseline 72 + 10 margin)`.
  - Notice the **Minimum Rest Banner**: *"Minimum rest period active (18s remaining)"*. The button remains disabled.
  - Once min-rest expires, pulse is shown gradually dropping as the user sits calmly: 96 BPM... 88 BPM... 81 BPM.
  - The moment pulse enters the personal baseline zone (≤ 82 BPM) and holds for 4 seconds, the gate unlocks with haptic feedback: **`✓ READY FOR NEXT SET`**.
  - Tap **"START NEXT SET →"** to record Set 1 and start Set 2.
  - Complete Set 2, then tap **"FINISH WORKOUT"**.
- **Voiceover Narration:**
  > *"In Training mode, instead of resting for an arbitrary 90 seconds, Repose waits for your cardiovascular system to return to within a margin of your own calibrated baseline. It enforces a safety minimum rest, caps maximum rest, and automatically logs your precise time-to-baseline recovery."*

---

### [2:25 - 2:45] Scene 5: Recovery History & Data Privacy
- **Visual:** Navigate to **Recovery History Screen** and **Settings Screen**.
- **Action:**
  - Show the set-by-set horizontal bar chart displaying recovery time trends (e.g. Set 1: 44s, Set 2: 58s).
  - Open **Settings Screen**: show camera consent status, zero cloud biometrics disclosure, and tap **"DELETE ALL MY DATA"** to prove immediate, permanent local wipe.
- **Voiceover Narration:**
  > *"Repose tracks recovery fatigue across your session without uploading a single video frame or biometric point to the cloud. You have complete control to wipe all data anytime. Repose: timers that wait for your body."*

