export type CalendarSourceHint = { name?: string | null; type?: string | null };
export type CalendarLike = {
 title?: string | null;
 name?: string | null;
 type?: string | null;
 ownerAccount?: string | null;
 source?: CalendarSourceHint | null;
};

const GOOGLE_HINT=/google|gmail|googlemail/i;

export const DEFAULT_GOOGLE_CALENDAR_EMBED_URL='https://calendar.google.com/calendar/embed?src=mikewilley%40gmail.com&ctz=America%2FNew_York';
export const GOOGLE_CALENDAR_SETUP_HINT='To use Google Calendar here, add your Google account in iPhone Settings → Calendar (or Android Settings → Accounts), then come back to My Vibe.';

export function isGoogleCalendar(input?: CalendarLike | null): boolean {
 if (!input) return false;
 return [input.source?.name, input.source?.type, input.type, input.name, input.ownerAccount]
  .some(value => typeof value === 'string' && GOOGLE_HINT.test(value));
}

export function preferGoogleCalendars<T extends CalendarLike>(calendars: T[]): T[] {
 return [...calendars.filter(isGoogleCalendar), ...calendars.filter(c => !isGoogleCalendar(c))];
}

export function calendarChoiceLabel(calendar: CalendarLike, options?: { recommended?: boolean }): string {
 const title=calendar.title?.trim()||'Untitled calendar';
 const base=isGoogleCalendar(calendar)?`Google · ${title}`:calendar.source?.name?`${title} · ${calendar.source.name}`:title;
 return options?.recommended?`${base} · recommended`:base;
}

export function isMyVibeDeviceEvent(notes?: string | null): boolean {
 return typeof notes === 'string' && notes.includes('[My Vibe:');
}

export function monthRange(month: Date): { start: Date; end: Date } {
 return { start: new Date(month.getFullYear(), month.getMonth(), 1), end: new Date(month.getFullYear(), month.getMonth()+1, 1) };
}

export function parseGoogleCalendarEmbedUrl(value?: string | null): string | null {
 if (!value?.trim()) return null;
 try {
  const url=new URL(value.trim());
  if (url.protocol!=='https:') return null;
  if (url.hostname!=='calendar.google.com') return null;
  if (!url.pathname.includes('/calendar/embed')) return null;
  return url.toString();
 } catch { return null; }
}

export function resolveGoogleCalendarEmbedUrl(envValue?: string | null): string | null {
 return parseGoogleCalendarEmbedUrl(envValue) ?? parseGoogleCalendarEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL);
}

export function agendaEmbedUrl(src: string, timezone='America/New_York'): string {
 const url=new URL(src);
 url.searchParams.set('mode','AGENDA');
 url.searchParams.set('ctz',timezone);
 url.searchParams.set('showTitle','0');
 url.searchParams.set('showTabs','0');
 url.searchParams.set('showCalendars','0');
 url.searchParams.set('showPrint','0');
 url.searchParams.set('showTz','0');
 return url.toString();
}
