import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSessionRecord } from './types';

const STORAGE_KEY_WORKOUTS = '@repose_workout_sessions_v1';

export async function getWorkoutSessions(): Promise<WorkoutSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKOUTS);
    if (!raw) return [];
    return JSON.parse(raw) as WorkoutSessionRecord[];
  } catch (err) {
    console.warn('Failed to retrieve workout sessions', err);
    return [];
  }
}

export async function saveWorkoutSession(session: WorkoutSessionRecord): Promise<void> {
  try {
    const existing = await getWorkoutSessions();
    const updated = [session, ...existing.filter((s) => s.sessionId !== session.sessionId)];
    await AsyncStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save workout session', err);
  }
}

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  try {
    const existing = await getWorkoutSessions();
    const filtered = existing.filter((s) => s.sessionId !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete workout session', err);
  }
}

export async function clearAllWorkoutHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_WORKOUTS);
  } catch (err) {
    console.warn('Failed to clear workout history', err);
  }
}

