import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useData } from './store';
import { googleMonthEvents, openCalendar, type DeviceEvent } from './calendar';
import { MonthCalendar } from './MonthCalendar';
import {
 compareMonthEvents,
 dateFromDayKey,
 dayKey,
 eventOverlapsLocalDay,
 planStartForDate,
 startOfMonth,
 visibleMonthRange,
 type MonthEvent,
} from './monthGrid';
import { getUvaSchedule } from './api';
import {
 CALENDAR_SOURCES,
 eventDetailLines,
 mergeCalendarEvents,
 setSourceEnabled,
 sourceLabel,
 useSourceEnabled,
} from './calendarSources';
import { getSweatShiftWorkouts, type SweatShiftWorkout } from './sweatshift';
import type { UvaSportId } from './uvaSports';
import type { UvaGame } from './uva';
import { Button, Card, colors, styles, when } from './ui';

function whenLabel(event: MonthEvent): string {
 if (event.timeUnknown) return 'Time TBA';
 if (event.allDay) return 'All day';
 return when(event.start);
}

/**
 * Native multi-source month grid formerly on the Home tab.
 * `embedded` drops the standalone page chrome so Calendar can host it.
 */
export function HomeMonthCalendar({
 embedded = false,
 refreshKey = 0,
}: {
 embedded?: boolean;
 refreshKey?: number;
}) {
 const { plans, links } = useData();
 const enabledSources = useSourceEnabled();
 const [month, setMonth] = useState(() => startOfMonth(new Date()));
 const [selected, setSelected] = useState<string | null>(() => dayKey(new Date()));
 const [googleEvents, setGoogleEvents] = useState<DeviceEvent[]>([]);
 const [uvaBySport, setUvaBySport] = useState<Partial<Record<UvaSportId, UvaGame[]>>>({});
 const [sweatshiftWorkouts, setSweatshiftWorkouts] = useState<SweatShiftWorkout[]>([]);

 const loadMonth = useCallback((active: { current: boolean }) => {
  const range = visibleMonthRange(month);
  void googleMonthEvents(range.start, range.end, { request: false }).then(result => {
   if (!active.current) return;
   setGoogleEvents(result.access === 'granted' ? result.events : []);
  }).catch(() => { if (active.current) setGoogleEvents([]); });
  void getUvaSchedule().then(data => {
   if (!active.current) return;
   setUvaBySport(data.bySport);
  }).catch(() => { if (active.current) setUvaBySport({}); });
  void getSweatShiftWorkouts().then(data => {
   if (!active.current) return;
   setSweatshiftWorkouts(data.workouts);
  }).catch(() => { if (active.current) setSweatshiftWorkouts([]); });
 }, [month]);

 useFocusEffect(useCallback(() => {
  const active = { current: true };
  loadMonth(active);
  return () => { active.current = false; };
 }, [loadMonth, refreshKey]));

 const linkedIds = useMemo(() => new Set(Object.values(links)), [links]);
 const range = useMemo(() => visibleMonthRange(month), [month]);
 const events = useMemo(() => mergeCalendarEvents({
  plans,
  googleEvents,
  linkedEventIds: linkedIds,
  uvaBySport,
  sweatshiftWorkouts,
  range,
  enabledSources,
 }), [plans, googleEvents, linkedIds, uvaBySport, sweatshiftWorkouts, range, enabledSources]);

 const selectedDate = selected ? dateFromDayKey(selected) : null;
 const selectedEvents = selectedDate
  ? events.filter(event => eventOverlapsLocalDay(event.start, event.end, selectedDate)).sort(compareMonthEvents)
  : [];

 function createFor(date: Date) {
  setSelected(dayKey(date));
  router.push({ pathname: '/plan', params: { start: planStartForDate(date) } });
 }

 function openUvaEvent(event: MonthEvent) {
  const details = [
   whenLabel(event) === 'Time TBA' ? undefined : whenLabel(event) === 'All day' ? undefined : whenLabel(event),
   ...eventDetailLines(event),
   event.timeUnknown ? 'Start time TBA' : undefined,
  ].filter(Boolean).join('\n');
  const saved = event.planId ? plans.some(plan => plan.id === event.planId) : false;
  const buttons: { text: string; onPress?: () => void }[] = [{ text: 'Close' }];
  if (event.planId) {
   buttons.push({
    text: saved ? 'View plan' : 'Add to My Vibe',
    onPress: () => router.push({
     pathname: '/plan',
     params: saved ? { id: event.planId } : {
      id: event.planId,
      title: event.title,
      start: event.start,
      location: event.venue || event.location || '',
      url: event.externalUrl,
     },
    }),
   });
  }
  buttons.push({ text: 'UVA tab', onPress: () => router.push('/uva') });
  Alert.alert(event.title, details || 'UVA game', buttons);
 }

 async function openEvent(event: MonthEvent) {
  if (event.source === 'uva-sports') {
   openUvaEvent(event);
   return;
  }
  if (event.planId) {
   router.push({ pathname: '/plan', params: { id: event.planId } });
   return;
  }
  if (event.googleId) {
   try { await openCalendar(event.googleId); }
   catch { Alert.alert(event.title, [when(event.start), event.location].filter(Boolean).join('\n') || 'Google calendar event'); }
  }
 }

 const dayDetails = (
  <>
   <View style={homeStyles.sources} accessibilityRole="summary" accessibilityLabel="Calendar sources">
    {CALENDAR_SOURCES.map(source => {
     const on = enabledSources[source.id] !== false;
     return (
      <Pressable
       key={source.id}
       accessibilityRole="button"
       accessibilityState={{ selected: on }}
       accessibilityLabel={`${source.label}${on ? ', shown' : ', hidden'}. ${source.live ? '' : 'Not connected yet.'}`}
       onPress={() => void setSourceEnabled(source.id, !on)}
       style={[homeStyles.sourceChip, on ? homeStyles.sourceOn : homeStyles.sourceOff]}
      >
       <Text style={[homeStyles.sourceText, !on && homeStyles.sourceTextOff]}>{source.shortLabel}</Text>
      </Pressable>
     );
    })}
   </View>
   {selectedDate ? (
    <>
     <Text style={styles.heading}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
     {selectedEvents.length ? selectedEvents.map(item => (
      <Card key={item.key}>
       <Text style={styles.eyebrow}>{whenLabel(item)} · {sourceLabel(item.source)}</Text>
       <Text style={styles.heading}>{item.title}</Text>
       {eventDetailLines(item).map(line => <Text key={line} style={styles.body}>{line}</Text>)}
       {item.source === 'uva-sports'
        ? <Button title="Game details" onPress={() => openUvaEvent(item)} />
        : item.planId
         ? <Button title="View plan" onPress={() => router.push({ pathname: '/plan', params: { id: item.planId } })} />
         : <Button title="Open in Calendar" onPress={() => void openEvent(item)} />}
      </Card>
     )) : <Text style={styles.body}>Nothing planned yet. Tap below to make something for this day.</Text>}
     <Button title="+ Plan for this day" onPress={() => createFor(selectedDate)} />
    </>
   ) : (
    <>
     <Text style={styles.body}>Tap a date to see the day. Tap an empty space in a cell to make a plan for that date.</Text>
     <Button title="Show today" onPress={() => { const now = new Date(); setMonth(startOfMonth(now)); setSelected(dayKey(now)); }} />
    </>
   )}
  </>
 );

 const grid = (
  <View style={embedded ? homeStyles.embeddedHero : homeStyles.hero}>
   {embedded ? (
    <Text style={styles.heading}>Plans and other sources</Text>
   ) : (
    <View style={homeStyles.greeting}>
     <Text style={styles.eyebrow}>MY VIBE</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Create a plan" onPress={() => router.push('/plan')} style={homeStyles.addBtn}>
      <Text style={homeStyles.addBtnText}>+ Plan</Text>
     </Pressable>
    </View>
   )}
   <MonthCalendar
    month={month}
    selectedKey={selected}
    events={events}
    onMonthChange={next => { setMonth(startOfMonth(next)); setSelected(null); }}
    onToday={() => { const now = new Date(); setMonth(startOfMonth(now)); setSelected(dayKey(now)); }}
    onSelectDay={cell => setSelected(cell.key)}
    onCreateDay={cell => createFor(cell.date)}
    onPressEvent={event => void openEvent(event)}
   />
  </View>
 );

 if (embedded) {
  return (
   <View style={homeStyles.embedded}>
    {grid}
    <View style={homeStyles.embeddedDay}>{dayDetails}</View>
   </View>
  );
 }

 return (
  <View style={styles.page}>
   {grid}
   <ScrollView style={homeStyles.dayPane} contentContainerStyle={homeStyles.dayContent} keyboardShouldPersistTaps="handled">
    {dayDetails}
   </ScrollView>
  </View>
 );
}

const homeStyles = StyleSheet.create({
 hero: { paddingHorizontal: 12, paddingTop: 10, gap: 8, flexShrink: 0 },
 embeddedHero: { gap: 8, flexShrink: 0 },
 greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
 addBtn: { backgroundColor: colors.harbor, borderRadius: 12, paddingHorizontal: 14, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
 addBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
 dayPane: { flex: 1, minHeight: 140 },
 dayContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 24, gap: 12 },
 embedded: { gap: 12 },
 embeddedDay: { gap: 12 },
 sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
 sourceChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
 sourceOn: { backgroundColor: 'white', borderColor: colors.harbor },
 sourceOff: { backgroundColor: colors.fog, borderColor: colors.fog },
 sourceText: { fontSize: 12, fontWeight: '700', color: colors.harbor },
 sourceTextOff: { color: colors.muted },
});
