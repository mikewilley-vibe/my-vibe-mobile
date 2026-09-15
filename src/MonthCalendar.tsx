import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, styles } from './ui';
import {
 buildMonthGrid,
 cellEventSlots,
 compactTime,
 indexEventsByDay,
 isSameMonth,
 layoutCellEvents,
 monthTitle,
 monthWeeks,
 type MonthCell,
 type MonthEvent,
} from './monthGrid';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function chipLabel(event: MonthEvent, detailed: boolean): string {
 if (event.allDay) return event.title;
 const time = compactTime(event.start);
 const label = time ? `${time} ${event.title}` : event.title;
 return detailed && event.location ? `${label} · ${event.location}` : label;
}

function DayCell({
 cell,
 events,
 selected,
 slots,
 detailed,
 cellHeight,
 lastInWeek,
 onSelect,
 onCreate,
 onEvent,
}:{
 cell: MonthCell;
 events: MonthEvent[];
 selected: boolean;
 slots: number;
 detailed: boolean;
 cellHeight: number;
 lastInWeek: boolean;
 onSelect: (cell: MonthCell) => void;
 onCreate: (cell: MonthCell) => void;
 onEvent: (event: MonthEvent) => void;
}) {
 const layout = layoutCellEvents(events, slots);
 const spokenDate = cell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
 const count = events.length;
 const a11y = `${spokenDate}${cell.isToday ? ', today' : ''}${!cell.inMonth ? ', other month' : ''}${count ? `, ${count} ${count === 1 ? 'event' : 'events'}` : ', no events'}`;
 return (
  <View style={[
   calendarStyles.cell,
   { height: cellHeight },
   lastInWeek && calendarStyles.cellLast,
   !cell.inMonth && calendarStyles.outside,
   selected && calendarStyles.selected,
  ]}>
   <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={a11y}
    onPress={() => onSelect(cell)}
    style={calendarStyles.dayHit}
   >
    <View style={[calendarStyles.dayBadge, cell.isToday && calendarStyles.todayBadge, selected && !cell.isToday && calendarStyles.selectedBadge]}>
     <Text style={[
      calendarStyles.dayNum,
      !cell.inMonth && calendarStyles.outsideText,
      (cell.isToday || (selected && !cell.isToday)) && calendarStyles.dayNumOnColor,
     ]}>{cell.date.getDate()}</Text>
    </View>
   </Pressable>
   {layout.visible.map(event => (
    <Pressable
     key={event.key}
     accessibilityRole="button"
     accessibilityLabel={`${event.kind === 'plan' ? 'My Vibe plan' : 'Google event'} ${chipLabel(event, false)}`}
     onPress={() => onEvent(event)}
     style={[
      calendarStyles.chip,
      event.allDay && calendarStyles.chipAllDay,
      event.kind === 'google' && calendarStyles.chipGoogle,
      event.allDay && event.kind === 'google' && calendarStyles.chipGoogleAllDay,
     ]}
    >
     <Text numberOfLines={detailed ? 2 : 1} style={[
      calendarStyles.chipText,
      event.allDay && calendarStyles.chipTextAllDay,
      event.kind === 'google' && !event.allDay && calendarStyles.chipTextGoogle,
     ]}>{chipLabel(event, detailed)}</Text>
    </Pressable>
   ))}
   {layout.overflowCount > 0 && (
    <Pressable accessibilityRole="button" accessibilityLabel={`Show ${layout.overflowCount} more on ${spokenDate}`} onPress={() => onSelect(cell)}>
     <Text style={calendarStyles.more}>+{layout.overflowCount} more</Text>
    </Pressable>
   )}
   <Pressable
    accessibilityRole="button"
    accessibilityLabel={`Create a plan on ${spokenDate}`}
    onPress={() => onCreate(cell)}
    style={calendarStyles.emptyHit}
   />
  </View>
 );
}

