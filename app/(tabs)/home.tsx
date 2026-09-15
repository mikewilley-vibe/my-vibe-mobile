import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useData } from '../../src/store';
import { googleMonthEvents, openCalendar, type DeviceEvent } from '../../src/calendar';
import { isMyVibeDeviceEvent } from '../../src/calendarDetect';
import { MonthCalendar } from '../../src/MonthCalendar';
import {
 compareMonthEvents,
 dateFromDayKey,
 dayKey,
 eventOverlapsLocalDay,
 isAllDayRange,
 planStartForDate,
 startOfMonth,
 visibleMonthRange,
 type MonthEvent,
} from '../../src/monthGrid';
import { Button, Card, colors, styles, when } from '../../src/ui';

function toPlanEvent(plan: { id: string; title: string; start: string; end: string; location: string }): MonthEvent {
 return {
  key: 'plan:' + plan.id,
  title: plan.title,
  start: plan.start,
  end: plan.end,
  allDay: isAllDayRange(plan.start, plan.end),
  kind: 'plan',
  planId: plan.id,
  location: plan.location,
 };
}

function toGoogleEvent(event: DeviceEvent): MonthEvent {
 return {
  key: 'google:' + event.id,
  title: event.title,
  start: event.start,
  end: event.end,
  allDay: event.allDay || isAllDayRange(event.start, event.end),
  kind: 'google',
  googleId: event.id,
  location: event.location || event.calendarTitle,
 };
}

export default function Home() {
 const { plans, links } = useData();
 const [month, setMonth] = useState(() => startOfMonth(new Date()));
 const [selected, setSelected] = useState<string | null>(() => dayKey(new Date()));
 const [googleEvents, setGoogleEvents] = useState<DeviceEvent[]>([]);

 useFocusEffect(useCallback(() => {
  let active = true;
  const range = visibleMonthRange(month);
  void googleMonthEvents(range.start, range.end, { request: false }).then(result => {
   if (!active) return;
   setGoogleEvents(result.access === 'granted' ? result.events : []);
  }).catch(() => { if (active) setGoogleEvents([]); });
  return () => { active = false; };
 }, [month]));

 const linkedIds = useMemo(() => new Set(Object.values(links)), [links]);
 const events = useMemo(() => {
  const plansAsEvents = plans.map(toPlanEvent);
  const googleAsEvents = googleEvents
   .filter(event => !linkedIds.has(event.id) && !isMyVibeDeviceEvent(event.notes))
   .map(toGoogleEvent);
  return [...plansAsEvents, ...googleAsEvents];
 }, [plans, googleEvents, linkedIds]);

 const selectedDate = selected ? dateFromDayKey(selected) : null;
 const selectedEvents = selectedDate
  ? events.filter(event => eventOverlapsLocalDay(event.start, event.end, selectedDate)).sort(compareMonthEvents)
  : [];

 function createFor(date: Date) {
  setSelected(dayKey(date));
  router.push({ pathname: '/plan', params: { start: planStartForDate(date) } });
 }

 async function openEvent(event: MonthEvent) {
  if (event.kind === 'plan' && event.planId) {
   router.push({ pathname: '/plan', params: { id: event.planId } });
   return;
  }
  if (event.googleId) {
   try { await openCalendar(event.googleId); }
   catch { Alert.alert(event.title, [when(event.start), event.location].filter(Boolean).join('\n') || 'Google calendar event'); }
  }
 }

 return (
  <View style={styles.page}>
   <View style={homeStyles.hero}>
    <View style={homeStyles.greeting}>
     <Text style={styles.eyebrow}>MY VIBE</Text>
     <Pressable accessibilityRole="button" accessibilityLabel="Create a plan" onPress={() => router.push('/plan')} style={homeStyles.addBtn}>
      <Text style={homeStyles.addBtnText}>+ Plan</Text>
     </Pressable>
    </View>
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
   <ScrollView style={homeStyles.dayPane} contentContainerStyle={homeStyles.dayContent} keyboardShouldPersistTaps="handled">
    {selectedDate ? (
     <>
      <Text style={styles.heading}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      {selectedEvents.length ? selectedEvents.map(item => (
       <Card key={item.key}>
        <Text style={styles.eyebrow}>{item.allDay ? 'All day' : when(item.start)} · {item.kind === 'plan' ? 'My Vibe' : 'Google'}</Text>
        <Text style={styles.heading}>{item.title}</Text>
        {!!item.location && <Text style={styles.body}>{item.location}</Text>}
        {item.kind === 'plan'
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
   </ScrollView>
  </View>
 );
}

const homeStyles = StyleSheet.create({
 hero: { paddingHorizontal: 12, paddingTop: 10, gap: 8, flexShrink: 0 },
 greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
 addBtn: { backgroundColor: colors.harbor, borderRadius: 12, paddingHorizontal: 14, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
 addBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
 dayPane: { flex: 1 },
 dayContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 32, gap: 12 },
});

