import {
  getTimeUntilNextAlarm,
  saveAlarmConfig,
  loadAlarmConfig,
  DEFAULT_ALARM_CONFIG,
  MorningAlarmConfig,
} from '../src/alarm/alarmScheduler';

describe('Morning Alarm Scheduler', () => {
  it('correctly calculates milliseconds until next scheduled alarm', () => {
    // Current time: 08:00 AM
    const nextAlarm = '09:00';
    const msUntil = getTimeUntilNextAlarm(nextAlarm);
    expect(msUntil).toBeGreaterThan(0);
    expect(msUntil).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('persists and retrieves custom morning alarm configuration', async () => {
    const custom: MorningAlarmConfig = {
      isEnabled: true,
      timeString: '06:15',
      holdDurationSeconds: 45,
      maxRingTimeoutSeconds: 240,
      firstTask: 'Meditate and drink green tea',
    };

    await saveAlarmConfig(custom);
    const loaded = await loadAlarmConfig();

    expect(loaded.timeString).toBe('06:15');
    expect(loaded.holdDurationSeconds).toBe(45);
    expect(loaded.maxRingTimeoutSeconds).toBe(240);
    expect(loaded.firstTask).toBe('Meditate and drink green tea');
  });
});
