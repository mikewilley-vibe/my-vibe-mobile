import type { Plan } from './model.ts';
import { isMyVibeDeviceEvent } from './calendarDetect.ts';
import { isAllDayRange, type CalendarSourceId, type MonthEvent } from './monthGrid.ts';
import { concertIdFromPlanId } from './showsignal.ts';
import { sweatShiftWorkoutsToMonthEvents, type SweatShiftWorkout } from './sweatshift.ts';
import { uvaGamesToMonthEvents, homeAwayLabel, type UvaSportId } from './uvaSports.ts';
import type { UvaGame } from './uva.ts';

export type CalendarSourceMeta = {
  id: CalendarSourceId;
  label: string;
  shortLabel: string;
  defaultEnabled: boolean;
  /** True when this source can produce events with today's wiring. */
  live: boolean;
};

export const CALENDAR_SOURCES: readonly CalendarSourceMeta[] = [
  { id: 'personal', label: 'My Vibe', shortLabel: 'My Vibe', defaultEnabled: true, live: true },
  { id: 'google', label: 'Google Calendar', shortLabel: 'Google', defaultEnabled: true, live: true },
  { id: 'showsignal', label: 'ShowSignal', shortLabel: 'Shows', defaultEnabled: true, live: true },
  { id: 'uva-sports', label: 'UVA Sports', shortLabel: 'UVA', defaultEnabled: true, live: true },
  { id: 'sweatshift', label: 'SweatShift', shortLabel: 'SweatShift', defaultEnabled: true, live: false },
];

export const DEFAULT_SOURCE_ENABLED: Record<CalendarSourceId, boolean> = {
  personal: true,
  google: true,
  showsignal: true,
  'uva-sports': true,
  sweatshift: true,
};

export type GoogleEventLike = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  notes: string;
  calendarTitle: string;
};

export function sourceMeta(id: CalendarSourceId): CalendarSourceMeta {
  return CALENDAR_SOURCES.find(item => item.id === id) ?? CALENDAR_SOURCES[0];
}

export function sourceLabel(id: CalendarSourceId): string {
  return sourceMeta(id).label;
}

export function sourceFromPlan(plan: Plan): CalendarSourceId {
  if (concertIdFromPlanId(plan.id)) return 'showsignal';
  if (plan.id.startsWith('uva:')) return 'uva-sports';
  if (plan.id.startsWith('sweatshift:')) return 'sweatshift';
  return 'personal';
}

export function planToMonthEvent(plan: Plan): MonthEvent {
  const source = sourceFromPlan(plan);
  return {
    key: `${source}:${plan.id}`,
    title: plan.title,
    start: plan.start,
    end: plan.end,
    allDay: isAllDayRange(plan.start, plan.end),
    source,
    planId: plan.id,
    location: plan.location,
  };
}

export function googleToMonthEvent(event: GoogleEventLike): MonthEvent {
  return {
    key: `google:${event.id}`,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay || isAllDayRange(event.start, event.end),
    source: 'google',
    googleId: event.id,
    location: event.location || event.calendarTitle,
  };
}

export type MergeCalendarInput = {
  plans: Plan[];
  googleEvents: GoogleEventLike[];
  linkedEventIds: Set<string>;
  uvaBySport?: Partial<Record<UvaSportId, UvaGame[]>>;
  sweatshiftWorkouts?: SweatShiftWorkout[];
  range?: { start: Date; end: Date };
  enabledSources?: Record<CalendarSourceId, boolean>;
};

/**
 * Normalize every source into MonthEvent[]. Saved UVA plans yield to the live
 * sports feed so kickoff/TV refreshes replace the stale local copy on the grid.
 */
export function mergeCalendarEvents(input: MergeCalendarInput): MonthEvent[] {
  const flags = input.enabledSources ?? DEFAULT_SOURCE_ENABLED;
  const uvaEvents = flags['uva-sports']
    ? uvaGamesToMonthEvents(input.uvaBySport ?? {}, input.range)
    : [];
  const uvaPlanIds = new Set(uvaEvents.map(event => event.planId).filter((id): id is string => !!id));
  const fromPlans = flags.personal || flags.showsignal || flags['uva-sports'] || flags.sweatshift
    ? input.plans
      .filter(plan => {
        const source = sourceFromPlan(plan);
        if (!flags[source]) return false;
        if (source === 'uva-sports' && uvaPlanIds.has(plan.id)) return false;
        return true;
      })
      .map(planToMonthEvent)
    : [];
  const fromGoogle = flags.google
    ? input.googleEvents
      .filter(event => !input.linkedEventIds.has(event.id) && !isMyVibeDeviceEvent(event.notes))
      .map(googleToMonthEvent)
    : [];
  const fromSweatShift = flags.sweatshift
    ? sweatShiftWorkoutsToMonthEvents(input.sweatshiftWorkouts ?? [])
    : [];
  return [...fromPlans, ...fromGoogle, ...uvaEvents, ...fromSweatShift];
}

export function eventDetailLines(event: MonthEvent): string[] {
  const lines: string[] = [];
  if (event.sportLabel) lines.push(event.sportLabel);
  const place = homeAwayLabel(event.homeAway);
  if (place) lines.push(place);
  if (event.venue) lines.push(event.venue);
  else if (event.location) lines.push(event.location);
  if (event.network) lines.push(`TV: ${event.network}`);
  return lines;
}
