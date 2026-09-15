import type { Concert } from './reused/concert';
import { concertsFromShowSignalEvents,eventsFromShowSignalBody,showSignalErrorMessage } from './showsignal';
import { parseUvaGames, type UvaGame } from './uva';
export const BASE=(process.env.EXPO_PUBLIC_API_BASE_URL || 'https://www.mikewilley.app').replace(/\/$/,'');
export const SHOWSIGNAL_API_BASE=(process.env.EXPO_PUBLIC_SHOWSIGNAL_API_BASE_URL || 'https://concert-finder-eta.vercel.app').replace(/\/$/,'');
const REGION_LOCATION={
 Richmond:{latitude:37.5407,longitude:-77.4360,radiusMiles:60},
 'Hampton Roads':{latitude:36.8508,longitude:-76.2859,radiusMiles:60},
 'Washington DC':{latitude:38.9072,longitude:-77.0369,radiusMiles:60},
} as const;
const LOAD_ERROR='Shows could not load. Try again in a moment.';
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

export async function getUvaSchedule():Promise<{football:UvaGame[];basketball:UvaGame[]}> {
 const [football,basketball]=await Promise.allSettled([getUvaFeed('/api/uva/football'),getUvaFeed('/api/uva')]);
 if(football.status==='rejected'&&basketball.status==='rejected') throw new Error('UVA schedule could not load. Try again in a moment.');
 return {
  football:football.status==='fulfilled'?football.value:[],
  basketball:basketball.status==='fulfilled'?basketball.value:[],
 };
}
