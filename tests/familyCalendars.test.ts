import test from 'node:test';
import assert from 'node:assert/strict';
import { familyCalendarLinks, parseFamilyCalendarLinks } from '../src/familyCalendars.ts';

test('calendar links name the current school year and official holiday lists', () => {
  const links = familyCalendarLinks();
  assert.deepEqual(links.map(link => link.id), ['nps', 'rps', 'orchard-house', 'federal', 'virginia']);
  assert.equal(links.every(link => link.href.startsWith('https://')), true);
  assert.match(links[0].label, /Norfolk Public Schools 2026–2027/);
  assert.match(links[1].label, /Richmond Public Schools 2026–2027/);
  assert.match(links[2].label, /Orchard House 2026–2027/);
  assert.match(links[3].href, /opm\.gov/);
  assert.match(links[4].href, /dhrm\.virginia\.gov\/docs\/default-source\/default-document-library\/2026-pay-and-holiday-calendar\.pdf/);
  assert.equal(links.some(link => /2025-26|Katie|Bea|Mary/.test(`${link.label} ${link.href}`)), false);
});

test('a remote calendar list replaces the fallback only when every official link is present', () => {
  const remote = familyCalendarLinks().map(link => link.id === 'nps' ? { ...link, href: 'https://www.npsk12.com/our-division/academic-calendar/2027-2028-academic-calendar' } : link);
  assert.equal(parseFamilyCalendarLinks({ links: remote })?.[0].href, remote[0].href);
  assert.equal(parseFamilyCalendarLinks({ links: remote.slice(0, 4) }), null);
  assert.equal(parseFamilyCalendarLinks({ links: [{ id: 'nps', label: 'NPS', href: 'http://example.com' }] }), null);
});
