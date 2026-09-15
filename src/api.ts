import type { Concert } from './reused/concert';
import { concertsFromShowSignalEvents,eventsFromShowSignalBody,showSignalErrorMessage } from './showsignal';
import { parseUvaGames, type UvaGame } from './uva';
import { enabledUvaSports, type UvaSportId } from './uvaSports.ts';
export const BASE=(process.env.EXPO_PUBLIC_API_BASE_URL || 'https://www.mikewilley.app').replace(/\/$/,'');
export const SHOWSIGNAL_API_BASE=(process.env.EXPO_PUBLIC_SHOWSIGNAL_API_BASE_URL || 'https://concert-finder-eta.vercel.app').replace(/\/$/,'');
const REGION_LOCATION={
 Richmond:{latitude:37.5407,longitude:-77.4360,radiusMiles:60},
 'Hampton Roads':{latitude:36.8508,longitude:-76.2859,radiusMiles:60},
 'Washington DC':{latitude:38.9072,longitude:-77.0369,radiusMiles:60},
} as const;
const LOAD_ERROR='Shows could not load. Try again in a moment.';
const UVA_CACHE_MS=5*60*1000;
export type UvaSchedule={
 football:UvaGame[];
 basketball:UvaGame[];
 bySport:Partial<Record<UvaSportId,UvaGame[]>>;
 refreshedAt:string;
};
let uvaCache:{at:number;value:UvaSchedule}|null=null;
export async function getConcerts(region:'Richmond'|'Hampton Roads'|'Washington DC'):Promise<Concert[]> {
 const response=await fetch(`${SHOWSIGNAL_API_BASE}/api/v1/ticketmaster/events`,{
  method:'POST',
  headers:{Accept:'application/json','Content-Type':'application/json'},
  body:JSON.stringify({attractions:[],venues:[],location:REGION_LOCATION[region],pageSize:50}),
  signal:AbortSignal.timeout(20000),
 });
 const body=await response.json().catch(()=>({}));
 if(!response.ok) throw new Error(showSignalErrorMessage(body,LOAD_ERROR));
 const events=eventsFromShowSignalBody(body);
 if(!events) throw new Error(showSignalErrorMessage(body,'The concert feed is unavailable.'));
 return concertsFromShowSignalEvents(events);
}

async function getUvaFeed(path:string):Promise<UvaGame[]> {
 const response=await fetch(`${BASE}${path}`,{signal:AbortSignal.timeout(20000)});
 if(!response.ok) throw new Error('UVA schedule could not load. Try again in a moment.');
 const body=await response.json();
 if(body && body.ok===false) throw new Error(typeof body.error==='string'&&body.error?body.error:'The UVA schedule is unavailable.');
 return parseUvaGames(body);
}

export async function getUvaSchedule(options?:{force?:boolean}):Promise<UvaSchedule> {
 if(!options?.force && uvaCache && Date.now()-uvaCache.at<UVA_CACHE_MS) return uvaCache.value;
 const sports=enabledUvaSports();
 const results=await Promise.allSettled(sports.map(sport=>getUvaFeed(sport.feedPath)));
 if(results.every(result=>result.status==='rejected')) throw new Error('UVA schedule could not load. Try again in a moment.');
 const bySport:Partial<Record<UvaSportId,UvaGame[]>>={};
 sports.forEach((sport,index)=>{
  const result=results[index];
  bySport[sport.id]=result.status==='fulfilled'?result.value:[];
 });
 const value:UvaSchedule={
  football:bySport.football??[],
  basketball:bySport['mens-basketball']??[],
  bySport,
  refreshedAt:new Date().toISOString(),
 };
 uvaCache={at:Date.now(),value};
 return value;
}
