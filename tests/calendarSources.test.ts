import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCalendarEvents, sourceFromPlan, eventDetailLines } from '../src/calendarMerge.ts';
import type { Plan } from '../src/model.ts';

const dinner: Plan = {
  id: 'custom:1',
  title: 'Dinner',
  start: '2026-09-19T23:00:00.000Z',
  end: '2026-09-20T01:00:00.000Z',
  location: 'Home',
  notes: '',
};
const show: Plan = {
  id: 'concert:abc',
  title: 'Phish',
  start: '2026-09-20T23:00:00.000Z',
  end: '2026-09-21T01:00:00.000Z',
  location: 'The National',
  notes: '',
};
const savedGame: Plan = {
  id: 'uva:wvu',
  title: 'UVA vs West Virginia',
  start: '2026-09-19T23:30:00.000Z',
  end: '2026-09-20T03:00:00.000Z',
  location: 'Scott Stadium',
  notes: '',
};

test('plan ids map to calendar sources', () => {
  assert.equal(sourceFromPlan(dinner), 'personal');
  assert.equal(sourceFromPlan(show), 'showsignal');
  assert.equal(sourceFromPlan(savedGame), 'uva-sports');
  assert.equal(sourceFromPlan({ ...dinner, id: 'sweatshift:hiit-1' }), 'sweatshift');
});

test('merge keeps personal, google, and UVA events and tags each source', () => {
  const events = mergeCalendarEvents({
    plans: [dinner, show],
    googleEvents: [{
      id: 'g1',
      title: 'School',
      start: '2026-09-19T12:00:00.000Z',
      end: '2026-09-19T13:00:00.000Z',
      allDay: false,
      location: '',
      notes: '',
      calendarTitle: 'Family',
    }],
    linkedEventIds: new Set(),
    uvaBySport: {
      football: [{
        id: 'wvu',
        opponent: 'West Virginia Mountaineers',
        date: '2026-09-19T23:30:00.000Z',
        location: 'home',
        venue: 'Scott Stadium',
        network: 'ACCN',
      }],
    },
  });
  assert.deepEqual(events.map(event => event.source).sort(), ['google', 'personal', 'showsignal', 'uva-sports']);
  const uva = events.find(event => event.source === 'uva-sports');
  assert.equal(uva?.title, 'UVA vs West Virginia Mountaineers');
  assert.equal(uva?.network, 'ACCN');
  assert.equal(uva?.timeUnknown, false);
});

test('saved UVA plans do not duplicate a live sports-feed event', () => {
  const events = mergeCalendarEvents({
    plans: [savedGame],
    googleEvents: [],
    linkedEventIds: new Set(),
    uvaBySport: {
      football: [{
        id: 'wvu',
        opponent: 'West Virginia Mountaineers',
        date: '2026-09-19T23:30:00.000Z',
        location: 'home',
        network: 'ACCN',
      }],
    },
  });
  const uva = events.filter(event => event.source === 'uva-sports');
  assert.equal(uva.length, 1);
  assert.equal(uva[0].network, 'ACCN');
});

test('disabled sources are omitted', () => {
  const events = mergeCalendarEvents({
    plans: [dinner, show],
    googleEvents: [],
    linkedEventIds: new Set(),
    enabledSources: {
      personal: true,
      google: true,
      showsignal: false,
      'uva-sports': false,
      sweatshift: false,
    },
  });
  assert.deepEqual(events.map(event => event.source), ['personal']);
});

test('SweatShift workouts only appear when the source is on and data exists', () => {
  const empty = mergeCalendarEvents({
    plans: [],
    googleEvents: [],
    linkedEventIds: new Set(),
    sweatshiftWorkouts: [],
  });
  assert.equal(empty.length, 0);
  const events = mergeCalendarEvents({
    plans: [],
    googleEvents: [],
    linkedEventIds: new Set(),
    sweatshiftWorkouts: [{ id: 'w1', title: 'HIIT', startsAt: '2026-09-19T12:00:00.000Z' }],
  });
  assert.equal(events[0].source, 'sweatshift');
  assert.equal(events[0].title, 'HIIT');
});

test('detail lines skip missing TV and start times', () => {
  assert.deepEqual(eventDetailLines({
    key: 'uva',
    title: 'UVA vs Duke',
    start: '2026-09-19T00:00:00.000Z',
    end: '2026-09-20T00:00:00.000Z',
    allDay: true,
    source: 'uva-sports',
    sportLabel: "Men's Basketball",
    homeAway: 'home',
    venue: 'JPJ',
    timeUnknown: true,
  }), ["Men's Basketball", 'Home', 'JPJ']);
});
