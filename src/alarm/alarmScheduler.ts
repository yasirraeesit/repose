import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_ALARM = '@repose_morning_alarm_config_v1';

export interface MorningAlarmConfig {
  isEnabled: boolean;
  /** Alarm time in 24h format "HH:MM" e.g. "07:00" */
  timeString: string;
  /** Continuous steady breathing seconds required to dismiss alarm (default: 30s) */
  holdDurationSeconds: number;
  /** Safety timeout after which alarm automatically opens (default: 180s / 3 min) */
  maxRingTimeoutSeconds: number;
  /** Prompt or first task for the morning */
  firstTask: string;
}

export const DEFAULT_ALARM_CONFIG: MorningAlarmConfig = {
  isEnabled: true,
  timeString: '07:00',
  holdDurationSeconds: 30,
  maxRingTimeoutSeconds: 180,
  firstTask: 'Drink a glass of water and stretch',
};

export async function saveAlarmConfig(config: MorningAlarmConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ALARM, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save morning alarm config', err);
  }
}

export async function loadAlarmConfig(): Promise<MorningAlarmConfig> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ALARM);
    if (!raw) return DEFAULT_ALARM_CONFIG;
    return { ...DEFAULT_ALARM_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to load morning alarm config', err);
    return DEFAULT_ALARM_CONFIG;
  }
}

/**
 * Calculates milliseconds until next alarm occurrence.
 */
export function getTimeUntilNextAlarm(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next.getTime() <= now.getTime()) {
    // Already passed today, schedule for tomorrow
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

