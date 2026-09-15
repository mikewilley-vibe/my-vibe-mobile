import type { Concert } from './reused/concert';

export const SHOWSIGNAL_WEB_ORIGIN = 'https://concert-finder-eta.vercel.app';
export const SHOWSIGNAL_SCHEME = 'showsignal';

export function showSignalConcertUrls(id: string): { app: string; web: string } {
  const encoded = encodeURIComponent(id.trim());
  return {
    app: `${SHOWSIGNAL_SCHEME}://concert/${encoded}`,
    web: `${SHOWSIGNAL_WEB_ORIGIN}/concert/${encoded}`,
  };
}

export function concertIdFromPlanId(planId: string): string | null {
  if (!planId.startsWith('concert:')) return null;
  const id = planId.slice('concert:'.length).trim();
  return id || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function concertDateTime(event: Record<string, unknown>): string | null {
  if (typeof event.startsAt === 'string' && Number.isFinite(Date.parse(event.startsAt))) {
    return new Date(event.startsAt).toISOString();
  }
  if (typeof event.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.localDate)) return null;
  const rawTime = typeof event.localTime === 'string' ? event.localTime : '';
  const time = /^\d{2}:\d{2}$/.test(rawTime) ? `${rawTime}:00` : /^\d{2}:\d{2}:\d{2}$/.test(rawTime) ? rawTime : '20:00:00';
  const parsed = Date.parse(`${event.localDate}T${time}`);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function venueBits(venue: unknown): { venue: string; city: string; state?: string } {
  const v = asRecord(venue);
  if (!v) return { venue: '', city: '' };
  const state = typeof v.stateCode === 'string' && v.stateCode.trim()
    ? v.stateCode
    : typeof v.state === 'string' && v.state.trim() ? v.state : undefined;
  return {
    venue: typeof v.name === 'string' ? v.name : '',
    city: typeof v.city === 'string' ? v.city : '',
    state,
  };
}

function bestImage(event: Record<string, unknown>): string | undefined {
  if (typeof event.imageUrl === 'string' && event.imageUrl.trim()) return event.imageUrl;
  if (typeof event.image === 'string' && event.image.trim()) return event.image;
  if (!Array.isArray(event.images)) return undefined;
  const ranked = event.images
    .map(item => asRecord(item))
    .filter((item): item is Record<string, unknown> => !!item && typeof item.url === 'string' && !!item.url)
    .sort((a, b) => (typeof b.width === 'number' ? b.width : 0) - (typeof a.width === 'number' ? a.width : 0));
  return typeof ranked[0]?.url === 'string' ? ranked[0].url : undefined;
}

export function mapShowSignalEvent(event: unknown): Concert | null {
  const e = asRecord(event);
  if (!e || typeof e.id !== 'string' || !e.id.trim() || typeof e.name !== 'string' || !e.name.trim()) return null;
  const dateTime = concertDateTime(e);
  if (!dateTime) return null;
  const place = venueBits(e.venue);
  const url = typeof e.ticketUrl === 'string' && e.ticketUrl.trim()
    ? e.ticketUrl
    : typeof e.url === 'string' ? e.url : '';
  return {
    id: e.id,
    name: e.name,
    dateTime,
    venue: place.venue,
    city: place.city,
    state: place.state,
    url,
    image: bestImage(e),
  };
}

export function concertsFromShowSignalEvents(events: unknown, now = Date.now()): Concert[] {
  if (!Array.isArray(events)) return [];
  return Array.from(new Map(
    events
      .map(mapShowSignalEvent)
      .filter((concert): concert is Concert => !!concert && Date.parse(concert.dateTime) >= now)
      .map(concert => [concert.id, concert] as const),
  ).values()).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

export function eventsFromShowSignalBody(body: unknown): unknown[] | null {
  const root = asRecord(body);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  return Array.isArray(data.events) ? data.events : null;
}

export function showSignalErrorMessage(body: unknown, fallback: string): string {
  const root = asRecord(body);
  if (!root) return fallback;
  if (typeof root.error === 'string' && root.error.trim()) return root.error;
  const error = asRecord(root.error);
  return typeof error?.message === 'string' && error.message.trim() ? error.message : fallback;
}

