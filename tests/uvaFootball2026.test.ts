import test from 'node:test';
import assert from 'node:assert/strict';
import { UVA_FOOTBALL_2026 } from '../src/uvaFootball2026.ts';
import {
  footballBroadcastLine,
  footballOpponentKey,
  mergeFootballSchedule,
  nextSeasonGameId,
  parseUvaGames,
  showsFinalScore,
  uvaPayloadIsLive,
  type UvaGame,
} from '../src/uva.ts';

const opponents = [
  'NC State',
  'Norfolk State',
  'West Virginia',
  'Delaware',
  'Florida State',
  'Syracuse',
  'SMU',
  'Duke',
  'Wake Forest',
  'Cal',
  'North Carolina',
  'Virginia Tech',
];

test('bundled 2026 football season is the full regular-season list in date order', () => {
  assert.deepEqual(UVA_FOOTBALL_2026.map(game => game.opponent), opponents);
  assert.deepEqual(
    UVA_FOOTBALL_2026.map(game => game.date),
    [...UVA_FOOTBALL_2026.map(game => game.date)].sort(),
  );
  assert.equal(UVA_FOOTBALL_2026.length, 12);
});

test('played games have a final score and unplayed games do not', () => {
  const played = UVA_FOOTBALL_2026.filter(game => game.result === 'win' || game.result === 'loss');
  assert.deepEqual(played.map(game => [game.opponent, game.result, game.score, showsFinalScore(game)]), [
    ['NC State', 'win', '34-8', true],
    ['Norfolk State', 'win', '59-3', true],
    ['West Virginia', 'loss', '27-38', true],
  ]);
  const unplayed = UVA_FOOTBALL_2026.filter(game => !game.result);
  assert.equal(unplayed.length, 9);
  assert.ok(unplayed.every(game => game.score === undefined && !showsFinalScore(game)));
});

test('announced kickoffs and TV match the official schedule, and the rest stay TBA', () => {
  const byOpponent = Object.fromEntries(UVA_FOOTBALL_2026.map(game => [game.opponent, game]));
  assert.equal(byOpponent['NC State'].date, '2026-08-29T19:30:00.000Z');
  assert.equal(byOpponent['NC State'].network, 'ESPN');
  assert.equal(byOpponent['NC State'].location, 'home');
  assert.equal(byOpponent['Norfolk State'].network, 'ACCNX');
  assert.equal(byOpponent['West Virginia'].location, 'neutral');
  assert.equal(byOpponent['West Virginia'].venue, 'Bank of America Stadium');
  assert.equal(byOpponent['West Virginia'].network, 'ACCN');
  assert.equal(byOpponent.Delaware.date, '2026-09-26T22:00:00.000Z');
  assert.equal(byOpponent.Delaware.network, 'ACCN');
  assert.equal(byOpponent.Delaware.location, 'home');
  assert.equal(byOpponent['Florida State'].date, '2026-10-03T19:30:00.000Z');
  assert.equal(byOpponent['Florida State'].location, 'away');
  assert.equal(byOpponent['Florida State'].network, 'ESPN2 or ACCN');
  assert.equal(byOpponent.Duke.date, '2026-10-23T23:00:00.000Z');
  assert.equal(byOpponent.Duke.network, 'ESPN');
  for (const name of ['Syracuse', 'SMU', 'Wake Forest', 'Cal', 'North Carolina', 'Virginia Tech']) {
    assert.equal(byOpponent[name].timeUnknown, true, name);
    assert.equal(byOpponent[name].network, undefined, name);
    assert.match(footballBroadcastLine(byOpponent[name]), /Kickoff TBA/);
    assert.match(footballBroadcastLine(byOpponent[name]), /TV TBA/);
  }
  assert.equal(footballBroadcastLine(byOpponent.Delaware), 'TV: ACCN');
  assert.equal(nextSeasonGameId([...UVA_FOOTBALL_2026]), 'uva-fb-2026-udel');
});

test('NC State is not North Carolina, and Virginia Tech is not West Virginia', () => {
  assert.equal(footballOpponentKey('NC State Wolfpack'), 'ncstate');
  assert.equal(footballOpponentKey('North Carolina Tar Heels'), 'northcarolina');
  assert.notEqual(footballOpponentKey('NC State'), footballOpponentKey('North Carolina'));
  assert.equal(footballOpponentKey('West Virginia Mountaineers'), 'westvirginia');
  assert.equal(footballOpponentKey('Virginia Tech'), 'virginiatech');
  assert.equal(footballOpponentKey('Cal'), footballOpponentKey('California Golden Bears'));
});

