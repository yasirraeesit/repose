import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  MorningAlarmConfig,
  DEFAULT_ALARM_CONFIG,
  loadAlarmConfig,
  saveAlarmConfig,
} from '../alarm/alarmScheduler';

interface MorningAlarmSetupScreenProps {
  onStartAlarmTest: (config: MorningAlarmConfig) => void;
  onBack?: () => void;
}

export const MorningAlarmSetupScreen: React.FC<MorningAlarmSetupScreenProps> = ({
  onStartAlarmTest,
  onBack,
}) => {
  const [config, setConfig] = useState<MorningAlarmConfig>(DEFAULT_ALARM_CONFIG);
  const [customTime, setCustomTime] = useState('07:00');
  const [firstTask, setFirstTask] = useState('Drink a glass of water and stretch');

  useEffect(() => {
    loadAlarmConfig().then((loaded) => {
      setConfig(loaded);
      setCustomTime(loaded.timeString);
      setFirstTask(loaded.firstTask);
    });
  }, []);

  const handleSave = async () => {
    const updated: MorningAlarmConfig = {
      ...config,
      timeString: customTime,
      firstTask,
    };
    setConfig(updated);
    await saveAlarmConfig(updated);
    Alert.alert('Alarm Saved', `Calm Alarm set for ${customTime}.`);
  };

  const handleTestNow = () => {
    const updated: MorningAlarmConfig = {
      ...config,
      timeString: customTime,
      firstTask,
    };
    onStartAlarmTest(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.modeTag}>MORNING MODE</Text>
          <Text style={styles.title}>Calm Alarm Setup</Text>
        </View>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Alarm Enable Row */}
        <View style={styles.cardRow}>
          <View>
            <Text style={styles.cardTitle}>Enable Calm Alarm</Text>
            <Text style={styles.cardSub}>
              Locks dismissal until steady breathing is confirmed
            </Text>
          </View>
          <Switch
            value={config.isEnabled}
            onValueChange={(val) => setConfig({ ...config, isEnabled: val })}
            trackColor={{ false: '#334155', true: '#2563eb' }}
            thumbColor={config.isEnabled ? '#ffffff' : '#94a3b8'}
          />
        </View>

        {/* Time Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ALARM TIME</Text>
          <View style={styles.timeInputRow}>
            <TextInput
              style={styles.timeInput}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="07:00"
              placeholderTextColor="#64748b"
              maxLength={5}
            />
            <Text style={styles.timeFormatHint}>24-hour format (HH:MM)</Text>
          </View>

          {/* Quick Preset Buttons */}
          <View style={styles.timeChipsRow}>
            {['06:30', '07:00', '07:30', '08:00'].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.timeChip,
                  customTime === preset && styles.timeChipActive,
                ]}
                onPress={() => setCustomTime(preset)}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    customTime === preset && styles.timeChipTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continuous Steady Breathing Hold Target */}
        <View style={styles.card}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>SETTLE GATE HOLD DURATION</Text>
            <Text style={styles.cardValueHighlight}>
              {config.holdDurationSeconds}s
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            Continuous seconds your breathing must remain slow and steady before
            the alarm can be silenced. (Configurable UX threshold).
          </Text>

          <View style={styles.chipsRow}>
            {[15, 20, 30, 45, 60].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[
                  styles.chip,
                  config.holdDurationSeconds === sec && styles.chipActive,
                ]}
                onPress={() => setConfig({ ...config, holdDurationSeconds: sec })}
              >
                <Text
                  style={[
                    styles.chipText,
                    config.holdDurationSeconds === sec && styles.chipTextActive,
                  ]}
                >
                  {sec}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Max Ring Safety Timeout */}
        <View style={styles.card}>
          <View style={styles.cardHeaderFlex}>
            <Text style={styles.cardTitle}>SAFETY MAX-RING FALLBACK</Text>
            <Text style={styles.cardValueHighlight}>
              {Math.floor(config.maxRingTimeoutSeconds / 60)} min
            </Text>
          </View>
          <Text style={styles.cardDescription}>
            If you cannot establish a steady optical signal, the alarm will
            safely force-open after this timeout so you are never locked out.
          </Text>

          <View style={styles.chipsRow}>
            {[120, 180, 300].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[
                  styles.chip,
                  config.maxRingTimeoutSeconds === sec && styles.chipActive,
                ]}
                onPress={() => setConfig({ ...config, maxRingTimeoutSeconds: sec })}
              >
                <Text
                  style={[
                    styles.chipText,
                    config.maxRingTimeoutSeconds === sec && styles.chipTextActive,
                  ]}
                >
                  {sec / 60} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* First Task of the Day */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FIRST TASK OF THE DAY</Text>
          <Text style={styles.cardDescription}>
            Displayed gently after you complete your morning breathing gate.
          </Text>
          <TextInput
            style={styles.taskInput}
            value={firstTask}
            onChangeText={setFirstTask}
            placeholder="e.g. Drink a glass of water"
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Honest Platform Limitation Callout */}
        <View style={styles.platformNoticeBox}>
          <Text style={styles.platformNoticeTitle}>
            📱 Honest Platform Architecture Note
          </Text>
          <Text style={styles.platformNoticeText}>
            Mobile operating systems strictly prohibit background camera capture
            for privacy reasons. When the scheduled alarm fires, Steady triggers
            a high-priority alarm notification. Opening the app awakens the
            camera in the foreground where your live breathing gate regulates
            wakefulness.
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>SAVE ALARM SETTINGS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={handleTestNow}>
          <Text style={styles.testButtonText}>🔔 TEST CALM ALARM GATE NOW</Text>
        </TouchableOpacity>

        {/* Regulatory Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Steady is for wellness and convenience only. It does not diagnose,
            treat, or give medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modeTag: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeaderFlex: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  cardValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38bdf8',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 240,
  },
  cardDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 8,
  },
  timeInput: {
    fontSize: 40,
    fontWeight: '900',
    color: '#f8fafc',
    minWidth: 130,
  },
  timeFormatHint: {
    color: '#64748b',
    fontSize: 12,
  },
  timeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timeChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  timeChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  timeChipTextActive: {
    color: '#ffffff',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  taskInput: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  platformNoticeBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  platformNoticeTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  platformNoticeText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  testButton: {
    backgroundColor: '#d97706',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimerBox: {
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 16,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
