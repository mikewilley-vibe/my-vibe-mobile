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
 const title = event.chipTitle || event.title;
 if (event.allDay || event.timeUnknown) return title;
 const time = compactTime(event.start);
 const label = time ? `${time} ${title}` : title;
 return detailed && event.location ? `${label} · ${event.location}` : label;
}

function chipStyle(event: MonthEvent) {
 if (event.source === 'google') return [calendarStyles.chip, event.allDay && calendarStyles.chipGoogleAllDay, !event.allDay && calendarStyles.chipGoogle];
 if (event.source === 'uva-sports') return [calendarStyles.chip, event.allDay && calendarStyles.chipUvaAllDay, !event.allDay && calendarStyles.chipUva];
 if (event.source === 'showsignal') return [calendarStyles.chip, event.allDay && calendarStyles.chipShowAllDay, !event.allDay && calendarStyles.chipShow];
 if (event.source === 'sweatshift') return [calendarStyles.chip, event.allDay && calendarStyles.chipSweatAllDay, !event.allDay && calendarStyles.chipSweat];
 return [calendarStyles.chip, event.allDay && calendarStyles.chipAllDay];
}

function chipTextStyle(event: MonthEvent) {
 const onColor = event.allDay && (event.source === 'google' || event.source === 'uva-sports' || event.source === 'personal' || event.source === 'showsignal' || event.source === 'sweatshift');
 if (event.source === 'google' && !event.allDay) return [calendarStyles.chipText, calendarStyles.chipTextGoogle];
 if (event.source === 'uva-sports' && !event.allDay) return [calendarStyles.chipText, calendarStyles.chipTextUva];
 return [calendarStyles.chipText, onColor && calendarStyles.chipTextAllDay];
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
 const spokenDate = cell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
     accessibilityLabel={`${event.source} ${chipLabel(event, false)}`}
     onPress={() => onEvent(event)}
     style={chipStyle(event)}
    >
     <Text numberOfLines={detailed ? 2 : 1} style={chipTextStyle(event)}>{chipLabel(event, detailed)}</Text>
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
   >
    <Text accessible={false} style={calendarStyles.emptyHitText}> </Text>
   </Pressable>
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
 const cellHeight = Math.max(64, Math.min(detailed ? 96 : 78, Math.floor((height - (detailed ? 440 : 420)) / 6)));
 const slots = cellEventSlots(width, cellHeight);

 return (
  <View style={calendarStyles.board}>
   <View style={calendarStyles.toolbar}>
    <View style={calendarStyles.toolbarRow}>
     <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={calendarStyles.navBtn} hitSlop={8}>
      <Text style={calendarStyles.navText}>‹</Text>
     </Pressable>
     <Text style={[styles.heading, calendarStyles.monthLabel, !detailed && calendarStyles.monthLabelCompact]}>{monthTitle(month)}</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={calendarStyles.navBtn} hitSlop={8}>
      <Text style={calendarStyles.navText}>›</Text>
     </Pressable>
     {detailed && (
      <Pressable accessibilityRole="button" accessibilityLabel="Jump to today" onPress={onToday} style={[calendarStyles.todayBtn, viewingCurrent && calendarStyles.todayBtnCurrent]}>
       <Text style={[calendarStyles.todayBtnText, viewingCurrent && calendarStyles.todayBtnTextCurrent]}>Today</Text>
      </Pressable>
     )}
    </View>
    {!detailed && (
     <View style={calendarStyles.toolbarTodayRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Jump to today" onPress={onToday} style={[calendarStyles.todayBtn, viewingCurrent && calendarStyles.todayBtnCurrent]}>
       <Text style={[calendarStyles.todayBtnText, viewingCurrent && calendarStyles.todayBtnTextCurrent]}>Today</Text>
      </Pressable>
     </View>
    )}
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
  backgroundColor: colors.surface,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.fog,
  overflow: 'hidden',
 },
 toolbar: {
  paddingHorizontal: 10,
  paddingTop: 10,
  paddingBottom: 6,
  gap: 6,
 },
 toolbarRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
 },
 toolbarTodayRow: {
  flexDirection: 'row',
  justifyContent: 'center',
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
 monthLabelCompact: { fontSize: 18 },
 todayBtn: {
  minHeight: 44,
  paddingHorizontal: 14,
  borderRadius: 12,
  backgroundColor: colors.harbor,
  alignItems: 'center',
  justifyContent: 'center',
 },
 todayBtnCurrent: { backgroundColor: colors.fog },
 todayBtnText: { color: colors.onAccent, fontSize: 15, fontWeight: '600' },
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
 outside: { backgroundColor: colors.wash },
 selected: { backgroundColor: colors.selectedFill },
 dayHit: { alignSelf: 'flex-start' },
 dayBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
 todayBadge: { backgroundColor: colors.harbor },
 selectedBadge: { backgroundColor: colors.ink },
 dayNum: { fontSize: 12, fontWeight: '700', color: colors.ink },
 dayNumOnColor: { color: colors.onAccent },
 outsideText: { color: colors.muted },
 chip: {
  backgroundColor: colors.accentFill,
  borderRadius: 4,
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderLeftWidth: 2,
  borderLeftColor: colors.harbor,
 },
 chipAllDay: { backgroundColor: colors.harbor, borderLeftWidth: 0 },
 chipGoogle: { backgroundColor: 'rgba(196,92,38,0.14)', borderLeftColor: colors.signal },
 chipGoogleAllDay: { backgroundColor: colors.signal, borderLeftWidth: 0 },
 chipUva: { backgroundColor: 'rgba(35,45,75,0.14)', borderLeftColor: colors.uvaBlue },
 chipUvaAllDay: { backgroundColor: colors.uvaBlue, borderLeftWidth: 0 },
 chipShow: { backgroundColor: 'rgba(124,58,107,0.14)', borderLeftColor: '#7c3a6b' },
 chipShowAllDay: { backgroundColor: '#7c3a6b', borderLeftWidth: 0 },
 chipSweat: { backgroundColor: 'rgba(46,125,107,0.14)', borderLeftColor: '#2e7d6b' },
 chipSweatAllDay: { backgroundColor: '#2e7d6b', borderLeftWidth: 0 },
 chipText: { fontSize: 10, lineHeight: 13, color: colors.ink, fontWeight: '600' },
 chipTextAllDay: { color: colors.onAccent },
 chipTextGoogle: { color: colors.ink },
 chipTextUva: { color: colors.uvaBlue },
 more: { fontSize: 10, fontWeight: '700', color: colors.muted, paddingHorizontal: 2, paddingVertical: 1 },
 emptyHit: { flex: 1, minHeight: 24, justifyContent: 'flex-end' },
 emptyHitText: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
