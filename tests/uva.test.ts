import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUvaWhen,locationLabel,nextUp,parseUvaGames,upcomingGames,type UvaGame } from '../src/uva.ts';

const now = Date.parse('2026-09-14T15:00:00Z');
const football: UvaGame[] = [
 {id:'past',opponent:'NC State Wolfpack',date:'2026-08-29T19:30:00.000Z',location:'home'},
 {id:'wvu',opponent:'West Virginia Mountaineers',date:'2026-09-19T23:30:00.000Z',location:'home',note:'Location: Scott Stadium'},
 {id:'udel',opponent:'Delaware Blue Hens',date:'2026-09-26T16:00:00.000Z',location:'home'},
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
});

test('upcoming games skip the past and cap at five',()=>{
 const extra: UvaGame[] = Array.from({length:6},(_,i)=>({id:'x'+i,opponent:'Team '+i,date:`2026-11-0${i+1}T16:00:00.000Z`,location:'home' as const}));
 assert.deepEqual(upcomingGames([...football,...extra],now).map(g=>g.id),['wvu','udel','fsu','x0','x1']);
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

test('location chips match the web HOME/AWAY labels',()=>{
 assert.equal(locationLabel('home'),'HOME');
 assert.equal(locationLabel('away'),'AWAY');
 assert.equal(locationLabel('neutral'),'');
});
