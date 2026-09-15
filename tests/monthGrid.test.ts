import test from 'node:test';
import assert from 'node:assert/strict';
import {
 addMonths,
 buildMonthGrid,
 cellEventSlots,
 compactTime,
 compareMonthEvents,
 dateFromDayKey,
 dayKey,
 eventsForDay,
 isAllDayRange,
 layoutCellEvents,
 monthWeeks,
 planStartForDate,
 startOfMonth,
 visibleMonthRange,
 type MonthEvent,
} from '../src/monthGrid.ts';

function event(partial: Partial<MonthEvent> & Pick<MonthEvent, 'key' | 'title' | 'start' | 'end'>): MonthEvent {
 return { allDay: false, kind: 'plan', ...partial };
}

test('month grid is always six Sunday-start weeks with adjacent-month padding', () => {
 const today = new Date(2026, 8, 15);
 const september = buildMonthGrid(new Date(2026, 8, 1), today);
 assert.equal(september.length, 42);
 assert.equal(monthWeeks(september).length, 6);
 assert.ok(monthWeeks(september).every(week => week.length === 7));
 assert.equal(september[0].date.getDay(), 0);
 assert.equal(september[41].date.getDay(), 6);
 assert.equal(september[0].inMonth, false);
 assert.equal(september[0].date.getMonth(), 7);
 assert.equal(september[0].date.getDate(), 30);
 assert.equal(september[2].inMonth, true);
 assert.equal(september[2].date.getDate(), 1);
 assert.equal(september[16].isToday, true);
 assert.equal(september[16].key, '2026-09-15');
 assert.equal(september[32].inMonth, false);
 assert.equal(september[32].date.getMonth(), 9);
});

test('a month that starts on Sunday still fills six rows with trailing days', () => {
 const cells = buildMonthGrid(new Date(2026, 1, 1), new Date(2026, 1, 1));
 assert.equal(cells.length, 42);
 assert.equal(cells[0].inMonth, true);
 assert.equal(cells[0].date.getDate(), 1);
 assert.equal(cells[0].date.getDay(), 0);
 assert.equal(cells[27].date.getDate(), 28);
 assert.equal(cells[27].inMonth, true);
 assert.equal(cells[28].inMonth, false);
 assert.equal(cells[41].inMonth, false);
});

test('a 31-day month starting Saturday still fits in six rows', () => {
 const cells = buildMonthGrid(new Date(2026, 7, 1), new Date(2026, 7, 1));
 assert.equal(cells[0].date.getDate(), 26);
 assert.equal(cells[0].inMonth, false);
 assert.equal(cells[6].date.getDate(), 1);
 assert.equal(cells[6].date.getDay(), 6);
 assert.equal(cells[6].inMonth, true);
 assert.equal(cells[36].date.getDate(), 31);
 assert.equal(cells[36].inMonth, true);
 assert.equal(cells[41].inMonth, false);
});

test('visible range covers leading and trailing grid days, not only the month', () => {
 const { start, end } = visibleMonthRange(new Date(2026, 8, 1));
 assert.equal(dayKey(start), '2026-08-30');
 assert.equal(dayKey(end), '2026-10-11');
});

test('dayKey and dateFromDayKey stay on the local calendar date', () => {
 const date = new Date(2026, 8, 5, 23, 30, 0);
 assert.equal(dayKey(date), '2026-09-05');
 assert.equal(dayKey(dateFromDayKey('2026-09-05')), '2026-09-05');
});

test('startOfMonth and addMonths move by calendar month', () => {
 const month = startOfMonth(new Date(2026, 8, 15));
 assert.equal(dayKey(month), '2026-09-01');
 assert.equal(dayKey(addMonths(month, 1)), '2026-10-01');
 assert.equal(dayKey(addMonths(month, -1)), '2026-08-01');
});

test('all-day ranges start and end on local midnight with whole-day duration', () => {
 const start = new Date(2026, 8, 15, 0, 0, 0, 0).toISOString();
 const end = new Date(2026, 8, 16, 0, 0, 0, 0).toISOString();
 assert.equal(isAllDayRange(start, end), true);
 assert.equal(isAllDayRange(new Date(2026, 8, 15, 18, 0, 0).toISOString(), new Date(2026, 8, 15, 20, 0, 0).toISOString()), false);
 assert.equal(isAllDayRange(start, start), false);
});

