export type UvaLocation = 'home' | 'away' | 'neutral';
export type UvaSport = 'Football' | 'Basketball';
export type UvaGame = {
  id: string;
  opponent: string;
  date: string;
  location: UvaLocation;
  note?: string;
  sourceUrl?: string;
};
export type UvaNext = {sport: UvaSport; game: UvaGame};
export const UPCOMING_LIMIT = 5;

export function parseUvaGames(body: unknown): UvaGame[] {
  if (!body || typeof body !== 'object' || !Array.isArray((body as {games?: unknown}).games)) return [];
  const out: UvaGame[] = [];
  for (const item of (body as {games: unknown[]}).games) {
    if (!item || typeof item !== 'object') continue;
    const g = item as Record<string, unknown>;
    if (typeof g.id !== 'string' || typeof g.opponent !== 'string' || typeof g.date !== 'string') continue;
    if (!Number.isFinite(Date.parse(g.date))) continue;
    const loc = String(g.location ?? '').toLowerCase();
    const location: UvaLocation = loc === 'home' || loc === 'away' ? loc : 'neutral';
    const opponent = g.opponent.replace(/^vs\.?\s+/i, '').replace(/^at\s+/i, '').trim() || 'Opponent TBA';
    out.push({
      id: g.id,
      opponent,
      date: g.date,
      location,
      note: typeof g.note === 'string' && g.note.trim() ? g.note : undefined,
      sourceUrl: typeof g.sourceUrl === 'string' && g.sourceUrl.trim() ? g.sourceUrl : undefined,
    });
  }
  return out;
}

export function upcomingGames(games: UvaGame[], now = Date.now(), limit = UPCOMING_LIMIT) {
  return games
    .filter(g => Date.parse(g.date) > now)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function nextUp(football: UvaGame[], basketball: UvaGame[], now = Date.now()): UvaNext | null {
  const candidates: UvaNext[] = [
    ...upcomingGames(football, now, 1).map(game => ({sport: 'Football' as const, game})),
    ...upcomingGames(basketball, now, 1).map(game => ({sport: 'Basketball' as const, game})),
  ].sort((a, b) => a.game.date.localeCompare(b.game.date) || a.sport.localeCompare(b.sport));
  return candidates[0] ?? null;
}

export function formatUvaWhen(iso: string) {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'TBD';
  return dt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export function locationLabel(location: UvaLocation) {
  if (location === 'home') return 'HOME';
  if (location === 'away') return 'AWAY';
  return '';
}
