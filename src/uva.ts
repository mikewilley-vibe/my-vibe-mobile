import { UVA_FOOTBALL_2026 } from './uvaFootball2026.ts';

export type UvaLocation = 'home' | 'away' | 'neutral';
export type UvaSport = 'Football' | 'Basketball';
export type UvaGame = {
  id: string;
  opponent: string;
  date: string;
  location: UvaLocation;
  result?: 'win' | 'loss' | 'pending' | string;
  /** Final score with UVA's points first, e.g. "34-8". Omitted until the game is final. */
  score?: string;
  note?: string;
  sourceUrl?: string;
  sport?: string;
  venue?: string;
  network?: string;
  timeUnknown?: boolean;
  /** True when the feed named home, away, or neutral. Missing locations stay neutral and are not treated as a site change. */
  locationKnown?: boolean;
};
export type UvaNext = {sport: UvaSport; game: UvaGame};
export const UPCOMING_LIMIT = 5;
export const RESULTS_LIMIT = 5;

export function normalizeUvaResult(value: unknown): UvaGame['result'] | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const key = trimmed.toLowerCase();
  if (key === 'win' || key === 'w' || key === 'won' || key === 'victory' || /^(w|win|won|victory)\b/.test(key)) return 'win';
  if (key === 'loss' || key === 'l' || key === 'lost' || key === 'defeat' || /^(l|loss|lost|defeat)\b/.test(key)) return 'loss';
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
    const locationKnown = loc === 'home' || loc === 'away' || loc === 'neutral';
    const location: UvaLocation = loc === 'home' || loc === 'away' ? loc : 'neutral';
    const opponent = g.opponent.replace(/^vs\.?\s+/i, '').replace(/^at\s+/i, '').trim() || 'Opponent TBA';
    const result = normalizeUvaResult(g.result);
    const score = result === 'pending' ? undefined : parseUvaScore(g);
    const rawDate = g.date.trim();
    const venue = optionalText(g.venue) ?? venueFromNote(typeof g.note === 'string' ? g.note : undefined);
    const network = optionalText(g.network) ?? optionalText(g.tv) ?? optionalText(g.broadcast);
    const timeUnknown = g.timeUnknown === true || g.kickoffTbd === true || g.tba === true
      || /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      || !hasKnownKickoff(rawDate);
    out.push({
      id: g.id,
      opponent,
      date: g.date,
      location,
      ...(result ? {result} : {}),
      ...(score ? {score} : {}),
      ...(locationKnown ? {locationKnown: true} : {}),
      note: typeof g.note === 'string' && g.note.trim() ? g.note : undefined,
      sourceUrl: typeof g.sourceUrl === 'string' && g.sourceUrl.trim() ? g.sourceUrl : undefined,
      sport: optionalText(g.sport),
      ...(venue ? {venue} : {}),
      ...(network ? {network} : {}),
      ...(timeUnknown ? {timeUnknown: true} : {}),
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
  const withTime = hasKnownKickoff(iso);
  return dt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    timeZone: 'America/New_York',
  });
}

export function locationLabel(location: UvaLocation) {
  if (location === 'home') return 'HOME';
  if (location === 'away') return 'AWAY';
  if (location === 'neutral') return 'NEUTRAL';
  return '';
}

export function planLocation(game: UvaGame) {
  return game.venue || game.note?.replace(/^Location:\s*/i, '').trim() || locationLabel(game.location);
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function venueFromNote(note?: string): string | undefined {
  const fromNote = note?.replace(/^Location:\s*/i, '').trim();
  return fromNote || undefined;
}

/** True when the timestamp has a real kickoff (not date-only / midnight Eastern). */
export function hasKnownKickoff(iso: string, timeZone = 'America/New_York'): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return false;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return false;
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value);
  const minute = Number(parts.find(part => part.type === 'minute')?.value);
  return !(hour === 0 && minute === 0);
}

export function uvaHeadline(game: UvaGame): string {
  const vs = game.location === 'away' ? 'at' : 'vs';
  return `UVA ${vs} ${game.opponent}`;
}

export function showsFinalScore(game: UvaGame): boolean {
  if (!game.score || game.result === 'pending') return false;
  return isDecisiveResult(game.result) || game.result === 'tie';
}

/** Kickoff is already in the date line when it is known. TBA kickoffs say so next to TV. */
export function footballBroadcastLine(game: UvaGame): string {
  const known = game.timeUnknown !== true && hasKnownKickoff(game.date);
  const tv = game.network ? `TV: ${game.network}` : 'TV TBA';
  return known ? tv : `Kickoff TBA · ${tv}`;
}

export function seasonGames(games: UvaGame[]): UvaGame[] {
  return [...games].sort((a, b) => byDateThenId(a, b, 1));
}

