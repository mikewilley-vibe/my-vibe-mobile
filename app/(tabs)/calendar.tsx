import { createElement, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { agendaEmbedUrl, GOOGLE_CALENDAR_SETUP_HINT, monthEmbedUrl, resolveGoogleCalendarEmbedUrl } from '../../src/calendarDetect';
import { HomeMonthCalendar } from '../../src/HomeMonthCalendar';
import { Page, Card, Button, styles, colors } from '../../src/ui';

const resolvedEmbed = resolveGoogleCalendarEmbedUrl(process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_EMBED_URL);
const monthSrc = resolvedEmbed ? monthEmbedUrl(resolvedEmbed) : null;
const agendaSrc = resolvedEmbed ? agendaEmbedUrl(resolvedEmbed) : null;

function FamilyEmbed({ src, reloadKey, label }: { src: string; reloadKey: number; label: string }) {
 if (Platform.OS === 'web') {
  return createElement('iframe', { key: reloadKey, title: label, src, style: { border: 0, width: '100%', height: 720 }, referrerPolicy: 'no-referrer-when-downgrade' });
 }
 return <WebView key={reloadKey} accessibilityLabel={label} source={{ uri: src }} style={{ flex: 1, backgroundColor: colors.surface }} startInLoadingState nestedScrollEnabled javaScriptEnabled renderLoading={() => <ActivityIndicator accessibilityLabel="Loading Google Calendar" color={colors.harbor} style={{ marginTop: 40 }} />} />;
}

export default function MyCalendar() {
 const [view, setView] = useState<'month' | 'agenda'>('month');
 const [refreshing, setRefreshing] = useState(false);
 const [embedNonce, setEmbedNonce] = useState(0);
 const src = view === 'month' ? monthSrc : agendaSrc;

 function refresh() {
  setRefreshing(true);
  setEmbedNonce(n => n + 1);
  setRefreshing(false);
 }

 return (
  <Page refreshing={refreshing} onRefresh={refresh}>
   <View style={styles.chrome}>
    <View style={styles.intro}>
     <Text style={styles.eyebrow}>FAMILY CALENDAR</Text>
     <Text style={styles.title}>What's going on with the family?</Text>
     <Text style={styles.lede}>Family Google calendar first. My Vibe plans, UVA, shows, and other sources sit on the same screen — add, edit, and manage from the grid below.</Text>
    </View>
    <Button title="+ Create a plan" onPress={() => router.push('/plan')} />
    {!!resolvedEmbed && (
     <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: view === 'month' }} onPress={() => setView('month')} style={[styles.segment, view === 'month' && styles.segmentSelected]}>
       <Text style={[styles.segmentText, view === 'month' && styles.segmentTextSelected]}>Month</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: view === 'agenda' }} onPress={() => setView('agenda')} style={[styles.segment, view === 'agenda' && styles.segmentSelected]}>
       <Text style={[styles.segmentText, view === 'agenda' && styles.segmentTextSelected]}>Agenda</Text>
      </Pressable>
     </View>
    )}
   </View>
   {src ? (
    <Card>
     <Text style={styles.heading}>{view === 'month' ? 'Family month' : 'Family agenda'}</Text>
     <Text style={styles.lede}>{view === 'month' ? 'Same month look as mikewilley.app — the public family calendar.' : 'Quick list of upcoming family Google calendar events.'}</Text>
     <View style={{ height: 720, marginHorizontal: -20, marginBottom: -20, overflow: 'hidden', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopWidth: 1, borderColor: colors.fog, backgroundColor: colors.surface }}>
      <FamilyEmbed src={src} reloadKey={embedNonce} label={view === 'month' ? 'Google Calendar month' : 'Google Calendar agenda'} />
     </View>
    </Card>
   ) : (
    <Card>
     <Text style={styles.body}>{GOOGLE_CALENDAR_SETUP_HINT}</Text>
    </Card>
   )}
   <HomeMonthCalendar embedded refreshKey={embedNonce} />
  </Page>
 );
}
