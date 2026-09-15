import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUvaWhen,
  locationLabel,
  nextUp,
  normalizeUvaResult,
  parseUvaGames,
  planLocation,
  recentResults,
  resultLabel,
  upcomingGames,
  type UvaGame,
} from '../src/uva.ts';

const now = Date.parse('2026-09-14T15:00:00Z');
const football: UvaGame[] = [
 {id:'past',opponent:'NC State Wolfpack',date:'2026-08-29T19:30:00.000Z',location:'home',result:'pending'},
 {id:'wvu',opponent:'West Virginia Mountaineers',date:'2026-09-19T23:30:00.000Z',location:'home',note:'Location: Scott Stadium'},
 {id:'udel',opponent:'Delaware Blue Hens',date:'2026-09-26T16:00:00.000Z',location:'away'},
 {id:'fsu',opponent:'Florida State Seminoles',date:'2026-10-03T16:00:00.000Z',location:'away'},
];
const basketball: UvaGame[] = [
 {id:'vand',opponent:'Vanderbilt',date:'2026-09-27T16:00:00.000Z',location:'away',note:'Location: Charleston, S.C.'},
 {id:'rich',opponent:'Richmond',date:'2026-10-09T23:00:00.000Z',location:'home'},
];

test('parseUvaGames keeps valid games and drops junk',()=>{
 const games=parseUvaGames({ok:true,games:[
  {id:'wvu',opponent:'vs West Virginia Mountaineers',date:'2026-09-19T23:30:00.000Z',location:'HOME',note:'Location: Scott Stadium'},
  {id:'bad',opponent:'Nope',date:'not-a-date',location:'home'},
  {opponent:'Missing id',date:'2026-09-19T23:30:00.000Z',location:'home'},
  null,
 ]});
 assert.equal(games.length,1);
 assert.equal(games[0].opponent,'West Virginia Mountaineers');
 assert.equal(games[0].location,'home');
 assert.equal(games[0].result,undefined);
});

test('parseUvaGames keeps and normalizes result',()=>{
 const games=parseUvaGames({ok:true,games:[
  {id:'unc',opponent:'UNC',date:'2024-10-19T21:00:00.000Z',location:'away',result:'LOSS',note:'Defense kept it close.'},
  {id:'win',opponent:'Duke',date:'2024-11-01T21:00:00.000Z',location:'home',result:'W'},
  {id:'pend',opponent:'VT',date:'2025-11-29T21:00:00.000Z',location:'home',result:'Pending'},
  {id:'tie',opponent:'Wake',date:'2024-12-01T21:00:00.000Z',location:'home',result:'tie'},
  {id:'blank',opponent:'Blank',date:'2024-12-02T21:00:00.000Z',location:'home',result:'  '},
 ]});
 assert.deepEqual(games.map(g=>({id:g.id,result:g.result})),[
  {id:'unc',result:'loss'},
  {id:'win',result:'win'},
  {id:'pend',result:'pending'},
  {id:'tie',result:'tie'},
  {id:'blank',result:undefined},
 ]);
 assert.equal(games[0].note,'Defense kept it close.');
});

test('normalizeUvaResult maps known values and keeps unknown strings',()=>{
 assert.equal(normalizeUvaResult('WIN'),'win');
 assert.equal(normalizeUvaResult('won'),'win');
 assert.equal(normalizeUvaResult('Defeat'),'loss');
 assert.equal(normalizeUvaResult('TBD'),'pending');
 assert.equal(normalizeUvaResult('forfeit'),'forfeit');
 assert.equal(normalizeUvaResult(''),undefined);
 assert.equal(normalizeUvaResult(null),undefined);
});

test('upcoming games skip the past and cap at five',()=>{
 const extra: UvaGame[] = Array.from({length:6},(_,i)=>({id:'x'+i,opponent:'Team '+i,date:`2026-11-0${i+1}T16:00:00.000Z`,location:'home' as const}));
 assert.deepEqual(upcomingGames([...football,...extra],now).map(g=>g.id),['wvu','udel','fsu','x0','x1']);
});

