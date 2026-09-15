import test from 'node:test';
import assert from 'node:assert/strict';
import {
  concertIdFromPlanId,
  concertsFromShowSignalEvents,
  eventsFromShowSignalBody,
  mapShowSignalEvent,
  showSignalConcertUrls,
  showSignalErrorMessage,
} from '../src/showsignal.ts';

test('builds the ShowSignal app scheme and production web fallback', () => {
  assert.deepEqual(showSignalConcertUrls('vvG17ZbReIU4J0'), {
    app: 'showsignal://concert/vvG17ZbReIU4J0',
    web: 'https://concert-finder-eta.vercel.app/concert/vvG17ZbReIU4J0',
  });
  assert.equal(showSignalConcertUrls('id/with space').app, 'showsignal://concert/id%2Fwith%20space');
  assert.equal(showSignalConcertUrls('id/with space').web, 'https://concert-finder-eta.vercel.app/concert/id%2Fwith%20space');
});

test('reads a Ticketmaster id from a saved concert plan', () => {
  assert.equal(concertIdFromPlanId('concert:vvG17ZbReIU4J0'), 'vvG17ZbReIU4J0');
  assert.equal(concertIdFromPlanId('custom:abc'), null);
  assert.equal(concertIdFromPlanId('concert:'), null);
});

test('maps a ShowSignal api-v1 event onto Concert', () => {
  const concert = mapShowSignalEvent({
    id: 'evt-1',
    name: 'Phish',
    startsAt: '2026-10-03T23:30:00Z',
    ticketUrl: 'https://tickets.example/phish',
    imageUrl: 'https://img.example/phish.jpg',
    venue: { name: 'The National', city: 'Richmond', stateCode: 'VA' },
  });
  assert.deepEqual(concert, {
    id: 'evt-1',
    name: 'Phish',
    dateTime: '2026-10-03T23:30:00.000Z',
    venue: 'The National',
    city: 'Richmond',
    state: 'VA',
    url: 'https://tickets.example/phish',
    image: 'https://img.example/phish.jpg',
  });
});

test('synthesizes dateTime from localDate and localTime when startsAt is missing', () => {
  const concert = mapShowSignalEvent({
    id: 'evt-2',
    name: 'Local opener',
    localDate: '2026-11-01',
    localTime: '19:30',
    venue: { name: 'The NorVa', city: 'Norfolk', state: 'Virginia' },
    images: [
      { url: 'https://img.example/small.jpg', width: 200 },
      { url: 'https://img.example/wide.jpg', width: 2048 },
    ],
  });
  assert.equal(concert?.dateTime, new Date('2026-11-01T19:30:00').toISOString());
  assert.equal(concert?.state, 'Virginia');
  assert.equal(concert?.image, 'https://img.example/wide.jpg');
  assert.equal(concert?.url, '');
});

test('drops events that are missing an id, name, or usable date', () => {
  assert.equal(mapShowSignalEvent({ name: 'Nope', startsAt: '2026-10-01T00:00:00Z' }), null);
  assert.equal(mapShowSignalEvent({ id: 'x', startsAt: '2026-10-01T00:00:00Z' }), null);
  assert.equal(mapShowSignalEvent({ id: 'x', name: 'Nope', startsAt: 'not-a-date' }), null);
});

test('dedupes, skips the past, and sorts remaining shows', () => {
  const now = Date.parse('2026-09-15T12:00:00Z');
  const concerts = concertsFromShowSignalEvents([
    { id: 'later', name: 'Later', startsAt: '2026-09-20T00:00:00Z', venue: { name: 'A', city: 'RVA' } },
    { id: 'soon', name: 'Soon', startsAt: '2026-09-16T00:00:00Z', venue: { name: 'B', city: 'RVA' } },
    { id: 'soon', name: 'Soon duplicate', startsAt: '2026-09-17T00:00:00Z', venue: { name: 'B', city: 'RVA' } },
    { id: 'past', name: 'Past', startsAt: '2026-09-14T00:00:00Z', venue: { name: 'C', city: 'RVA' } },
    { id: 'bad', name: 'Bad' },
  ], now);
  assert.deepEqual(concerts.map(c => c.id), ['soon', 'later']);
  assert.equal(concerts[0].name, 'Soon duplicate');
});

test('reads events from the api-v1 success envelope', () => {
  assert.deepEqual(eventsFromShowSignalBody({
    apiVersion: 'v1',
    data: { events: [{ id: '1' }] },
    meta: { requestId: 'r' },
  }), [{ id: '1' }]);
  assert.deepEqual(eventsFromShowSignalBody({ events: [{ id: '2' }] }), [{ id: '2' }]);
  assert.equal(eventsFromShowSignalBody({ apiVersion: 'v1', data: {} }), null);
});

test('reads a beginner-friendly error from the api-v1 failure envelope', () => {
  assert.equal(showSignalErrorMessage({
    error: { code: 'rate_limited', message: 'Too many Ticketmaster searches. Wait a moment and try again.' },
  }, 'fallback'), 'Too many Ticketmaster searches. Wait a moment and try again.');
  assert.equal(showSignalErrorMessage({}, 'Shows could not load. Try again in a moment.'), 'Shows could not load. Try again in a moment.');
});
