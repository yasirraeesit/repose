import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

interface StartOfDayScreenProps {
  firstTask: string;
  onDone: () => void;
}

export const StartOfDayScreen: React.FC<StartOfDayScreenProps> = ({
  firstTask,
  onDone,
}) => {
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        {/* Morning Sun Header */}
        <View style={styles.header}>
          <Text style={styles.sunIcon}>☀️</Text>
          <Text style={styles.morningGreeting}>Good Morning</Text>
          <Text style={styles.dateText}>{todayDate}</Text>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>

        {/* Calm Affirmation Card */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationTitle}>MIND & BODY IN SYNC</Text>
          <Text style={styles.affirmationBody}>
            You began your morning with deliberate, calm breathing instead of
            frantic alarms. Your nervous system is primed for focused action.
          </Text>
        </View>

        {/* First Task of the Day Card */}
        <View style={styles.taskCard}>
          <Text style={styles.taskCardLabel}>YOUR FIRST TASK TODAY</Text>
          <TouchableOpacity
            style={styles.taskRow}
            onPress={() => setIsTaskCompleted(!isTaskCompleted)}
            accessibilityLabel={`Mark task: ${firstTask}`}
          >
            <View
              style={[
                styles.checkbox,
                isTaskCompleted && styles.checkboxCompleted,
              ]}
            >
              {isTaskCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text
              style={[
                styles.taskTitle,
                isTaskCompleted && styles.taskTitleCompleted,
              ]}
            >
              {firstTask}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.continueButton} onPress={onDone}>
          <Text style={styles.continueButtonText}>START YOUR DAY</Text>
        </TouchableOpacity>

        {/* Regulatory Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Steady is for wellness and convenience only. It does not diagnose,
            treat, or give medical advice.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  sunIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  morningGreeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#38bdf8',
    marginTop: 8,
    letterSpacing: -1,
  },
  affirmationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  affirmationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  affirmationBody: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  taskTitleCompleted: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disclaimerBox: {
    padding: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 8,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 9,
    textAlign: 'center',
  },
});

