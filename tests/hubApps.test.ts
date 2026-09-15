import test from 'node:test';
import assert from 'node:assert/strict';
import { hubApps } from '../src/hubApps.ts';
import { PROJECTS, PROJECT_CATEGORIES } from '../src/projects.ts';

test('HapsHere is listed as an app whose URL must be supplied', () => {
  const hapshere = hubApps().find(app => app.id === 'hapshere');
  assert.ok(hapshere);
  assert.equal(hapshere?.urlNeeded, true);
  assert.equal(hapshere?.url, undefined);
  assert.equal(hapshere?.urlEnv, 'EXPO_PUBLIC_HAPSHERE_URL');
});

test('ShowSignal keeps an https origin and the app scheme', () => {
  const show = hubApps().find(app => app.id === 'showsignal');
  assert.equal(show?.urlNeeded, false);
  assert.equal(show?.scheme, 'showsignal');
  assert.match(show?.url || '', /^https:\/\//);
});

test('project catalog covers required categories and never lists a private GitHub', () => {
  assert.deepEqual(PROJECT_CATEGORIES.map(item => item.id), ['mobile', 'web-app', 'website', 'ai', 'business', 'experiment']);
  assert.ok(PROJECTS.some(project => project.id === 'sweatshift'));
  for (const project of PROJECTS) {
    if (project.github) assert.match(project.github, /^https:\/\/github.com\/mikewilley-vibe\/(workout-timer-mobile|concert-finder|my-vibe-mobile)$/);
  }
  const hapshere = PROJECTS.find(project => project.id === 'hapshere');
  assert.equal(hapshere?.github, undefined);
  assert.equal(hapshere?.website, undefined);
});