test('recent results are past games, newest first, capped at five',()=>{
 const extra: UvaGame[] = Array.from({length:6},(_,i)=>({
  id:'p'+i,
  opponent:'Past '+i,
  date:`2026-08-0${i+1}T16:00:00.000Z`,
  location:'home' as const,
  result:'pending' as const,
 }));
 assert.deepEqual(recentResults([...football,...extra],now).map(g=>g.id),['past','p5','p4','p3','p2']);
});

test('recent results include a game happening now and skip the future',()=>{
 const kickoff: UvaGame={id:'now',opponent:'Now',date:'2026-09-14T15:00:00.000Z',location:'home',result:'pending'};
 assert.deepEqual(recentResults([kickoff,...football],now).map(g=>g.id),['now','past']);
 assert.deepEqual(upcomingGames([kickoff,...football],now).map(g=>g.id),['wvu','udel','fsu']);
});

test('recent results prefer decisive W/L when any exist',()=>{
 const games: UvaGame[] = [
  {id:'pending-recent',opponent:'Norfolk State',date:'2026-09-11T23:00:00.000Z',location:'home',result:'pending'},
  {id:'loss-old',opponent:'UNC',date:'2024-10-19T21:00:00.000Z',location:'away',result:'loss'},
  {id:'win-mid',opponent:'Duke',date:'2025-11-01T18:00:00.000Z',location:'home',result:'win'},
  {id:'future',opponent:'WVU',date:'2026-09-19T23:30:00.000Z',location:'home',result:'pending'},
 ];
 assert.deepEqual(recentResults(games,now).map(g=>g.id),['win-mid','loss-old']);
});

test('recent results fall back to pending past games when nothing is final',()=>{
 const games: UvaGame[] = [
  {id:'a',opponent:'A',date:'2026-09-11T00:00:00.000Z',location:'home',result:'pending'},
  {id:'b',opponent:'B',date:'2026-08-29T00:00:00.000Z',location:'home'},
 ];
 assert.deepEqual(recentResults(games,now).map(g=>g.id),['a','b']);
});

test('next up is the soonest game across football and basketball',()=>{
 const next=nextUp(football,basketball,now);
 assert.equal(next?.sport,'Football');
 assert.equal(next?.game.opponent,'West Virginia Mountaineers');
});

test('next up falls through to basketball when football is idle',()=>{
 const next=nextUp(football.slice(0,1),basketball,now);
 assert.equal(next?.sport,'Basketball');
 assert.equal(next?.game.opponent,'Vanderbilt');
});

test('empty or all-past schedules have no next up',()=>{
 assert.equal(nextUp([],[],now),null);
 assert.equal(nextUp(football.slice(0,1),[],now),null);
});

test('UVA game times render in Eastern time like the web page',()=>{
 assert.match(formatUvaWhen('2026-09-19T23:30:00.000Z'),/Sep 19/);
 assert.match(formatUvaWhen('2026-09-19T23:30:00.000Z'),/7:30/);
});

test('unknown kickoffs omit a clock time',()=>{
 const label=formatUvaWhen('2026-12-29T05:00:00.000Z');
 assert.match(label,/Dec 29/);
 assert.doesNotMatch(label,/\d:\d{2}/);
});

test('location chips match the web HOME/AWAY labels',()=>{
 assert.equal(locationLabel('home'),'HOME');
 assert.equal(locationLabel('away'),'AWAY');
 assert.equal(locationLabel('neutral'),'');
});

test('result chips are short beginner-friendly labels',()=>{
 assert.equal(resultLabel('win'),'W');
 assert.equal(resultLabel('loss'),'L');
 assert.equal(resultLabel('pending'),'TBD');
 assert.equal(resultLabel('tie'),'TIE');
 assert.equal(resultLabel(undefined),'');
});

test('plan location prefers the note venue',()=>{
 assert.equal(planLocation(football[1]),'Scott Stadium');
 assert.equal(planLocation(football[2]),'AWAY');
});