/** Earliest game that does not yet have a final W/L. */
export function nextSeasonGameId(games: UvaGame[]): string | null {
  return seasonGames(games).find(game => !isDecisiveResult(game.result))?.id ?? null;
}

function scoreText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/(\d{1,3})\s*[-–—]\s*(\d{1,3})/);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}`;
}

function scoreNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 200) return value;
  if (typeof value === 'string' && /^\d{1,3}$/.test(value.trim())) return Number(value.trim());
  return undefined;
}

function parseUvaScore(game: Record<string, unknown>): string | undefined {
  const direct = scoreText(game.score);
  if (direct) return direct;
  const uva = scoreNumber(game.uvaScore ?? game.scoreFor ?? game.pointsFor);
  const opponent = scoreNumber(game.opponentScore ?? game.scoreAgainst ?? game.pointsAgainst);
  if (uva === undefined || opponent === undefined) {
    return typeof game.result === 'string' ? scoreText(game.result) : undefined;
  }
  return `${uva}-${opponent}`;
}

export function uvaPayloadIsLive(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const record = body as { ok?: unknown; fallback?: unknown; error?: unknown };
  if (record.ok === false) return false;
  if (record.fallback === true) return false;
  if (typeof record.error === 'string' && record.error.trim()) return false;
  return true;
}

function etDay(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function in2026FootballWindow(iso: string): boolean {
  const day = etDay(iso);
  return day >= '2026-08-01' && day <= '2027-01-31';
}

/** Map schedule names and feed nicknames onto one 2026 opponent. NC State is not North Carolina. */
export function footballOpponentKey(name: string): string | null {
  const n = name.toLowerCase().replace(/[.’']/g, '');
  if (/\bvirginia tech\b|\bhokies\b|\bvatech\b|\bvt\b/.test(n)) return 'virginiatech';
  if (/\bwest virginia\b|\bmountaineers\b|\bwvu\b/.test(n)) return 'westvirginia';
  if (/\bnorth carolina state\b|\bnc state\b|\bncst\b|\bwolfpack\b/.test(n)) return 'ncstate';
  if (/\bnorth carolina\b|\btar heels\b|\bunc\b/.test(n)) return 'northcarolina';
  if (/\bnorfolk\b/.test(n)) return 'norfolk';
  if (/\bdelaware\b/.test(n)) return 'delaware';
  if (/\bflorida state\b|\bfsu\b|\bseminoles\b/.test(n)) return 'floridastate';
  if (/\bsyracuse\b/.test(n)) return 'syracuse';
  if (/\bsouthern methodist\b|\bsmu\b|\bmustangs\b/.test(n)) return 'smu';
  if (/\bduke\b|\bblue devils\b/.test(n)) return 'duke';
  if (/\bwake forest\b|\bdemon deacons\b|\bwake\b/.test(n)) return 'wakeforest';
  if (/\bcalifornia\b|\bgolden bears\b|\bcal\b/.test(n)) return 'california';
  return null;
}

function applyLiveFootballGame(base: UvaGame, live: UvaGame) {
  if (live.locationKnown) base.location = live.location;
  if (live.venue) base.venue = live.venue;
  if (live.network) base.network = live.network;
  if (live.sourceUrl) base.sourceUrl = live.sourceUrl;
  if (live.note) base.note = live.note;
  const knownKickoff = live.timeUnknown !== true && hasKnownKickoff(live.date);
  if (knownKickoff) {
    base.date = live.date;
    delete base.timeUnknown;
  }
  if (isDecisiveResult(live.result)) {
    if (base.result !== live.result) delete base.score;
    base.result = live.result;
    if (live.score) base.score = live.score;
    return;
  }
  if (live.score && live.result !== 'pending') {
    base.score = live.score;
    if (live.result) base.result = live.result;
  }
}

/**
 * Full 2026 regular season, with a live feed laid on top only when that feed is real.
 * A partial or failed live list cannot drop a bundled game. Games outside the 2026 season are ignored.
 */
export function mergeFootballSchedule(live: UvaGame[] = [], options?: { trustLive?: boolean }): UvaGame[] {
  const bundled = UVA_FOOTBALL_2026.map(game => ({ ...game }));
  if (!options?.trustLive) return seasonGames(bundled);
  const used = new Set<string>();
  const extras: UvaGame[] = [];
  for (const game of live) {
    if (!in2026FootballWindow(game.date)) continue;
    const key = footballOpponentKey(game.opponent);
    const day = etDay(game.date);
    const match = key
      ? bundled.find(item => !used.has(item.id) && footballOpponentKey(item.opponent) === key && etDay(item.date) === day)
        ?? bundled.find(item => !used.has(item.id) && footballOpponentKey(item.opponent) === key)
      : undefined;
    if (!match) {
      extras.push({ ...game });
      continue;
    }
    used.add(match.id);
    applyLiveFootballGame(match, game);
  }
  return seasonGames([...bundled, ...extras]);
}
