import type { MonthEvent } from './monthGrid.ts';

/**
 * SweatShift (HIIT workout timer) currently stores workouts on-device only.
 * There is no reachable SweatShift HTTP API in this repo. Do not call invented
 * production URLs. When SweatShift exposes a public API, set
 * EXPO_PUBLIC_SWEATSHIFT_API_BASE_URL and this client will use the contract below.
 */
export const SWEATSHIFT_API_BASE = (process.env.EXPO_PUBLIC_SWEATSHIFT_API_BASE_URL || '').replace(/\/$/, '');

export type SweatShiftStatus = 'unconfigured' | 'unavailable' | 'ok';

export type SweatShiftWorkout = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  notes?: string;
};

export type SweatShiftLoad = {
  status: SweatShiftStatus;
  workouts: SweatShiftWorkout[];
  message: string;
};

export const SWEATSHIFT_CONTRACT = {
  list: 'GET /workouts',
  one: 'GET /workouts/:id',
  history: 'GET /workout-history',
} as const;

const UNCONFIGURED_MESSAGE = 'SweatShift has no public API yet. Set EXPO_PUBLIC_SWEATSHIFT_API_BASE_URL when SweatShift exposes the contract in INTEGRATIONS.md.';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

export function parseSweatShiftWorkouts(body: unknown): SweatShiftWorkout[] {
  const root = asRecord(body);
  const list = Array.isArray(body) ? body : Array.isArray(root?.workouts) ? root!.workouts : Array.isArray(root?.data) ? root!.data : [];
  const out: SweatShiftWorkout[] = [];
  for (const item of list) {
    const row = asRecord(item);
    if (!row || typeof row.id !== 'string' || !row.id.trim()) continue;
    const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : '';
    const startsAt = typeof row.startsAt === 'string' ? row.startsAt : typeof row.start === 'string' ? row.start : '';
    if (!title || !Number.isFinite(Date.parse(startsAt))) continue;
    const endsAt = typeof row.endsAt === 'string' && Number.isFinite(Date.parse(row.endsAt))
      ? new Date(row.endsAt).toISOString()
      : typeof row.end === 'string' && Number.isFinite(Date.parse(row.end))
        ? new Date(row.end).toISOString()
        : undefined;
    out.push({
      id: row.id.trim(),
      title,
      startsAt: new Date(startsAt).toISOString(),
      ...(endsAt ? { endsAt } : {}),
      notes: typeof row.notes === 'string' && row.notes.trim() ? row.notes.trim() : undefined,
    });
  }
  return out;
}

export function sweatShiftWorkoutsToMonthEvents(workouts: SweatShiftWorkout[]): MonthEvent[] {
  return workouts.map(workout => {
    const start = workout.startsAt;
    const end = workout.endsAt ?? new Date(Date.parse(start) + 60 * 60 * 1000).toISOString();
    return {
      key: `sweatshift:${workout.id}`,
      title: workout.title,
      start,
      end,
      allDay: false,
      source: 'sweatshift' as const,
      location: workout.notes,
      chipTitle: `⏱ ${workout.title}`,
    };
  });
}

export async function getSweatShiftWorkouts(): Promise<SweatShiftLoad> {
  if (!SWEATSHIFT_API_BASE) {
    return { status: 'unconfigured', workouts: [], message: UNCONFIGURED_MESSAGE };
  }
  try {
    const response = await fetch(`${SWEATSHIFT_API_BASE}/workouts`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { status: 'unavailable', workouts: [], message: 'SweatShift workouts could not load. Try again later.' };
    }
    return { status: 'ok', workouts: parseSweatShiftWorkouts(body), message: '' };
  } catch {
    return { status: 'unavailable', workouts: [], message: 'SweatShift workouts could not load. Try again later.' };
  }
}
