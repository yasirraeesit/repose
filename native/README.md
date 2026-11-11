# Native Bridge: Presage SmartSpectra SDK (`/native`)

This folder contains the native bridge interface and documentation connecting the React Native JavaScript layer to the official **Presage SmartSpectra SDK** (`com.presagetech:smartspectra:3.4.0` on Maven Central).

## 1. Exposed Native API

The bridge exposes a minimal, focused surface to JavaScript:

### Methods
- **`start(apiKey?: string): Promise<boolean>`**
  - Initializes the SmartSpectra SDK singleton (`SmartSpectraSdk.shared`).
  - Sets front-facing camera (`CameraSelection.Front`).
  - Requests vital metrics:
    - `SmartSpectraConfig.breathingMetrics`: respiratory rate, chest and abdominal traces.
    - `SmartSpectraConfig.cardioMetrics`: pulse rate plethysmography and arterial pressure traces.
  - Starts video capture and local on-device inference.
  - Resolves `true` when active, or rejects with an error code (e.g., `SMARTSPECTRA_START_ERROR`).

- **`stop(): Promise<boolean>`**
  - Gracefully stops video capture and inference pipeline.
  - Detaches metric observers.
  - Resolves `true` when halted.

### Event Stream (`onSmartSpectraMetrics`)
Emits real-time measurements directly from the underlying protocol buffers (`MeasurementWithConfidence`):

| Property | Type | Unit / Range | Origin |
| :--- | :--- | :--- | :--- |
| `pulseBpm` | `number \| null` | Beats Per Minute (BPM) | `metrics.cardio.pulseRateList.last.value` |
| `breathingRate` | `number \| null` | Breaths Per Minute | `metrics.breathing.rateList.last.value` |
| `signalQuality` | `number` | `0.0` (unusable) to `1.0` (optimal) | `(confidence / 100.0)` |
| `timestampMs` | `number` | Milliseconds since Unix epoch | `timestampUs / 1000` |
| `isStable` | `boolean` | `true` if accuracy standard met | `proto.stable` flag |

---

## 2. Real SDK Field Mapping Details

In Presage SmartSpectra SDK, data is structured as follows:

```protobuf
message MeasurementWithConfidence {
  float value = 1;        // The measured vital sign value
  bool stable = 2;        // Accuracy threshold met (e.g. pulse confidence >= 40, breathing >= 45)
  float confidence = 3;   // Confidence percentage [0.0, 100.0]
  int64 timestamp = 4;    // Microseconds since epoch
}
```

The native module maps these fields into a clean JSON event payload dispatched via React Native's `RCTDeviceEventEmitter`.

---

## 3. Implementation Files
- Android Kotlin Module: `android/app/src/main/java/com/repose/app/SmartSpectraModule.kt`
- Android Package: `android/app/src/main/java/com/repose/app/SmartSpectraPackage.kt`
- TypeScript Interface: `native/SmartSpectraBridge.ts`
- Central Export: `native/index.ts`

