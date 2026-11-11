import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearBaseline } from '../signals/baselineCalibration';
import { clearAllWorkoutHistory } from '../storage/workoutStorage';

export type ConsentStatus = 'accepted' | 'declined' | 'pending';

const STORAGE_KEY_CONSENT = '@repose_user_camera_consent_v1';

export async function getConsentStatus(): Promise<ConsentStatus> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CONSENT);
    if (!raw) return 'pending';
    return raw as ConsentStatus;
  } catch (err) {
    console.warn('Failed to load consent status', err);
    return 'pending';
  }
}

export async function saveConsentStatus(status: ConsentStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CONSENT, status);
  } catch (err) {
    console.warn('Failed to save consent status', err);
  }
}

/**
 * Permanently deletes all user data stored in the app:
 * - Personal baseline vitals
 * - Workout recovery session logs
 * - Morning alarm configurations
 * - Camera consent status
 */
export async function deleteAllUserData(): Promise<void> {
  try {
    await clearBaseline();
    await clearAllWorkoutHistory();
    await AsyncStorage.removeItem('@repose_morning_alarm_config_v1');
    await AsyncStorage.removeItem(STORAGE_KEY_CONSENT);
  } catch (err) {
    console.warn('Failed to execute complete data deletion', err);
  }
}
