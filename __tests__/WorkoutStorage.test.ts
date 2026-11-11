import {
  saveWorkoutSession,
  getWorkoutSessions,
  deleteWorkoutSession,
  clearAllWorkoutHistory,
} from '../src/storage/workoutStorage';
import { WorkoutSessionRecord } from '../src/storage/types';

describe('Workout Storage & History Pipeline', () => {
  beforeEach(async () => {
    await clearAllWorkoutHistory();
  });

  it('saves and retrieves workout sessions with accurate recovery analytics', async () => {
    const mockSession: WorkoutSessionRecord = {
      sessionId: 'session_1',
      startedAt: 1000000,
      completedAt: 1500000,
      baselinePulseBpm: 72,
      sets: [
        {
          setId: 's1',
          setNumber: 1,
          startedAt: 1000000,
          endedAt: 1045000,
          timeToBaselineMs: 45000,
          startPulseBpm: 120,
          endPulseBpm: 81,
          baselinePulseBpm: 72,
          targetCeilingBpm: 82,
          isTimedOut: false,
        },
        {
          setId: 's2',
          setNumber: 2,
          startedAt: 1100000,
          endedAt: 1160000,
          timeToBaselineMs: 60000,
          startPulseBpm: 128,
          endPulseBpm: 80,
          baselinePulseBpm: 72,
          targetCeilingBpm: 82,
          isTimedOut: false,
        },
      ],
      averageRecoveryTimeMs: 52500,
      fastestRecoveryTimeMs: 45000,
    };

    await saveWorkoutSession(mockSession);
    const sessions = await getWorkoutSessions();

    expect(sessions.length).toBe(1);
    expect(sessions[0].sessionId).toBe('session_1');
    expect(sessions[0].sets.length).toBe(2);
    expect(sessions[0].averageRecoveryTimeMs).toBe(52500);
    expect(sessions[0].fastestRecoveryTimeMs).toBe(45000);
  });

  it('deletes specific sessions correctly', async () => {
    const s1: WorkoutSessionRecord = {
      sessionId: 'sess_1',
      startedAt: 100,
      completedAt: 200,
      baselinePulseBpm: 70,
      sets: [],
      averageRecoveryTimeMs: 0,
      fastestRecoveryTimeMs: 0,
    };
    const s2: WorkoutSessionRecord = {
      sessionId: 'sess_2',
      startedAt: 300,
      completedAt: 400,
      baselinePulseBpm: 70,
      sets: [],
      averageRecoveryTimeMs: 0,
      fastestRecoveryTimeMs: 0,
    };

    await saveWorkoutSession(s1);
    await saveWorkoutSession(s2);

    let list = await getWorkoutSessions();
    expect(list.length).toBe(2);

    await deleteWorkoutSession('sess_1');
    list = await getWorkoutSessions();
    expect(list.length).toBe(1);
    expect(list[0].sessionId).toBe('sess_2');
  });
});
