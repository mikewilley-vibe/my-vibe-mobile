import test from 'node:test';
import assert from 'node:assert/strict';
import {
 isGoogleCalendar,
 preferGoogleCalendars,
 preferFamilyThenGoogleCalendars,
 calendarChoiceLabel,
 parseGoogleCalendarEmbedUrl,
 resolveGoogleCalendarEmbedUrl,
 agendaEmbedUrl,
 monthEmbedUrl,
 isMyVibeDeviceEvent,
 monthRange,
 DEFAULT_GOOGLE_CALENDAR_EMBED_URL,
 familyCalendarSrc,
 matchesFamilyGoogleCalendar,
 familyCalendarTarget,
 defaultCalendarView,
} from '../src/calendarDetect.ts';

test('detects Google from source name, type, and common patterns', () => {
 assert.equal(isGoogleCalendar({source:{name:'Google',type:'caldav'}}), true);
 assert.equal(isGoogleCalendar({source:{name:'user@gmail.com',type:'caldav'}}), true);
 assert.equal(isGoogleCalendar({source:{name:'Work',type:'com.google'}}), true);
 assert.equal(isGoogleCalendar({ownerAccount:'me@googlemail.com'}), true);
 assert.equal(isGoogleCalendar({name:'com.google',type:'com.google'}), true);
 assert.equal(isGoogleCalendar({source:{name:'iCloud',type:'caldav'}}), false);
 assert.equal(isGoogleCalendar({source:{name:'On My iPhone',type:'local'}}), false);
 assert.equal(isGoogleCalendar({source:{name:'Exchange',type:'exchange'}}), false);
 assert.equal(isGoogleCalendar(undefined), false);
});

test('writable calendars list Google first and keep others', () => {
 const listed=preferGoogleCalendars([
  {id:'1',title:'Home',source:{name:'iCloud',type:'caldav'}},
  {id:'2',title:'Family',source:{name:'Google',type:'caldav'}},
  {id:'3',title:'Work',source:{name:'Exchange',type:'exchange'}},
  {id:'4',title:'Personal',source:{name:'me@gmail.com',type:'caldav'}},
 ]);
 assert.deepEqual(listed.map(c=>c.id),['2','4','1','3']);
});

test('choice labels mark Google calendars clearly', () => {
 assert.equal(calendarChoiceLabel({title:'Family',source:{name:'Google'}}),'Google · Family');
 assert.equal(calendarChoiceLabel({title:'Home',source:{name:'iCloud'}}),'Home · iCloud');
 assert.equal(calendarChoiceLabel({title:'Family',source:{name:'Google'}},{recommended:true}),'Google · Family · recommended');
 assert.equal(calendarChoiceLabel({title:'Mike',source:{name:'Google'}},{family:true}),'Family · Google · Mike');
 assert.equal(calendarChoiceLabel({title:'Mike',source:{name:'Google'}},{family:true,recommended:true}),'Family · Google · Mike · recommended');
});

test('exported My Vibe events are recognized from the notes marker', () => {
 assert.equal(isMyVibeDeviceEvent('[My Vibe:concert%3A123]\nMeet friends'), true);
 assert.equal(isMyVibeDeviceEvent('Dentist'), false);
});

test('only https calendar.google.com embed URLs are accepted', () => {
 assert.ok(parseGoogleCalendarEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL));
 assert.equal(parseGoogleCalendarEmbedUrl('http://calendar.google.com/calendar/embed?src=x'), null);
 assert.equal(parseGoogleCalendarEmbedUrl('https://evil.example/calendar/embed'), null);
 assert.equal(parseGoogleCalendarEmbedUrl('https://calendar.google.com/calendar/render?src=x'), null);
 assert.equal(parseGoogleCalendarEmbedUrl('https://www.google.com/calendar/embed?src=x'), null);
 assert.equal(parseGoogleCalendarEmbedUrl(''), null);
});

test('env embed URL wins over the shipped default when valid', () => {
 const override='https://calendar.google.com/calendar/embed?src=other%40gmail.com&ctz=UTC';
 assert.equal(resolveGoogleCalendarEmbedUrl(override), override);
 assert.equal(resolveGoogleCalendarEmbedUrl('https://example.com/not-google'), DEFAULT_GOOGLE_CALENDAR_EMBED_URL);
 assert.equal(resolveGoogleCalendarEmbedUrl(undefined), DEFAULT_GOOGLE_CALENDAR_EMBED_URL);
});

test('agenda embed hides Google chrome and uses AGENDA mode', () => {
 const url=new URL(agendaEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL));
 assert.equal(url.hostname,'calendar.google.com');
 assert.ok(url.pathname.includes('/calendar/embed'));
 assert.equal(url.searchParams.get('mode'),'AGENDA');
 assert.equal(url.searchParams.get('showTitle'),'0');
 assert.equal(url.searchParams.get('showTabs'),'0');
 assert.equal(url.searchParams.get('showCalendars'),'0');
 assert.equal(url.searchParams.get('showPrint'),'0');
 assert.equal(url.searchParams.get('showTz'),'0');
 assert.equal(url.searchParams.get('src'),'mikewilley@gmail.com');
 assert.equal(url.searchParams.get('ctz'),'America/New_York');
});

