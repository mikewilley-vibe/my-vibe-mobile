import test from 'node:test';
import assert from 'node:assert/strict';
import { enabledUvaSports, uvaGameToMonthEvent, uvaGamesToMonthEvents, UVA_SPORT_CATALOG } from '../src/uvaSports.ts';
import { hasKnownKickoff, parseUvaGames, uvaHeadline } from '../src/uva.ts';

test('enabled sports are football and men\'s basketball only', () => {
  assert.deepEqual(enabledUvaSports().map(sport => sport.id), ['football', 'mens-basketball']);
  assert.ok(UVA_SPORT_CATALOG.some(sport => sport.id === 'baseball' && sport.enabled === false));
});

test('home games are UVA vs; away games are UVA at', () => {
  assert.equal(uvaHeadline({ id: '1', opponent: 'Duke', date: '2026-09-19T23:00:00.000Z', location: 'home' }), 'UVA vs Duke');
  assert.equal(uvaHeadline({ id: '2', opponent: 'Duke', date: '2026-09-19T23:00:00.000Z', location: 'away' }), 'UVA at Duke');
});

test('midnight Eastern kickoff is unknown; afternoon ET is known', () => {
  assert.equal(hasKnownKickoff('2026-09-19'), false);
  assert.equal(hasKnownKickoff('2026-12-29T05:00:00.000Z'), false);
  assert.equal(hasKnownKickoff('2026-09-19T23:30:00.000Z'), true);
});

test('calendar mapping keeps venue and TV only when provided, and does not invent a time', () => {
  const football = UVA_SPORT_CATALOG[0];
  const known = uvaGameToMonthEvent({
    id: 'wvu',
    opponent: 'West Virginia Mountaineers',
    date: '2026-09-19T23:30:00.000Z',
    location: 'home',
    venue: 'Scott Stadium',
    network: 'ACCN',
  }, football);
  assert.equal(known.source, 'uva-sports');
  assert.equal(known.title, 'UVA vs West Virginia Mountaineers');
  assert.equal(known.chipTitle, '🏈 UVA vs West Virginia Mountaineers');
  assert.equal(known.timeUnknown, false);
  assert.equal(known.network, 'ACCN');
  assert.equal(known.venue, 'Scott Stadium');

  const tba = uvaGameToMonthEvent({
    id: 'clemson',
    opponent: 'Clemson',
    date: '2026-12-29T05:00:00.000Z',
    location: 'away',
  }, football);
  assert.equal(tba.title, 'UVA at Clemson');
  assert.equal(tba.timeUnknown, true);
  assert.equal(tba.allDay, true);
  assert.equal(tba.network, undefined);
});

test('parseUvaGames copies optional venue/network and does not invent TV', () => {
  const games = parseUvaGames({
    ok: true,
    games: [{
      id: 'duke',
      opponent: 'Duke',
      date: '2026-01-10T05:00:00.000Z',
      location: 'home',
      venue: 'JPJ',
    }],
  });
  assert.equal(games[0].venue, 'JPJ');
  assert.equal(games[0].network, undefined);
  assert.equal(games[0].timeUnknown, true);
});

test('month overlay only includes games that overlap the visible range', () => {
  const events = uvaGamesToMonthEvents({
    football: [
      { id: 'aug', opponent: 'NC State', date: '2026-08-29T19:30:00.000Z', location: 'home' },
      { id: 'sep', opponent: 'WVU', date: '2026-09-19T23:30:00.000Z', location: 'home' },
    ],
  }, { start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) });
  assert.deepEqual(events.map(event => event.planId), ['uva:sep']);
});
