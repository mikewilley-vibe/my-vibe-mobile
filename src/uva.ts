export type UvaLocation = 'home' | 'away' | 'neutral';
export type UvaSport = 'Football' | 'Basketball';
export type UvaGame = {
  id: string;
  opponent: string;
  date: string;
  location: UvaLocation;
  result?: 'win' | 'loss' | 'pending' | string;
  note?: string;
  sourceUrl?: string;
};
export type UvaNext = {sport: UvaSport; game: UvaGame};
export const UPCOMING_LIMIT = 5;
export const RESULTS_LIMIT = 5;

export function normalizeUvaResult(value: unknown): UvaGame['result'] | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const key = trimmed.toLowerCase();
  if (key === 'win' || key === 'w' || key === 'won' || key === 'victory') return 'win';
  if (key === 'loss' || key === 'l' || key === 'lost' || key === 'defeat') return 'loss';
  if (key === 'pending' || key === 'tba' || key === 'tbd' || key === 'unknown') return 'pending';
  return trimmed;
}

export function isDecisiveResult(result?: string): result is 'win' | 'loss' {
  return result === 'win' || result === 'loss';
}

export function resultLabel(result?: string) {
  if (result === 'win') return 'W';
  if (result === 'loss') return 'L';
  if (result === 'pending') return 'TBD';
  if (result) return result.toUpperCase();
  return '';
}

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
    const result = normalizeUvaResult(g.result);
    out.push({
      id: g.id,
      opponent,
      date: g.date,
      location,
      ...(result ? {result} : {}),
      note: typeof g.note === 'string' && g.note.trim() ? g.note : undefined,
      sourceUrl: typeof g.sourceUrl === 'string' && g.sourceUrl.trim() ? g.sourceUrl : undefined,
    });
  }
  return out;
}

function byDateThenId(a: UvaGame, b: UvaGame, dir: 1 | -1) {
  return dir * a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}

export function upcomingGames(games: UvaGame[], now = Date.now(), limit = UPCOMING_LIMIT) {
  return games
    .filter(g => Date.parse(g.date) > now)
    .sort((a, b) => byDateThenId(a, b, 1))
    .slice(0, limit);
}

export function recentResults(games: UvaGame[], now = Date.now(), limit = RESULTS_LIMIT) {
  const past = games.filter(g => Date.parse(g.date) <= now);
  const decisive = past.filter(g => isDecisiveResult(g.result));
  const pool = decisive.length ? decisive : past;
  return pool.sort((a, b) => byDateThenId(a, b, -1)).slice(0, limit);
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

export function planLocation(game: UvaGame) {
  const fromNote = game.note?.replace(/^Location:\s*/i, '').trim();
  return fromNote || locationLabel(game.location);
}