const truncatedFallback: UvaGame[] = [
  { id: 'uva-static-fb-4', opponent: 'UNC', date: '2024-10-19T21:00:00.000Z', location: 'away', result: 'loss' },
  { id: 'uva-static-fb-1', opponent: 'Virginia Tech', date: '2025-11-29T21:00:00.000Z', location: 'home', result: 'pending' },
  { id: 'uva-fb-2026-ncst', opponent: 'NC State Wolfpack', date: '2026-08-29T19:30:00.000Z', location: 'home', result: 'pending', note: 'Location: Scott Stadium' },
  { id: 'uva-fb-2026-wvu', opponent: 'West Virginia Mountaineers', date: '2026-09-19T23:30:00.000Z', location: 'home', result: 'pending', venue: 'Scott Stadium' },
  { id: 'uva-fb-2026-udel', opponent: 'Delaware Blue Hens', date: '2026-09-26T16:00:00.000Z', location: 'home', result: 'pending' },
  { id: 'uva-fb-2026-fsu', opponent: 'Florida State Seminoles', date: '2026-10-03T16:00:00.000Z', location: 'away', result: 'pending' },
];

test('a failed or partial live feed cannot truncate the season or replace known kickoffs', () => {
  assert.equal(uvaPayloadIsLive({ ok: true, fallback: true, error: 'Error: ESPN HTTP 403', games: [] }), false);
  assert.equal(uvaPayloadIsLive({ ok: true, games: [] }), true);
  const games = mergeFootballSchedule(truncatedFallback, { trustLive: false });
  assert.deepEqual(games.map(game => game.opponent), opponents);
  assert.equal(games.find(game => game.opponent === 'Delaware')?.date, '2026-09-26T22:00:00.000Z');
  assert.equal(games.find(game => game.opponent === 'West Virginia')?.location, 'neutral');
  assert.equal(games.find(game => game.opponent === 'West Virginia')?.score, '27-38');
  assert.equal(games.some(game => game.date.startsWith('2024') || game.date.startsWith('2025')), false);
  assert.equal(games.filter(game => game.opponent === 'Virginia Tech').length, 1);
});

test('a real live feed updates matches and still keeps games it left out', () => {
  const live: UvaGame[] = [
    {
      id: 'espn-udel',
      opponent: 'Delaware Blue Hens',
      date: '2026-09-26T22:00:00.000Z',
      location: 'home',
      locationKnown: true,
      result: 'win',
      score: '28-17',
      network: 'ACCN',
    },
    {
      id: 'espn-syr',
      opponent: 'Syracuse',
      date: '2026-10-10T20:00:00.000Z',
      location: 'home',
      locationKnown: true,
      network: 'ESPN2',
    },
    {
      id: 'espn-unc-old',
      opponent: 'North Carolina',
      date: '2024-10-19T21:00:00.000Z',
      location: 'away',
      locationKnown: true,
      result: 'loss',
      score: '14-41',
    },
  ];
  const games = mergeFootballSchedule(live, { trustLive: true });
  assert.equal(games.length, 12);
  const delaware = games.find(game => game.opponent === 'Delaware');
  assert.equal(delaware?.id, 'uva-fb-2026-udel');
  assert.equal(delaware?.result, 'win');
  assert.equal(delaware?.score, '28-17');
  const syracuse = games.find(game => game.opponent === 'Syracuse');
  assert.equal(syracuse?.date, '2026-10-10T20:00:00.000Z');
  assert.equal(syracuse?.timeUnknown, undefined);
  assert.equal(syracuse?.network, 'ESPN2');
  assert.equal(games.find(game => game.opponent === 'NC State')?.score, '34-8');
  assert.equal(games.some(game => game.date.startsWith('2024')), false);
});

test('parseUvaGames keeps a final score and drops a pending score', () => {
  const games = parseUvaGames({
    ok: true,
    games: [
      { id: 'a', opponent: 'NC State', date: '2026-08-29T19:30:00.000Z', location: 'home', result: 'W, 34-8' },
      { id: 'b', opponent: 'Duke', date: '2026-10-23T23:00:00.000Z', location: 'home', result: 'pending', score: '0-0' },
      { id: 'c', opponent: 'Cal', date: '2026-11-14T05:00:00.000Z', location: 'home', result: 'win', uvaScore: 21, opponentScore: 14 },
    ],
  });
  assert.equal(games[0].result, 'win');
  assert.equal(games[0].score, '34-8');
  assert.equal(games[0].locationKnown, true);
  assert.equal(games[1].result, 'pending');
  assert.equal(games[1].score, undefined);
  assert.equal(games[2].score, '21-14');
});
