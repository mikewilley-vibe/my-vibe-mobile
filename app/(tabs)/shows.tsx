import { useEffect,useState,type ReactNode } from 'react';
import { ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router,useIsFocused } from 'expo-router';
import { getConcerts } from '../../src/api';
import type { Concert } from '../../src/reused/concert';
import { localVenuesByRegion } from '../../src/reused/localVenues';
import { useData } from '../../src/store';
import { Button,colors,openInShowSignal,openLink,styles,when } from '../../src/ui';

function SignalPage({children}:{children:ReactNode}){
 return <ScrollView style={showStyles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

function SignalCard({children}:{children:ReactNode}){
 return <View style={showStyles.card}>{children}</View>;
}

function RegionChip({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityState={{selected}} onPress={onPress} style={({pressed})=>[showStyles.region,selected?showStyles.regionOn:showStyles.regionOff,pressed&&(selected?showStyles.regionOnPressed:showStyles.regionOffPressed)]}>
  <Text style={selected?showStyles.regionOnText:showStyles.regionOffText}>{(selected?'✓ ':'')+label}</Text>
 </Pressable>;
}

export default function Shows(){
 const focused=useIsFocused();
 const [region,setRegion]=useState<'Richmond'|'Hampton Roads'|'Washington DC'>('Hampton Roads');
 const [events,setEvents]=useState<Concert[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [revision,setRevision]=useState(0);const {plans}=useData();
 useEffect(()=>{let active=true;setLoading(true);setError('');setEvents([]);getConcerts(region).then(e=>{if(active)setEvents(e)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[region,revision]);
 return <>
  <StatusBar style={focused?'light':'dark'}/>
  <SignalPage>
   <Text style={[styles.eyebrow,showStyles.eyebrow]}>GO OUT · TUNE IN</Text>
   <Text style={[styles.title,showStyles.title]}>Find your next show.</Text>
   <View style={styles.row}>{localVenuesByRegion.map(r=><RegionChip key={r.region} label={r.region} selected={r.region===region} onPress={()=>setRegion(r.region)}/>)}</View>
   {loading&&<ActivityIndicator accessibilityLabel="Loading shows" color={colors.signalLime}/>}
   {!!error&&<SignalCard><Text style={[styles.body,showStyles.body]}>{error}</Text><Button title="Retry" variant="signal" onPress={()=>setRevision(r=>r+1)}/></SignalCard>}
   {!loading&&!error&&!events.length&&<Text style={[styles.body,showStyles.body]}>No upcoming shows were returned. Explore a venue below.</Text>}
   {events.map(e=><SignalCard key={e.id}>
    <Text style={[styles.eyebrow,showStyles.eyebrow]}>{when(e.dateTime)}</Text>
    <Text style={[styles.heading,showStyles.heading]}>{e.name}</Text>
    <Text style={[styles.body,showStyles.body]}>{e.venue} · {e.city}</Text>
    <Button title={plans.some(p=>p.id==='concert:'+e.id)?'View saved plan':'Save to My Vibe'} onPress={()=>router.push({pathname:'/plan',params:{id:'concert:'+e.id,title:e.name,start:e.dateTime,location:[e.venue,e.city,e.state].filter(Boolean).join(', '),url:e.url}})}/>
    <Button title="Open in ShowSignal ↗" variant="signal" onPress={()=>void openInShowSignal(e.id)}/>
    {!!e.url&&<Button title="Tickets & details ↗" variant="signalOutline" onPress={()=>void openLink(e.url)}/>}
   </SignalCard>)}
   <Text style={[styles.heading,showStyles.heading]}>Your local venues</Text>
   {localVenuesByRegion.find(r=>r.region===region)?.venues.map(v=><Button key={v.name} title={v.name+' ↗'} variant="signalOutline" onPress={()=>void openLink(v.url)}/>)}
  </SignalPage>
 </>;
}

const showStyles=StyleSheet.create({
 page:{flex:1,backgroundColor:colors.signalBlack},
 card:{backgroundColor:colors.signalCard,borderRadius:20,padding:20,gap:10,borderWidth:1,borderColor:colors.signalLine},
 eyebrow:{color:colors.signalLime},
 title:{color:colors.signalInk},
 heading:{color:colors.signalInk},
 body:{color:colors.signalMuted},
 region:{borderRadius:10,paddingHorizontal:14,paddingVertical:8,minHeight:36,alignItems:'center',justifyContent:'center',borderWidth:1},
 regionOn:{backgroundColor:colors.signalLime,borderColor:colors.signalLime},
 regionOff:{backgroundColor:colors.signalCard,borderColor:colors.signalLine},
 regionOnPressed:{backgroundColor:colors.signalLimePressed,borderColor:colors.signalLimePressed},
 regionOffPressed:{backgroundColor:colors.signalCardPressed},
 regionOnText:{color:colors.signalBlack,fontSize:14,fontWeight:'600'},
 regionOffText:{color:colors.signalMuted,fontSize:14,fontWeight:'600'},
});
