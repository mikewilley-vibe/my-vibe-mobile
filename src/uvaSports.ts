import type { MonthEvent } from './monthGrid.ts';
import { hasKnownKickoff, uvaHeadline, type UvaGame, type UvaLocation } from './uva.ts';

export type UvaSportId =
  | 'football'
  | 'mens-basketball'
  | 'baseball'
  | 'womens-basketball'
  | 'lacrosse'
  | 'soccer';

export type UvaSportDefinition = {
  id: UvaSportId;
  label: string;
  emoji: string;
  /** Path on EXPO_PUBLIC_API_BASE_URL. Only enabled sports are fetched. */
  feedPath: string;
  enabled: boolean;
  /** Display-only span for timed games. Not an official end time. */
  defaultDurationMinutes: number;
};

/**
 * Catalog of UVA sports My Vibe can overlay on the month calendar.
 * Enable a later sport by setting `enabled: true` once its mikewilley.app feed exists.
 */
export const UVA_SPORT_CATALOG: readonly UvaSportDefinition[] = [
  { id: 'football', label: 'Football', emoji: '🏈', feedPath: '/api/uva/football', enabled: true, defaultDurationMinutes: 210 },
  { id: 'mens-basketball', label: "Men's Basketball", emoji: '🏀', feedPath: '/api/uva', enabled: true, defaultDurationMinutes: 150 },
  { id: 'baseball', label: 'Baseball', emoji: '⚾', feedPath: '/api/uva/baseball', enabled: false, defaultDurationMinutes: 180 },
  { id: 'womens-basketball', label: "Women's Basketball", emoji: '🏀', feedPath: '/api/uva/wbb', enabled: false, defaultDurationMinutes: 150 },
  { id: 'lacrosse', label: 'Lacrosse', emoji: '🥍', feedPath: '/api/uva/lacrosse', enabled: false, defaultDurationMinutes: 150 },
  { id: 'soccer', label: 'Soccer', emoji: '⚽', feedPath: '/api/uva/soccer', enabled: false, defaultDurationMinutes: 120 },
];

export function enabledUvaSports(): UvaSportDefinition[] {
  return UVA_SPORT_CATALOG.filter(sport => sport.enabled);
}

export function uvaSportById(id: string): UvaSportDefinition | undefined {
  return UVA_SPORT_CATALOG.find(sport => sport.id === id);
}

export function planIdForUvaGame(game: UvaGame): string {
  return `uva:${game.id}`;
}

function gameEndIso(startIso: string, durationMinutes: number): string {
  const start = Date.parse(startIso);
  if (!Number.isFinite(start)) return startIso;
  return new Date(start + durationMinutes * 60 * 1000).toISOString();
}

export function uvaGameToMonthEvent(game: UvaGame, sport: UvaSportDefinition): MonthEvent {
  const timeUnknown = game.timeUnknown === true || !hasKnownKickoff(game.date);
  const title = uvaHeadline(game);
  const start = game.date;
  const end = timeUnknown ? gameEndIso(start, 24 * 60) : gameEndIso(start, sport.defaultDurationMinutes);
  const venue = game.venue;
  return {
    key: `uva-sports:${sport.id}:${game.id}`,
    title,
    start,
    end,
    allDay: timeUnknown,
    source: 'uva-sports',
    planId: planIdForUvaGame(game),
    location: venue,
    timeUnknown,
    sportLabel: sport.label,
    network: game.network,
    venue,
    homeAway: game.location,
    externalUrl: game.sourceUrl,
    chipTitle: `${sport.emoji} ${title}`,
  };
}

export function uvaGamesToMonthEvents(
  gamesBySport: Partial<Record<UvaSportId, UvaGame[]>>,
  range?: { start: Date; end: Date },
): MonthEvent[] {
  const events: MonthEvent[] = [];
  for (const sport of enabledUvaSports()) {
    for (const game of gamesBySport[sport.id] ?? []) {
      const event = uvaGameToMonthEvent(game, sport);
      if (range && !overlapsRange(event, range)) continue;
      events.push(event);
    }
  }
  return events;
}

function overlapsRange(event: MonthEvent, range: { start: Date; end: Date }): boolean {
  const start = Date.parse(event.start);
  const end = Date.parse(event.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start < range.end.getTime() && end > range.start.getTime();
}

export function homeAwayLabel(location?: UvaLocation): string {
  if (location === 'home') return 'Home';
  if (location === 'away') return 'Away';
  if (location === 'neutral') return 'Neutral site';
  return '';
}
