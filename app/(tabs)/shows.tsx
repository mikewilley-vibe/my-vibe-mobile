import { useEffect,useState } from 'react';
import { Text,View,ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getConcerts } from '../../src/api';
import type { Concert } from '../../src/reused/concert';
import { localVenuesByRegion } from '../../src/reused/localVenues';
import { useData } from '../../src/store';
import { Page,Card,Button,styles,when,openLink } from '../../src/ui';
export default function Shows(){
 const [region,setRegion]=useState<'Richmond'|'Hampton Roads'|'Washington DC'>('Hampton Roads');
 const [events,setEvents]=useState<Concert[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [revision,setRevision]=useState(0);const {plans}=useData();
 useEffect(()=>{let active=true;setLoading(true);setError('');setEvents([]);getConcerts(region).then(e=>{if(active)setEvents(e)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[region,revision]);
 return <Page><Text style={styles.eyebrow}>GO OUT · TUNE IN</Text><Text style={styles.title}>Find your next show.</Text><View style={styles.row}>{localVenuesByRegion.map(r=><Button key={r.region} title={(r.region===region?'✓ ':'')+r.region} onPress={()=>setRegion(r.region)}/>)}</View>{loading&&<ActivityIndicator accessibilityLabel="Loading shows"/>}{!!error&&<Card><Text style={styles.body}>{error}</Text><Button title="Retry" onPress={()=>setRevision(r=>r+1)}/></Card>}{!loading&&!error&&!events.length&&<Text style={styles.body}>No upcoming shows were returned. Explore a venue below.</Text>}{events.map(e=><Card key={e.id}><Text style={styles.eyebrow}>{when(e.dateTime)}</Text><Text style={styles.heading}>{e.name}</Text><Text style={styles.body}>{e.venue} · {e.city}</Text><Button title={plans.some(p=>p.id==='concert:'+e.id)?'View saved plan':'Save to My Vibe'} onPress={()=>router.push({pathname:'/plan',params:{id:'concert:'+e.id,title:e.name,start:e.dateTime,location:[e.venue,e.city,e.state].filter(Boolean).join(', '),url:e.url}})}/>{!!e.url&&<Button title="Tickets & details ↗" onPress={()=>void openLink(e.url)}/>}</Card>)}<Text style={styles.heading}>Your local venues</Text>{localVenuesByRegion.find(r=>r.region===region)?.venues.map(v=><Button key={v.name} title={v.name+' ↗'} onPress={()=>void openLink(v.url)}/>)}</Page>
}