export function MonthCalendar({
 month,
 selectedKey,
 events,
 onMonthChange,
 onToday,
 onSelectDay,
 onCreateDay,
 onPressEvent,
}:{
 month: Date;
 selectedKey: string | null;
 events: MonthEvent[];
 onMonthChange: (month: Date) => void;
 onToday: () => void;
 onSelectDay: (cell: MonthCell) => void;
 onCreateDay: (cell: MonthCell) => void;
 onPressEvent: (event: MonthEvent) => void;
}) {
 const { width, height } = useWindowDimensions();
 const detailed = width >= 768;
 const cells = buildMonthGrid(month);
 const byDay = indexEventsByDay(events, cells);
 const weeks = monthWeeks(cells);
 const viewingCurrent = isSameMonth(month, new Date());
 const cellHeight = Math.max(68, Math.min(detailed ? 118 : 82, Math.floor((height - (detailed ? 280 : 390)) / 6)));
 const slots = cellEventSlots(width, cellHeight);

 return (
  <View style={calendarStyles.board}>
   <View style={calendarStyles.toolbar}>
    <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={calendarStyles.navBtn} hitSlop={8}>
     <Text style={calendarStyles.navText}>‹</Text>
    </Pressable>
    <Text style={[styles.heading, calendarStyles.monthLabel]}>{monthTitle(month)}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={calendarStyles.navBtn} hitSlop={8}>
     <Text style={calendarStyles.navText}>›</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Jump to today" onPress={onToday} style={[calendarStyles.todayBtn, viewingCurrent && calendarStyles.todayBtnCurrent]}>
     <Text style={[calendarStyles.todayBtnText, viewingCurrent && calendarStyles.todayBtnTextCurrent]}>Today</Text>
    </Pressable>
   </View>
   <View style={calendarStyles.weekdays}>
    {WEEKDAYS.map((label, i) => (
     <Text key={WEEKDAY_NAMES[i]} accessibilityLabel={WEEKDAY_NAMES[i]} style={calendarStyles.weekday}>{label}</Text>
    ))}
   </View>
   <View>
    {weeks.map((week, weekIndex) => (
     <View key={weekIndex} style={calendarStyles.week}>
      {week.map((cell, dayIndex) => (
       <DayCell
        key={cell.key}
        cell={cell}
        events={byDay.get(cell.key) || []}
        selected={selectedKey === cell.key}
        slots={slots}
        detailed={detailed}
        cellHeight={cellHeight}
        lastInWeek={dayIndex === 6}
        onSelect={onSelectDay}
        onCreate={onCreateDay}
        onEvent={onPressEvent}
       />
      ))}
     </View>
    ))}
   </View>
  </View>
 );
}

const calendarStyles = StyleSheet.create({
 board: {
  backgroundColor: 'white',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.fog,
  overflow: 'hidden',
 },
 toolbar: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 10,
  paddingTop: 10,
  paddingBottom: 6,
 },
 navBtn: {
  minWidth: 44,
  minHeight: 44,
  borderRadius: 12,
  backgroundColor: colors.fog,
  alignItems: 'center',
  justifyContent: 'center',
 },
 navText: { color: colors.ink, fontSize: 22, fontWeight: '600' },
 monthLabel: { flex: 1, fontSize: 20, textAlign: 'center' },
 todayBtn: {
  minHeight: 44,
  paddingHorizontal: 14,
  borderRadius: 12,
  backgroundColor: colors.harbor,
  alignItems: 'center',
  justifyContent: 'center',
 },
 todayBtnCurrent: { backgroundColor: colors.fog },
 todayBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
 todayBtnTextCurrent: { color: colors.ink },
 weekdays: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4 },
 weekday: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
 week: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.fog },
 cell: {
  flex: 1,
  borderRightWidth: 1,
  borderRightColor: colors.fog,
  paddingHorizontal: 3,
  paddingTop: 4,
  paddingBottom: 4,
  gap: 2,
  overflow: 'hidden',
 },
 cellLast: { borderRightWidth: 0 },
 outside: { backgroundColor: '#eef0ed' },
 selected: { backgroundColor: 'rgba(58,99,97,0.12)' },
 dayHit: { alignSelf: 'flex-start' },
 dayBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
 todayBadge: { backgroundColor: colors.harbor },
 selectedBadge: { backgroundColor: colors.ink },
 dayNum: { fontSize: 12, fontWeight: '700', color: colors.ink },
 dayNumOnColor: { color: 'white' },
 outsideText: { color: colors.muted },
 chip: {
  backgroundColor: 'rgba(58,99,97,0.14)',
  borderRadius: 4,
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderLeftWidth: 2,
  borderLeftColor: colors.harbor,
 },
 chipAllDay: { backgroundColor: colors.harbor, borderLeftWidth: 0 },
 chipGoogle: { backgroundColor: 'rgba(196,92,38,0.14)', borderLeftColor: colors.signal },
 chipGoogleAllDay: { backgroundColor: colors.signal, borderLeftWidth: 0 },
 chipText: { fontSize: 10, lineHeight: 13, color: colors.ink, fontWeight: '600' },
 chipTextAllDay: { color: 'white' },
 chipTextGoogle: { color: colors.ink },
 more: { fontSize: 10, fontWeight: '700', color: colors.muted, paddingHorizontal: 2, paddingVertical: 1 },
 emptyHit: { flex: 1, minHeight: 10 },
});
