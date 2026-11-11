import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { WorkoutSessionRecord } from '../storage/types';
import {
  getWorkoutSessions,
  deleteWorkoutSession,
  clearAllWorkoutHistory,
} from '../storage/workoutStorage';

interface HistoryScreenProps {
  onBack?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionRecord | null>(null);

  const loadHistory = async () => {
    const list = await getWorkoutSessions();
    setSessions(list);
    if (list.length > 0 && !selectedSession) {
      setSelectedSession(list[0]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this workout record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkoutSession(sessionId);
            const next = sessions.filter((s) => s.sessionId !== sessionId);
            setSessions(next);
            if (selectedSession?.sessionId === sessionId) {
              setSelectedSession(next.length > 0 ? next[0] : null);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will delete all saved workout records permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllWorkoutHistory();
            setSessions([]);
            setSelectedSession(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Workout Recovery History</Text>
          <Text style={styles.subtitle}>
            Time to return to your personal baseline across sets
          </Text>
        </View>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Sessions Logged Yet</Text>
            <Text style={styles.emptySub}>
              Complete a Training session with the Rest Until Ready gate to track
              your recovery times here.
            </Text>
          </View>
        ) : (
          <>
            {/* Session Selector Chips */}
            <Text style={styles.sectionHeader}>SESSIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sessionChipsRow}>
              {sessions.map((s, idx) => {
                const isSelected = selectedSession?.sessionId === s.sessionId;
                const dateStr = new Date(s.startedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <TouchableOpacity
                    key={s.sessionId}
                    style={[styles.sessionChip, isSelected && styles.sessionChipActive]}
                    onPress={() => setSelectedSession(s)}
                  >
                    <Text
                      style={[
                        styles.sessionChipDate,
                        isSelected && styles.sessionChipDateActive,
                      ]}
                    >
                      {dateStr}
                    </Text>
                    <Text
                      style={[
                        styles.sessionChipSub,
                        isSelected && styles.sessionChipSubActive,
                      ]}
                    >
                      {s.sets.length} {s.sets.length === 1 ? 'Set' : 'Sets'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected Session Detail Card */}
            {selectedSession && (
              <View style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <View>
                    <Text style={styles.detailDate}>
                      {new Date(selectedSession.startedAt).toLocaleDateString(
                        undefined,
                        {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </Text>
                    <Text style={styles.detailBaseline}>
                      Baseline: {selectedSession.baselinePulseBpm} BPM
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteSession(selectedSession.sessionId)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics Summary Strip */}
                <View style={styles.summaryStrip}>
                  <View style={styles.stripItem}>
                    <Text style={styles.stripLabel}>TOTAL SETS</Text>
                    <Text style={styles.stripValue}>{selectedSession.sets.length}</Text>
                  </View>
                  <View style={styles.stripDivider} />
                  <View style={styles.stripItem}>
                    <Text style={styles.stripLabel}>AVG RECOVERY</Text>
                    <Text style={styles.stripValue}>
                      {Math.round(selectedSession.averageRecoveryTimeMs / 1000)}s
                    </Text>
                  </View>
                  <View style={styles.stripDivider} />
                  <View style={styles.stripItem}>
                    <Text style={styles.stripLabel}>FASTEST</Text>
                    <Text style={styles.stripValue}>
                      {Math.round(selectedSession.fastestRecoveryTimeMs / 1000)}s
                    </Text>
                  </View>
                </View>

                {/* Set-by-Set Recovery Time Visual Chart */}
                <Text style={styles.chartTitle}>RECOVERY TIME PER SET</Text>
                <View style={styles.chartContainer}>
                  {selectedSession.sets.map((set) => {
                    const sec = Math.round(set.timeToBaselineMs / 1000);
                    // Max scale 180s for bar width
                    const barPercent = Math.min(100, Math.max(10, (sec / 150) * 100));

                    return (
                      <View key={set.setId} style={styles.chartBarRow}>
                        <Text style={styles.barSetLabel}>Set {set.setNumber}</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${barPercent}%`,
                                backgroundColor: set.isTimedOut
                                  ? '#d97706'
                                  : '#3b82f6',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barTimeLabel}>
                          {sec}s {set.isTimedOut && '(Cap)'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Clear All Button */}
            <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All Workout History</Text>
            </TouchableOpacity>
          </>
        )}

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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
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
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  sessionChipsRow: {
    marginBottom: 16,
  },
  sessionChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sessionChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  sessionChipDate: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionChipDateActive: {
    color: '#ffffff',
  },
  sessionChipSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  sessionChipSubActive: {
    color: '#bfdbfe',
  },
  detailCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailDate: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  detailBaseline: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  deleteText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 20,
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
  },
  stripDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1e293b',
  },
  stripLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  stripValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chartContainer: {
    gap: 10,
  },
  chartBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barSetLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    width: 44,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barTimeLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
    width: 70,
    textAlign: 'right',
  },
  clearAllBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
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
