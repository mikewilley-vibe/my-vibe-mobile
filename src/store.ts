import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { validatePlan, type Plan } from './model';
import { hydrateCalendarSources } from './calendarSources.ts';
type Data = { plans: Plan[]; links: Record<string,string> };
const KEY='my-vibe:v1';
let data: Data={plans:[],links:{}};
let ready=false;
const listeners=new Set<()=>void>();
let queue: Promise<unknown>=Promise.resolve();
function notify(){ listeners.forEach(l=>l()); }
export async function hydrate(){
 const raw=await AsyncStorage.getItem(KEY);
 if(raw){
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed.plans)||!parsed.links||typeof parsed.links!=='object') throw new Error('Saved plans could not be read. Your stored data has been kept.');
  parsed.plans.forEach(validatePlan);
  data=parsed;
 }
 await hydrateCalendarSources();
 ready=true;notify();
}
function change(fn:(d:Data)=>Data){
 const next=queue.then(async()=>{
  if(!ready) throw new Error('Wait for saved plans to load.');
  const updated=fn(data);
  await AsyncStorage.setItem(KEY,JSON.stringify(updated));
  data=updated;notify();
 });
 queue=next.catch(()=>{});return next;
}
export function savePlan(plan:Plan){validatePlan(plan);return change(d=>({...d,plans:[...d.plans.filter(p=>p.id!==plan.id),plan].sort((a,b)=>a.start.localeCompare(b.start))}));}
export function removePlan(id:string){return change(d=>({...d,plans:d.plans.filter(p=>p.id!==id)}));}
export function saveLink(id:string,eventId:string){return change(d=>({...d,links:{...d.links,[id]:eventId}}));}
export function getData(){return data;}
export function useData(){return useSyncExternalStore(cb=>{listeners.add(cb);return()=>{listeners.delete(cb)}},()=>data);}
