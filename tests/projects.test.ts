import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PROJECTS,
 PROJECT_TYPES,
 projectAppStoreUrl,
 projectDescription,
 projectGithubUrl,
 projectType,
 projectUrl,
 statusLabel,
 typeLabel,
} from '../src/projects.ts';

const KNOWN_GITHUB = /^https:\/\/github.com\/mikewilley-vibe\/(workout-timer-mobile|concert-finder|my-vibe-mobile)$/;
const KNOWN_WEB = /^https:\/\/concert-finder-eta\.vercel\.app$/;

test('catalog includes the starter projects without inventing a Concert Finder product', () => {
 const ids = PROJECTS.map(project => project.id);
 for (const id of ['sweatshift', 'showsignal', 'hapshere', 'my-vibe', 'vibe-school', 'vandy-accounting', 'skoshie-shelties', 'adale-martin', 'orf-rock']) {
  assert.ok(ids.includes(id), `missing ${id}`);
 }
 assert.equal(ids.includes('concert-finder'), false);
 const show = PROJECTS.find(project => project.id === 'showsignal');
 assert.match(show?.description || '', /formerly concert finder/i);
});

test('type and status labels match the preferred catalog language', () => {
 assert.deepEqual(PROJECT_TYPES.map(item => item.id), ['ios-app', 'web-app', 'website', 'ai', 'business', 'experiment']);
 assert.equal(typeLabel('ios-app'), 'iOS Apps');
 assert.equal(typeLabel('website'), 'Websites');
 assert.equal(statusLabel('live'), 'Live');
 assert.equal(statusLabel('in-development'), 'In Development');
 assert.equal(statusLabel('in-progress'), 'In Development');
 assert.equal(statusLabel('archived'), 'Archived');
});

test('field helpers read preferred names and aliases', () => {
 const viaPreferred = {
  id: 'sample',
  name: 'Sample',
  description: 'Preferred blurb',
  type: 'website' as const,
  status: 'live' as const,
  url: 'https://concert-finder-eta.vercel.app',
  githubUrl: 'https://github.com/mikewilley-vibe/concert-finder',
  appStoreUrl: undefined,
 };
 assert.equal(projectDescription(viaPreferred), 'Preferred blurb');
 assert.equal(projectType(viaPreferred), 'website');
 assert.equal(projectUrl(viaPreferred), 'https://concert-finder-eta.vercel.app');
 assert.equal(projectGithubUrl(viaPreferred), 'https://github.com/mikewilley-vibe/concert-finder');
 assert.equal(projectAppStoreUrl(viaPreferred), undefined);

 const viaAlias = {
  id: 'alias',
  name: 'Alias',
  shortDescription: 'Legacy blurb',
  category: 'mobile' as const,
  status: 'live' as const,
  website: 'https://concert-finder-eta.vercel.app',
  github: 'https://github.com/mikewilley-vibe/my-vibe-mobile',
 };
 assert.equal(projectDescription(viaAlias), 'Legacy blurb');
 assert.equal(projectType(viaAlias), 'ios-app');
 assert.equal(projectUrl(viaAlias), 'https://concert-finder-eta.vercel.app');
 assert.equal(projectGithubUrl(viaAlias), 'https://github.com/mikewilley-vibe/my-vibe-mobile');
});

test('only known public links appear on catalog cards', () => {
 for (const project of PROJECTS) {
  const url = projectUrl(project);
  const github = projectGithubUrl(project);
  const appStore = projectAppStoreUrl(project);
  if (url) assert.match(url, KNOWN_WEB);
  if (github) assert.match(github, KNOWN_GITHUB);
  assert.equal(appStore, undefined);
  assert.equal(project.image, undefined);
 }
 const hapshere = PROJECTS.find(project => project.id === 'hapshere');
 assert.equal(projectUrl(hapshere!), undefined);
 assert.equal(projectGithubUrl(hapshere!), undefined);
});