test('month embed matches the website MONTH mode and hides Google chrome', () => {
 const url=new URL(monthEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL));
 assert.equal(url.hostname,'calendar.google.com');
 assert.ok(url.pathname.includes('/calendar/embed'));
 assert.equal(url.searchParams.get('mode'),'MONTH');
 assert.equal(url.searchParams.get('showTitle'),'0');
 assert.equal(url.searchParams.get('showTabs'),'0');
 assert.equal(url.searchParams.get('showCalendars'),'0');
 assert.equal(url.searchParams.get('showPrint'),'0');
 assert.equal(url.searchParams.get('showTz'),'0');
 assert.equal(url.searchParams.get('src'),'mikewilley@gmail.com');
 assert.equal(url.searchParams.get('ctz'),'America/New_York');
});

test('monthRange covers the visible local month', () => {
 const {start,end}=monthRange(new Date(2026,8,1));
 assert.equal(start.getFullYear(),2026);
 assert.equal(start.getMonth(),8);
 assert.equal(start.getDate(),1);
 assert.equal(end.getMonth(),9);
 assert.equal(end.getDate(),1);
});

test('familyCalendarSrc reads embed src or a bare email', () => {
 assert.equal(familyCalendarSrc(DEFAULT_GOOGLE_CALENDAR_EMBED_URL),'mikewilley@gmail.com');
 assert.equal(familyCalendarSrc('https://calendar.google.com/calendar/embed?src=Family%40group.calendar.google.com'),'family@group.calendar.google.com');
 assert.equal(familyCalendarSrc('MikeWilley@gmail.com'),'mikewilley@gmail.com');
 assert.equal(familyCalendarSrc('https://example.com/calendar/embed?src=x'), null);
 assert.equal(familyCalendarSrc(''), null);
});

test('matchesFamilyGoogleCalendar matches Google title, source, or email against embed src', () => {
 const embed=DEFAULT_GOOGLE_CALENDAR_EMBED_URL;
 assert.equal(matchesFamilyGoogleCalendar({title:'mikewilley@gmail.com',source:{name:'Google'}},embed), true);
 assert.equal(matchesFamilyGoogleCalendar({title:'Family',ownerAccount:'mikewilley@gmail.com',source:{name:'Google'}},embed), true);
 assert.equal(matchesFamilyGoogleCalendar({title:'Family',source:{name:'mikewilley@gmail.com',type:'caldav'}},embed), true);
 assert.equal(matchesFamilyGoogleCalendar({title:'Holidays',source:{name:'Google'}},embed), false);
 assert.equal(matchesFamilyGoogleCalendar({title:'mikewilley@gmail.com',source:{name:'iCloud'}},embed), false);
 assert.equal(matchesFamilyGoogleCalendar({title:'Work',ownerAccount:'other@gmail.com',source:{name:'Google'}},embed), false);
 assert.equal(matchesFamilyGoogleCalendar({title:'Family',source:{name:'Google'}},null), false);
});

test('family target is set only when exactly one writable Google calendar matches', () => {
 const family={id:'fam',title:'Family',ownerAccount:'mikewilley@gmail.com',source:{name:'Google'}};
 const otherGoogle={id:'work',title:'Work',ownerAccount:'other@gmail.com',source:{name:'Google'}};
 const icloud={id:'home',title:'Home',source:{name:'iCloud'}};
 const embed=DEFAULT_GOOGLE_CALENDAR_EMBED_URL;
 assert.equal(familyCalendarTarget([icloud,otherGoogle,family],embed)?.id,'fam');
 assert.equal(familyCalendarTarget([icloud,otherGoogle],embed), null);
 assert.equal(familyCalendarTarget([
  family,
  {id:'also',title:'Mike',ownerAccount:'mikewilley@gmail.com',source:{name:'Google'}},
 ],embed), null);
});

test('family Google calendars are listed before other Google calendars', () => {
 const listed=preferFamilyThenGoogleCalendars([
  {id:'1',title:'Home',source:{name:'iCloud'}},
  {id:'2',title:'Work',source:{name:'Google'}},
  {id:'3',title:'Family',ownerAccount:'mikewilley@gmail.com',source:{name:'Google'}},
 ], DEFAULT_GOOGLE_CALENDAR_EMBED_URL);
 assert.deepEqual(listed.map(c=>c.id),['3','2','1']);
});

test('month is the default view even when an embed is configured', () => {
 assert.equal(defaultCalendarView(monthEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL)),'month');
 assert.equal(defaultCalendarView(agendaEmbedUrl(DEFAULT_GOOGLE_CALENDAR_EMBED_URL)),'month');
 assert.equal(defaultCalendarView(resolveGoogleCalendarEmbedUrl(undefined)),'month');
 assert.equal(defaultCalendarView(null),'month');
 assert.equal(defaultCalendarView(''),'month');
});
