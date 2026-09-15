export type MonthEventKind = 'plan' | 'google';

export type MonthEvent = {
 key: string;
 title: string;
 start: string;
 end: string;
 allDay: boolean;
 kind: MonthEventKind;
 planId?: string;
 googleId?: string;
 location?: string;
};

export type MonthCell = {
 date: Date;
 key: string;
 inMonth: boolean;
 isToday: boolean;
};

export function dayKey(date: Date): string {
 const y = date.getFullYear();
 const m = String(date.getMonth() + 1).padStart(2, '0');
 const d = String(date.getDate()).padStart(2, '0');
 return `${y}-${m}-${d}`;
}

export function dateFromDayKey(key: string): Date {
 const [y, m, d] = key.split('-').map(Number);
 return new Date(y, m - 1, d);
}

export function startOfMonth(date: Date): Date {
 return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, count: number): Date {
 return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
 return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function buildMonthGrid(month: Date, today = new Date()): MonthCell[] {
 const year = month.getFullYear();
 const monthIndex = month.getMonth();
 const first = new Date(year, monthIndex, 1);
 const gridStart = new Date(year, monthIndex, 1 - first.getDay());
 const todayKey = dayKey(today);
 const cells: MonthCell[] = [];
 for (let i = 0; i < 42; i++) {
  const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
  cells.push({
   date,
   key: dayKey(date),
   inMonth: date.getMonth() === monthIndex,
   isToday: dayKey(date) === todayKey,
  });
 }
 return cells;
}

export function monthWeeks(cells: MonthCell[]): MonthCell[][] {
 return [0, 1, 2, 3, 4, 5].map(week => cells.slice(week * 7, week * 7 + 7));
}

/** Inclusive start of the first grid day through exclusive start of the day after the last grid day. */
export function visibleMonthRange(month: Date): { start: Date; end: Date } {
 const cells = buildMonthGrid(month);
 const first = cells[0].date;
 const last = cells[41].date;
 return {
  start: new Date(first.getFullYear(), first.getMonth(), first.getDate()),
  end: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
 };
}

export function isAllDayRange(startIso: string, endIso: string): boolean {
 const start = new Date(startIso);
 const end = new Date(endIso);
 if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return false;
 const startsMidnight = start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0 && start.getMilliseconds() === 0;
 const endsMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 && end.getMilliseconds() === 0;
 const duration = end.getTime() - start.getTime();
 return startsMidnight && endsMidnight && duration >= 24 * 60 * 60 * 1000 && duration % (24 * 60 * 60 * 1000) === 0;
}

export function eventOverlapsLocalDay(startIso: string, endIso: string, day: Date): boolean {
 const start = new Date(startIso);
 const end = new Date(endIso);
 if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return false;
 const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
 const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
 return start < dayEnd && end > dayStart;
}

export function compareMonthEvents(a: MonthEvent, b: MonthEvent): number {
 if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
 const start = a.start.localeCompare(b.start);
 if (start) return start;
 if (a.kind !== b.kind) return a.kind === 'plan' ? -1 : 1;
 return a.title.localeCompare(b.title) || a.key.localeCompare(b.key);
}

export function eventsForDay(events: MonthEvent[], day: Date): MonthEvent[] {
 return events.filter(event => eventOverlapsLocalDay(event.start, event.end, day)).sort(compareMonthEvents);
}

export function indexEventsByDay(events: MonthEvent[], cells: MonthCell[]): Map<string, MonthEvent[]> {
 const map = new Map<string, MonthEvent[]>();
 for (const cell of cells) map.set(cell.key, []);
 for (const event of events) {
  for (const cell of cells) {
   if (eventOverlapsLocalDay(event.start, event.end, cell.date)) map.get(cell.key)!.push(event);
  }
 }
 for (const list of map.values()) list.sort(compareMonthEvents);
 return map;
}

/** Google-style: if events overflow the slots, reserve the last slot for “+N more”. */
export function layoutCellEvents<T>(events: T[], slotCount: number): { visible: T[]; overflowCount: number } {
 if (slotCount < 1) return { visible: [], overflowCount: events.length };
 if (events.length <= slotCount) return { visible: events, overflowCount: 0 };
 const visibleCount = Math.max(0, slotCount - 1);
 return { visible: events.slice(0, visibleCount), overflowCount: events.length - visibleCount };
}

export function cellEventSlots(viewportWidth: number, cellHeight: number): number {
 const row = viewportWidth >= 768 ? 20 : 16;
 const header = 22;
 const slots = Math.floor((cellHeight - header) / row);
 if (viewportWidth >= 768) return Math.max(2, slots);
 return Math.max(2, Math.min(3, slots));
}

export function compactTime(iso: string): string {
 const date = new Date(iso);
 if (!Number.isFinite(date.getTime())) return '';
 const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(date);
 const hour = parts.find(part => part.type === 'hour')?.value ?? '';
 const minute = parts.find(part => part.type === 'minute')?.value ?? '';
 const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value ?? '';
 const period = dayPeriod ? dayPeriod.charAt(0).toLowerCase() : '';
 if (!hour) return '';
 if (minute && minute !== '00') return `${hour}:${minute}${period}`;
 return `${hour}${period}`;
}

export function planStartForDate(date: Date, now = new Date()): string {
 if (dayKey(date) === dayKey(now)) return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
 return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0, 0).toISOString();
}

export function monthTitle(month: Date): string {
 return month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
