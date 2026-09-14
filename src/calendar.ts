import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';
import { makeCalendarWriter, type Plan } from './model';
import { saveLink } from './store';
import { GOOGLE_CALENDAR_SETUP_HINT, isGoogleCalendar, preferGoogleCalendars } from './calendarDetect';
export type DeviceEvent = { id: string; calendarId: string; title: string; start: string; end: string; location: string; notes: string; calendarTitle: string };
export type GoogleMonth = { access: 'granted' | 'denied' | 'unavailable'; events: DeviceEvent[]; hasGoogleCalendar: boolean };
function asIso(value: unknown): string {
 if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : '';
 if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString();
 if (typeof value === 'string') { const t=Date.parse(value); return Number.isFinite(t) ? new Date(t).toISOString() : ''; }
 return '';
}
export async function calendars(){
 if(Platform.OS==='web') throw new Error('Open the iPhone or Android app to add to your device calendar.');
 let permission=await Calendar.getCalendarPermissionsAsync();
 if(permission.status!=='granted') permission=await Calendar.requestCalendarPermissionsAsync();
 if(permission.status!=='granted') throw new Error('Allow Calendar access in Settings to add plans. Your My Vibe plans are still saved.');
 const writable=(await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(c=>c.allowsModifications);
 if(!writable.length) throw new Error('No writable calendar was found. Set up a calendar account in the Calendar app, then try again. '+GOOGLE_CALENDAR_SETUP_HINT);
 return preferGoogleCalendars(writable);
}
export async function googleMonthEvents(start: Date, end: Date): Promise<GoogleMonth> {
 if(Platform.OS==='web') return {access:'unavailable',events:[],hasGoogleCalendar:false};
 let permission=await Calendar.getCalendarPermissionsAsync();
 if(permission.status!=='granted') permission=await Calendar.requestCalendarPermissionsAsync();
 if(permission.status!=='granted') return {access:'denied',events:[],hasGoogleCalendar:false};
 const all=await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
 const google=all.filter(isGoogleCalendar);
 if(!google.length) return {access:'granted',events:[],hasGoogleCalendar:false};
 const titles=new Map(google.map(c=>[c.id,c.title]));
 const raw=await Calendar.getEventsAsync(google.map(c=>c.id),start,end);
 return {access:'granted',hasGoogleCalendar:true,events:raw.map(event=>({
  id:event.id,calendarId:event.calendarId,title:event.title?.trim()||'Busy',start:asIso(event.startDate),end:asIso(event.endDate),
  location:event.location||'',notes:event.notes||'',calendarTitle:titles.get(event.calendarId)||'Google',
 })).filter(event=>event.id&&event.start).sort((a,b)=>a.start.localeCompare(b.start))};
}
export async function linkedEvent(id:string){
 // Query errors are deliberately propagated: never create a duplicate after an uncertain read.
 try { return await Calendar.getEventAsync(id) || null; } catch(error) {
  if ((error as {code?:string}).code === 'ERR_EVENT_NOT_FOUND') return null;
  throw error;
 }
}
export const writeCalendar=makeCalendarWriter({
 getLinked: linkedEvent,
 find: async(_calendarId,plan)=>{
  const all=await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return Calendar.getEventsAsync(all.map(c=>c.id),new Date(Date.parse(plan.start)-86400000),new Date(Date.parse(plan.end)+86400000));
 },
 create: async(calendarId,plan,notes)=>Calendar.createEventAsync(calendarId,{title:plan.title,startDate:new Date(plan.start),endDate:new Date(plan.end),location:plan.location,notes,...(Platform.OS==='ios'&&plan.url?{url:plan.url}:{})}),
},saveLink);
export async function status(id:string):Promise<'present'|'missing'|'unknown'>{
 if(Platform.OS==='web') return 'unknown';
 try{
  if((await Calendar.getCalendarPermissionsAsync()).status!=='granted') return 'unknown';
  return (await linkedEvent(id))?'present':'missing';
 }catch{return 'unknown';}
}
export function openCalendar(id:string){return Calendar.openEventInCalendarAsync({id});}
