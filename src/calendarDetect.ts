export type CalendarSourceHint = { name?: string | null; type?: string | null };
export type CalendarLike = {
 id?: string | null;
 title?: string | null;
 name?: string | null;
 type?: string | null;
 ownerAccount?: string | null;
 source?: CalendarSourceHint | null;
};
export type CalendarView = 'agenda' | 'month';

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

export function calendarChoiceLabel(calendar: CalendarLike, options?: { recommended?: boolean; family?: boolean }): string {
 const title=calendar.title?.trim()||'Untitled calendar';
 const google=options?.family||isGoogleCalendar(calendar);
 const base=options?.family?`Family · Google · ${title}`:google?`Google · ${title}`:calendar.source?.name?`${title} · ${calendar.source.name}`:title;
 return options?.recommended?`${base} · recommended`:base;
}

function normalizeCalendarSrc(value: string): string | null {
 let candidate=value.trim();
 try { candidate=decodeURIComponent(candidate); } catch { /* keep raw */ }
 candidate=candidate.trim().toLowerCase();
 return candidate||null;
}

/** Email or calendar id from an embed URL, or a bare email/id. */
export function familyCalendarSrc(embedSrcOrEmail?: string | null): string | null {
 if (!embedSrcOrEmail?.trim()) return null;
 const raw=embedSrcOrEmail.trim();
 try {
  const url=new URL(raw);
  if (url.hostname!=='calendar.google.com') return null;
  const src=url.searchParams.get('src');
  return src?normalizeCalendarSrc(src):null;
 } catch {
  return normalizeCalendarSrc(raw);
 }
}

function calendarIdentityValues(calendar: CalendarLike): string[] {
 return [calendar.title, calendar.name, calendar.ownerAccount, calendar.source?.name, calendar.source?.type]
  .filter((value): value is string => typeof value === 'string' && !!value.trim())
  .map(value => value.trim().toLowerCase());
}

/** True when a device Google calendar is the family calendar from the public embed `src`. */
export function matchesFamilyGoogleCalendar(calendar: CalendarLike, embedSrcOrEmail?: string | null): boolean {
 if (!isGoogleCalendar(calendar)) return false;
 const target=familyCalendarSrc(embedSrcOrEmail);
 if (!target) return false;
 return calendarIdentityValues(calendar).some(value => value === target || value.includes(target));
}

export function preferFamilyThenGoogleCalendars<T extends CalendarLike>(calendars: T[], embedSrcOrEmail?: string | null): T[] {
 const family=calendars.filter(c => matchesFamilyGoogleCalendar(c, embedSrcOrEmail));
 const rest=calendars.filter(c => !matchesFamilyGoogleCalendar(c, embedSrcOrEmail));
 return [...family, ...preferGoogleCalendars(rest)];
}

/** The one writable family Google calendar, if matching is unambiguous. */
export function familyCalendarTarget<T extends CalendarLike>(calendars: T[], embedSrcOrEmail?: string | null): T | null {
 const matches=calendars.filter(c => matchesFamilyGoogleCalendar(c, embedSrcOrEmail));
 return matches.length===1?matches[0]:null;
}

export function defaultCalendarView(embedSrc?: string | null): CalendarView {
 return embedSrc?'agenda':'month';
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
