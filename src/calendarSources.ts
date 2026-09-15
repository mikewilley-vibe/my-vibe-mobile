import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { CalendarSourceId } from './monthGrid.ts';
import { CALENDAR_SOURCES, DEFAULT_SOURCE_ENABLED } from './calendarMerge.ts';

export {
  CALENDAR_SOURCES,
  DEFAULT_SOURCE_ENABLED,
  eventDetailLines,
  googleToMonthEvent,
  mergeCalendarEvents,
  planToMonthEvent,
  sourceFromPlan,
  sourceLabel,
  sourceMeta,
} from './calendarMerge.ts';
export type { CalendarSourceMeta, GoogleEventLike, MergeCalendarInput } from './calendarMerge.ts';

const SOURCE_KEY = 'my-vibe:calendar-sources:v1';
let enabled: Record<CalendarSourceId, boolean> = { ...DEFAULT_SOURCE_ENABLED };
const listeners = new Set<() => void>();

function notify() { listeners.forEach(listener => listener()); }

export async function hydrateCalendarSources() {
  try {
    const raw = await AsyncStorage.getItem(SOURCE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Record<CalendarSourceId, boolean>>;
    enabled = { ...DEFAULT_SOURCE_ENABLED };
    for (const source of CALENDAR_SOURCES) {
      if (typeof parsed[source.id] === 'boolean') enabled[source.id] = parsed[source.id]!;
    }
  } catch {
    enabled = { ...DEFAULT_SOURCE_ENABLED };
  }
  notify();
}

export function getSourceEnabled(): Record<CalendarSourceId, boolean> {
  return enabled;
}

export function isSourceEnabled(id: CalendarSourceId): boolean {
  return enabled[id] !== false;
}

export async function setSourceEnabled(id: CalendarSourceId, value: boolean) {
  enabled = { ...enabled, [id]: value };
  notify();
  await AsyncStorage.setItem(SOURCE_KEY, JSON.stringify(enabled));
}

export function useSourceEnabled(): Record<CalendarSourceId, boolean> {
  return useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => enabled);
}
