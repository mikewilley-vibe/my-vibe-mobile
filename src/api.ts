import type { Concert } from './reused/concert';
export const BASE=(process.env.EXPO_PUBLIC_API_BASE_URL || 'https://www.mikewilley.app').replace(/\/$/,'');
export async function getConcerts(region:'Richmond'|'Hampton Roads'|'Washington DC'):Promise<Concert[]> {
 const coords={'Richmond':'lat=37.5407&lon=-77.4360','Hampton Roads':'lat=36.8508&lon=-76.2859','Washington DC':'lat=38.9072&lon=-77.0369'};
 const response=await fetch(`${BASE}/api/concerts/local?${coords[region]}&radius=60&days=90`,{signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw new Error('Shows could not load. Try again in a moment.');
 const body=await response.json();
 if(body.ok!==true||!Array.isArray(body.events)) throw new Error(body.error || 'The concert feed is unavailable.');
 return Array.from(new Map<string,Concert>((body.events as Concert[]).filter(e=>typeof e.id==='string'&&typeof e.name==='string'&&Number.isFinite(Date.parse(e.dateTime))&&Date.parse(e.dateTime)>=Date.now()).map(e=>[e.id,e])).values()).sort((a,b)=>a.dateTime.localeCompare(b.dateTime));
}
