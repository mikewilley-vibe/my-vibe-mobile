import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendarWriter,validatePlan,marker,type Plan,type CalendarPort } from '../src/model.ts';
const plan:Plan={id:'concert:123',title:'Live music',start:'2026-10-02T23:00:00Z',end:'2026-10-03T01:00:00Z',location:'The NorVa',notes:'Meet friends'};
function setup(){let created=0;const events:{id:string;calendarId:string;notes:string}[]=[];const links:Record<string,string>={};const port:CalendarPort={getLinked:async id=>events.find(e=>e.id===id)||null,find:async()=>events,create:async(calendarId,p,notes)=>{created++;events.push({id:String(created),calendarId,notes});return String(created)}};return {port,events,links,count:()=>created,write:makeCalendarWriter(port,async(id,e)=>{links[id]=e})}}
test('simultaneous taps create one event and preserve fields in notes',async()=>{const s=setup();const ids=await Promise.all([s.write(plan,'one'),s.write(plan,'one')]);assert.deepEqual(ids,['1','1']);assert.equal(s.count(),1);assert.ok(s.events[0].notes.includes(marker(plan)));assert.ok(s.events[0].notes.includes('Meet friends'))});
test('linked event blocks duplicate even with a different target calendar',async()=>{const s=setup();await s.write(plan,'one');await s.write(plan,'two',s.links[plan.id]);assert.equal(s.count(),1)});
test('deleted event can be added again',async()=>{const s=setup();await s.write(plan,'one');s.events.length=0;await s.write(plan,'one','1');assert.equal(s.count(),2)});
test('marker recovers an event when local persistence failed',async()=>{const s=setup();const broken=makeCalendarWriter(s.port,async()=>{throw new Error('disk full')});await assert.rejects(broken(plan,'one'));await s.write(plan,'one');assert.equal(s.count(),1);assert.equal(s.links[plan.id],'1')});
test('uncertain calendar reads never create events',async()=>{const s=setup();s.port.getLinked=async()=>{throw new Error('permission denied')};await assert.rejects(s.write(plan,'one','previous'));assert.equal(s.count(),0)});
test('invalid date, empty title and reversed range are rejected',()=>{for(const p of [{...plan,title:' '},{...plan,start:'bad'},{...plan,end:plan.start}])assert.throws(()=>validatePlan(p))});
