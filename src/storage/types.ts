export interface WorkoutSetRecord {
  setId: string;
  setNumber: number;
  exerciseName?: string;
  startedAt: number;
  endedAt: number;
  /** Milliseconds taken from start of rest until pulse returned to baseline margin */
  timeToBaselineMs: number;
  startPulseBpm: number | null;
  endPulseBpm: number | null;
  baselinePulseBpm: number;
  targetCeilingBpm: number;
  /** Whether the rest gate was force-opened by max timeout fallback */
  isTimedOut: boolean;
}

export interface WorkoutSessionRecord {
  sessionId: string;
  startedAt: number;
  completedAt: number;
  baselinePulseBpm: number;
  sets: WorkoutSetRecord[];
  averageRecoveryTimeMs: number;
  fastestRecoveryTimeMs: number;
}
