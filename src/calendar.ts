import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';
import { makeCalendarWriter, type Plan } from './model';
import { saveLink } from './store';
export async function calendars(){
 if(Platform.OS==='web') throw new Error('Open the iPhone or Android app to add to your device calendar.');
 let permission=await Calendar.getCalendarPermissionsAsync();
 if(permission.status!=='granted') permission=await Calendar.requestCalendarPermissionsAsync();
 if(permission.status!=='granted') throw new Error('Allow Calendar access in Settings to add plans. Your My Vibe plans are still saved.');
 const writable=(await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(c=>c.allowsModifications);
 if(!writable.length) throw new Error('No writable calendar was found. Set up a calendar account in the Calendar app, then try again.');
 return writable;
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
