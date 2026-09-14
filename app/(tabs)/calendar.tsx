import { useCallback,useState } from 'react';
import { ActivityIndicator,Alert,Linking,Platform,Pressable,Text,View } from 'react-native';
import { router,useFocusEffect } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useData } from '../../src/store';
import { googleMonthEvents,openCalendar,type DeviceEvent,type GoogleMonth } from '../../src/calendar';
import { agendaEmbedUrl,GOOGLE_CALENDAR_SETUP_HINT,isMyVibeDeviceEvent,monthRange,resolveGoogleCalendarEmbedUrl } from '../../src/calendarDetect';
import { Page,Card,Button,styles,colors,when,problem } from '../../src/ui';

const dayKey=(d:Date)=>`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const embedSrc=(()=>{const resolved=resolveGoogleCalendarEmbedUrl(process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_EMBED_URL);return resolved?agendaEmbedUrl(resolved):null})();

export default function MyCalendar(){
 const {plans,links}=useData();
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [selected,setSelected]=useState<string|null>(null);
 const [view,setView]=useState<'month'|'agenda'>('month');
 const [access,setAccess]=useState<GoogleMonth['access']>('unavailable');
 const [googleEvents,setGoogleEvents]=useState<DeviceEvent[]>([]);
 const [hasGoogleCalendar,setHasGoogleCalendar]=useState(false);
 const [googleError,setGoogleError]=useState('');
 const [refreshing,setRefreshing]=useState(false);
 const [embedNonce,setEmbedNonce]=useState(0);
 const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 const linkedIds=new Set(Object.values(links));
 const googleForMonth=googleEvents.filter(event=>!linkedIds.has(event.id)&&!isMyVibeDeviceEvent(event.notes));
 const visiblePlans=plans.filter(p=>{const date=new Date(p.start);return selected?dayKey(date)===selected:date.getMonth()===month.getMonth()&&date.getFullYear()===month.getFullYear()});
 const visibleGoogle=googleForMonth.filter(event=>selected?dayKey(new Date(event.start))===selected:true);
 const items=[
  ...visiblePlans.map(plan=>({key:'plan:'+plan.id,start:plan.start,kind:'plan' as const,title:plan.title,location:plan.location,planId:plan.id})),
  ...visibleGoogle.map(event=>({key:'google:'+event.id,start:event.start,kind:'google' as const,title:event.title,location:event.location||event.calendarTitle,event})),
 ].sort((a,b)=>a.start.localeCompare(b.start)||(a.kind==='plan'?-1:1));

 const loadGoogle=useCallback(async()=>{
  setGoogleError('');
  const range=monthRange(month);
  try{
   const result=await googleMonthEvents(range.start,range.end);
   setAccess(result.access);
   setGoogleEvents(result.events);
   setHasGoogleCalendar(result.hasGoogleCalendar);
  }catch(e){
   setGoogleError(e instanceof Error?e.message:'Google events could not load. Pull to refresh and try again.');
  }
 },[month]);

 useFocusEffect(useCallback(()=>{void loadGoogle();},[loadGoogle]));

 function move(n:number){setMonth(new Date(month.getFullYear(),month.getMonth()+n,1));setSelected(null)}
 function refresh(){setRefreshing(true);setEmbedNonce(n=>n+1);void loadGoogle().finally(()=>setRefreshing(false))}
 async function openGoogle(event:DeviceEvent){
  try{await openCalendar(event.id);}
  catch{Alert.alert(event.title,[when(event.start),event.location,event.calendarTitle].filter(Boolean).join('\n')||'Google calendar event');}
 }

 return <Page refreshing={refreshing} onRefresh={refresh}>
  <Text style={styles.eyebrow}>MAKE ROOM FOR THE GOOD STUFF</Text>
  <Text style={styles.title}>My calendar</Text>
  <Button title="+ Create a plan" onPress={()=>router.push('/plan')}/>
  {!!embedSrc&&<View style={styles.row}>
   <Pressable accessibilityRole="button" accessibilityState={{selected:view==='month'}} onPress={()=>setView('month')} style={[styles.button,view!=='month'&&{backgroundColor:colors.fog}]}><Text style={[styles.buttonText,view!=='month'&&{color:colors.ink}]}>Month</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityState={{selected:view==='agenda'}} onPress={()=>setView('agenda')} style={[styles.button,view!=='agenda'&&{backgroundColor:colors.fog}]}><Text style={[styles.buttonText,view!=='agenda'&&{color:colors.ink}]}>Agenda</Text></Pressable>
  </View>}
  {view==='agenda'&&embedSrc&&<Card>
   <Text style={styles.heading}>Family calendar</Text>
   <Text style={styles.body}>Public events from Google Calendar. Your saved My Vibe plans still appear on the Month view.</Text>
   <View style={{height:560,overflow:'hidden',borderRadius:16,borderWidth:1,borderColor:colors.fog,backgroundColor:'white'}}>
    <WebView key={embedNonce} accessibilityLabel="Google Calendar agenda" source={{uri:embedSrc}} style={{flex:1,backgroundColor:'white'}} startInLoadingState nestedScrollEnabled javaScriptEnabled renderLoading={()=><ActivityIndicator accessibilityLabel="Loading Google Calendar" color={colors.harbor} style={{marginTop:40}}/>}/>
   </View>
  </Card>}
  {view==='month'&&<>
   <Card>
    <View style={styles.row}><Button title="‹" onPress={()=>move(-1)}/><Text style={styles.heading}>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</Text><Button title="›" onPress={()=>move(1)}/></View>
    <View style={{flexDirection:'row',flexWrap:'wrap'}}>
     {['S','M','T','W','T','F','S'].map((d,i)=><Text key={i} style={{width:'14.28%',textAlign:'center',color:colors.muted,paddingVertical:10}}>{d}</Text>)}
     {Array.from({length:month.getDay()},(_,i)=><View key={'blank'+i} style={{width:'14.28%'}}/>)}
     {Array.from({length:days},(_,i)=>{
      const key=dayKey(new Date(month.getFullYear(),month.getMonth(),i+1));
      const hasPlan=plans.some(p=>dayKey(new Date(p.start))===key);
      const hasGoogle=googleForMonth.some(event=>dayKey(new Date(event.start))===key);
      const has=hasPlan||hasGoogle;
      return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${month.toLocaleDateString(undefined,{month:'long'})} ${i+1}${hasPlan?', has My Vibe plans':''}${hasGoogle?', has Google events':''}`} onPress={()=>setSelected(selected===key?null:key)} style={{width:'14.28%',height:48,alignItems:'center',justifyContent:'center',backgroundColor:selected===key?colors.harbor:'transparent',borderRadius:12}}>
       <Text style={{color:selected===key?'white':colors.ink}}>{i+1}</Text>
       <Text style={{color:selected===key?'white':hasPlan?colors.harbor:colors.signal,fontSize:9}}>{has?'●':' '}</Text>
      </Pressable>;
     })}
    </View>
    {selected&&<Button title="Show whole month" onPress={()=>setSelected(null)}/>}
   </Card>
   {access==='denied'&&<Card><Text style={styles.body}>Allow Calendar access in Settings to also see Google events here. Your saved My Vibe plans still show below.</Text><Button title="Calendar permission settings" onPress={()=>void Linking.openSettings().catch(problem)}/></Card>}
   {access==='granted'&&!hasGoogleCalendar&&Platform.OS!=='web'&&<Card><Text style={styles.body}>{GOOGLE_CALENDAR_SETUP_HINT}</Text></Card>}
   {!!googleError&&<Card><Text style={styles.body}>{googleError}</Text><Button title="Try Google events again" onPress={()=>void loadGoogle()}/></Card>}
   {items.length?items.map(item=>item.kind==='plan'
    ?<Card key={item.key}><Text style={styles.eyebrow}>{when(item.start)} · My Vibe</Text><Text style={styles.heading}>{item.title}</Text><Text style={styles.body}>{item.location}</Text><Button title="View plan & calendar status" onPress={()=>router.push({pathname:'/plan',params:{id:item.planId}})}/></Card>
    :<Card key={item.key}><Text style={styles.eyebrow}>{when(item.start)} · Google</Text><Text style={styles.heading}>{item.title}</Text><Text style={styles.body}>{item.location}</Text><Button title="Open in Calendar" onPress={()=>void openGoogle(item.event!)}/></Card>
   ):<Text style={styles.body}>No plans or Google events {selected?'on this day':'this month'} yet.</Text>}
  </>}
 </Page>;
}