test('timed events land on their local day; overnight events span both days', () => {
 const dinner = event({
  key: 'dinner',
  title: 'Dinner',
  start: new Date(2026, 8, 15, 18, 0, 0).toISOString(),
  end: new Date(2026, 8, 15, 20, 0, 0).toISOString(),
 });
 const late = event({
  key: 'late',
  title: 'Late show',
  start: new Date(2026, 8, 15, 23, 0, 0).toISOString(),
  end: new Date(2026, 8, 16, 1, 0, 0).toISOString(),
 });
 const cells = buildMonthGrid(new Date(2026, 8, 1), new Date(2026, 8, 15));
 const dinnerDays = cells.filter(cell => eventsForDay([dinner], cell.date).length);
 const lateDays = cells.filter(cell => eventsForDay([late], cell.date).length);
 assert.deepEqual(dinnerDays.map(cell => cell.key), ['2026-09-15']);
 assert.deepEqual(lateDays.map(cell => cell.key), ['2026-09-15', '2026-09-16']);
});

test('all-day events occupy the start day and not the exclusive end day', () => {
  const holiday = event({
   key: 'holiday',
   title: 'Holiday',
   allDay: true,
   start: new Date(2026, 8, 15, 0, 0, 0, 0).toISOString(),
   end: new Date(2026, 8, 16, 0, 0, 0, 0).toISOString(),
  });
  assert.equal(eventsForDay([holiday], new Date(2026, 8, 15)).length, 1);
  assert.equal(eventsForDay([holiday], new Date(2026, 8, 16)).length, 0);
});

test('events on leading and trailing days still belong to those cells', () => {
 const leading = event({
  key: 'leading',
  title: 'August leftover',
  start: new Date(2026, 7, 30, 9, 0, 0).toISOString(),
  end: new Date(2026, 7, 30, 10, 0, 0).toISOString(),
 });
 const trailing = event({
  key: 'trailing',
  title: 'October peek',
  start: new Date(2026, 9, 10, 9, 0, 0).toISOString(),
  end: new Date(2026, 9, 10, 10, 0, 0).toISOString(),
 });
 const cells = buildMonthGrid(new Date(2026, 8, 1));
 assert.equal(eventsForDay([leading], cells[0].date)[0].key, 'leading');
 assert.equal(eventsForDay([trailing], cells[41].date)[0].key, 'trailing');
});

test('zero, one, and overflowing events follow Google-style slot reservation', () => {
 const items = ['a', 'b', 'c', 'd'];
 assert.deepEqual(layoutCellEvents([], 3), { visible: [], overflowCount: 0 });
 assert.deepEqual(layoutCellEvents(items.slice(0, 1), 3), { visible: ['a'], overflowCount: 0 });
 assert.deepEqual(layoutCellEvents(items.slice(0, 3), 3), { visible: ['a', 'b', 'c'], overflowCount: 0 });
 assert.deepEqual(layoutCellEvents(items, 3), { visible: ['a', 'b'], overflowCount: 2 });
 assert.deepEqual(layoutCellEvents(items, 1), { visible: [], overflowCount: 4 });
});

test('phone cells keep at least two event slots; larger widths can show more', () => {
 assert.equal(cellEventSlots(390, 64), 2);
 assert.equal(cellEventSlots(390, 88), 3);
 assert.equal(cellEventSlots(1024, 80), 2);
 assert.ok(cellEventSlots(1024, 120) >= 3);
});

test('all-day plans sort before timed events, then My Vibe before Google', () => {
 const timedPlan = event({ key: 'plan-timed', title: 'Dinner', start: '2026-09-15T22:00:00.000Z', end: '2026-09-15T23:00:00.000Z' });
 const allDay = event({ key: 'plan-all', title: 'Holiday', start: '2026-09-15T04:00:00.000Z', end: '2026-09-16T04:00:00.000Z', allDay: true });
 const google = event({ key: 'g', title: 'Dinner', start: '2026-09-15T22:00:00.000Z', end: '2026-09-15T23:00:00.000Z', kind: 'google' });
 const ordered = [google, timedPlan, allDay].sort(compareMonthEvents);
 assert.deepEqual(ordered.map(item => item.key), ['plan-all', 'plan-timed', 'g']);
});

test('compact time hides :00 and keeps minutes when present', () => {
 const half = compactTime(new Date(2026, 8, 15, 18, 30, 0).toISOString());
 const top = compactTime(new Date(2026, 8, 15, 18, 0, 0).toISOString());
 assert.match(half, /30/);
 assert.equal(half.includes(' '), false);
 assert.doesNotMatch(top, /:00/);
 assert.ok(top.length > 0);
});

test('creating from a date uses now+1h today and 6pm on other days', () => {
 const now = new Date(2026, 8, 15, 10, 0, 0);
 const today = new Date(planStartForDate(new Date(2026, 8, 15, 8, 0, 0), now));
 assert.equal(today.getTime(), now.getTime() + 60 * 60 * 1000);
 const other = new Date(planStartForDate(new Date(2026, 8, 20), now));
 assert.equal(other.getFullYear(), 2026);
 assert.equal(other.getMonth(), 8);
 assert.equal(other.getDate(), 20);
 assert.equal(other.getHours(), 18);
 assert.equal(other.getMinutes(), 0);
});
