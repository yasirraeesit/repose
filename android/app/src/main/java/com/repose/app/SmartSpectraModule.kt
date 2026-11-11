package com.repose.app

import android.os.Handler
import android.os.Looper
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.Observer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.presagetech.smartspectra.CameraSelection
import com.presagetech.smartspectra.SmartSpectraConfig
import com.presagetech.smartspectra.SmartSpectraSdk
import com.presagetech.smartspectra.proto.MetricsProto.Metrics
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * React Native bridge module for Presage SmartSpectra SDK.
 * Exposes live pulse (BPM), breathing rate, signal quality, and timestampMs.
 */
class SmartSpectraModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var isRunning = false
    private var listenerCount = 0
    private var metricsObserver: Observer<Metrics?>? = null

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = "SmartSpectraModule"

    override fun getConstants(): MutableMap<String, Any> {
        return hashMapOf(
            "EVENT_NAME" to "onSmartSpectraMetrics"
        )
    }

    @ReactMethod
    fun start(apiKey: String?, promise: Promise) {
        if (isRunning) {
            promise.resolve(true)
            return
        }

        try {
            val sdk = SmartSpectraSdk.shared

            // Configure API key if provided
            if (!apiKey.isNullOrBlank()) {
                sdk.config.apiKey = apiKey
            }

            // Select front-facing camera for face/chest vitals capture
            sdk.useCamera(CameraSelection.Front)

            // Request both breathing and cardiovascular metrics
            sdk.config.requestedMetrics = buildList {
                addAll(SmartSpectraConfig.breathingMetrics)
                addAll(SmartSpectraConfig.cardioMetrics)
            }

            // Set up metrics observation
            setupMetricsObserver(sdk)

            // Start SDK capture and inference pipeline
            moduleScope.launch {
                try {
                    sdk.start()
                    isRunning = true
                    promise.resolve(true)
                } catch (e: Exception) {
                    removeMetricsObserver(sdk)
                    isRunning = false
                    promise.reject("SMARTSPECTRA_START_ERROR", "Failed to start SmartSpectra SDK: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            promise.reject("SMARTSPECTRA_INIT_ERROR", "Initialization error: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        if (!isRunning) {
            promise.resolve(true)
            return
        }

        moduleScope.launch {
            try {
                val sdk = SmartSpectraSdk.shared
                sdk.stop()
                removeMetricsObserver(sdk)
                isRunning = false
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SMARTSPECTRA_STOP_ERROR", "Failed to stop SmartSpectra SDK: ${e.message}", e)
            }
        }
    }

    private fun setupMetricsObserver(sdk: SmartSpectraSdk) {
        if (metricsObserver != null) return

        metricsObserver = Observer<Metrics?> { metrics ->
            if (metrics == null) return@Observer

            try {
                // Extract latest cardio pulse reading
                val pulseReading = if (metrics.hasCardio()) {
                    metrics.cardio.pulseRateList.lastOrNull { it.timestamp > 0 }
                } else null

                // Extract latest breathing reading
                val breathingReading = if (metrics.hasBreathing()) {
                    metrics.breathing.rateList.lastOrNull { it.timestamp > 0 }
                } else null

                val pulseBpm = pulseReading?.value?.takeIf { it > 0f }?.toDouble()
                val breathingRate = breathingReading?.value?.takeIf { it > 0f }?.toDouble()

                // Calculate confidence / signal quality [0.0 - 1.0]
                val confidenceRaw = pulseReading?.confidence ?: breathingReading?.confidence ?: 0f
                val signalQuality = (confidenceRaw / 100.0).coerceIn(0.0, 1.0)

                // Timestamp conversion from microseconds to milliseconds
                val timestampUs = pulseReading?.timestamp
                    ?: breathingReading?.timestamp
                    ?: (System.currentTimeMillis() * 1000L)
                val timestampMs = (timestampUs / 1000L).toDouble()

                val isStable = pulseReading?.stable ?: (breathingReading?.stable ?: false)

                val eventPayload: WritableMap = Arguments.createMap().apply {
                    if (pulseBpm != null) {
                        putDouble("pulseBpm", pulseBpm)
                    } else {
                        putNull("pulseBpm")
                    }

                    if (breathingRate != null) {
                        putDouble("breathingRate", breathingRate)
                    } else {
                        putNull("breathingRate")
                    }

                    putDouble("signalQuality", signalQuality)
                    putDouble("timestampMs", timestampMs)
                    putBoolean("isStable", isStable)
                }

                sendEvent("onSmartSpectraMetrics", eventPayload)
            } catch (e: Exception) {
                // Ignore transient mapping errors
            }
        }

        Handler(Looper.getMainLooper()).post {
            val activity = currentActivity
            if (activity is LifecycleOwner) {
                metricsObserver?.let { sdk.metrics.observe(activity, it) }
            } else {
                metricsObserver?.let { sdk.metrics.observeForever(it) }
            }
        }
    }

    private fun removeMetricsObserver(sdk: SmartSpectraSdk) {
        metricsObserver?.let { observer ->
            Handler(Looper.getMainLooper()).post {
                sdk.metrics.removeObserver(observer)
                metricsObserver = null
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        if (listenerCount > 0 && reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        listenerCount++
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
    }

    override fun onHostResume() {
        // App resumed
    }

    override fun onHostPause() {
        // App paused - stop camera automatically for privacy
        if (isRunning) {
            moduleScope.launch {
                try {
                    val sdk = SmartSpectraSdk.shared
                    sdk.stop()
                    removeMetricsObserver(sdk)
                    isRunning = false
                } catch (_: Exception) {}
            }
        }
    }

    override fun onHostDestroy() {
        if (isRunning) {
            try {
                val sdk = SmartSpectraSdk.shared
                removeMetricsObserver(sdk)
            } catch (_: Exception) {}
        }
        moduleScope.cancel()
    }
}

