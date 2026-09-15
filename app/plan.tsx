import { useCallback,useEffect,useState } from 'react';
import { Text,TextInput,View,Platform,AppState,Linking,Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams,router,useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { useData,savePlan,removePlan,getData } from '../src/store';
import { calendars,status,writeCalendar,openCalendar } from '../src/calendar';
import { calendarChoiceLabel,GOOGLE_CALENDAR_SETUP_HINT,isGoogleCalendar } from '../src/calendarDetect';
import { validatePlan,type Plan } from '../src/model';
import { concertIdFromPlanId } from '../src/showsignal';
import { Page,Card,Button,styles,when,problem,openInShowSignal } from '../src/ui';
export default function Detail(){
 const params=useLocalSearchParams<{id?:string;title?:string;start?:string;location?:string;url?:string}>();
 const {plans,links}=useData();
 const [id]=useState(()=>params.id||'custom:'+randomUUID());const saved=plans.find(p=>p.id===id);const showSignalId=concertIdFromPlanId(id);
 const [draft,setDraft]=useState<Plan>(()=>saved||{id,title:params.title||'',start:params.start||new Date(Date.now()+3600000).toISOString(),end:new Date(Date.parse(params.start||new Date(Date.now()+3600000).toISOString())+7200000).toISOString(),location:params.location||'',notes:'',url:params.url});
 const [busy,setBusy]=useState(false);const [nativeStatus,setNativeStatus]=useState<'present'|'missing'|'unknown'>('unknown');
 const [choices,setChoices]=useState<Awaited<ReturnType<typeof calendars>>>([]);
 const [picker,setPicker]=useState<{field:'start'|'end';mode:'date'|'time'}|null>(null);
 const linked=links[id];const locked=!!linked&&nativeStatus!=='missing';
 const refresh=useCallback(()=>{if(linked)void status(linked).then(setNativeStatus);else setNativeStatus('missing')},[linked]);
 useFocusEffect(useCallback(()=>{refresh()},[refresh]));
 useEffect(()=>{const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh()});return()=>sub.remove()},[refresh]);
 const change=(field:keyof Plan,value:string)=>setDraft(d=>({...d,[field]:value}));
 async function save(){setBusy(true);try{validatePlan(draft);await savePlan(draft);Alert.alert('Saved to My Vibe','Your plan is saved on this device.');}catch(e){problem(e)}finally{setBusy(false)}}
 async function prepare(){setBusy(true);try{validatePlan(draft);await savePlan(draft);setChoices(await calendars());}catch(e){problem(e)}finally{setBusy(false)}}
 async function add(calendarId:string){setBusy(true);try{await savePlan(draft);await writeCalendar(draft,calendarId,getData().links[id]);setChoices([]);refresh();}catch(e){problem(e)}finally{setBusy(false)}}
 const googleCount=choices.filter(isGoogleCalendar).length;
 return <Page><Text style={styles.eyebrow}>{saved?'YOUR SAVED PLAN':'SOMETHING TO LOOK FORWARD TO'}</Text><Text style={styles.title}>{saved?'Plan details':'Make a plan'}</Text>{locked&&<Card><Text style={styles.body}>{nativeStatus==='present'?'✓ In Calendar. Open your device calendar to edit the exported event. Your saved My Vibe plan is a separate copy.':'Calendar status couldn’t be verified. Allow calendar access or retry before adding again.'}</Text><Button title="Check calendar status" onPress={refresh}/></Card>}
 <Text style={styles.heading}>Title</Text><TextInput accessibilityLabel="Plan title" style={styles.input} value={draft.title} editable={!locked&&!busy} onChangeText={v=>change('title',v)} placeholder="Dinner, a show, a little adventure…"/>
 {(['start','end'] as const).map(field=><Card key={field}><Text style={styles.heading}>{field==='start'?'Starts':'Ends'}</Text><Text style={styles.body}>{when(draft[field])}</Text>{Platform.OS==='web'?<TextInput accessibilityLabel={field+' date and time'} style={styles.input} value={draft[field]} editable={!locked&&!busy} onChangeText={v=>change(field,v)}/>:<View style={styles.row}><Button title="Choose date" disabled={locked||busy} onPress={()=>setPicker({field,mode:'date'})}/><Button title="Choose time" disabled={locked||busy} onPress={()=>setPicker({field,mode:'time'})}/></View>}</Card>)}
 <Text style={styles.body}>Times are shown in your device’s time zone. Concerts default to two hours; check the end time before saving.</Text>
 {!!picker&&Platform.OS!=='web'&&<Card><DateTimePicker value={new Date(draft[picker.field])} mode={picker.mode} display={Platform.OS==='ios'?'spinner':'default'} onChange={(event,date)=>{if(Platform.OS==='android')setPicker(null);if(event.type==='set'&&date)change(picker.field,date.toISOString())}}/>{Platform.OS==='ios'&&<Button title="Done" onPress={()=>setPicker(null)}/>}</Card>}
 <Text style={styles.heading}>Location</Text><TextInput accessibilityLabel="Location" style={styles.input} value={draft.location} editable={!locked&&!busy} onChangeText={v=>change('location',v)} placeholder="Venue or address"/>
 <Text style={styles.heading}>Notes</Text><TextInput accessibilityLabel="Notes" style={[styles.input,{minHeight:100}]} multiline value={draft.notes} editable={!locked&&!busy} onChangeText={v=>change('notes',v)} placeholder="Tickets, friends, things to remember"/>
 {!locked&&<Button title={busy?'Saving…':'Save to My Vibe'} disabled={busy} onPress={()=>void save()}/>}
 {!!showSignalId&&<Button title="Open in ShowSignal ↗" disabled={busy} onPress={()=>void openInShowSignal(showSignalId)}/>}
 {nativeStatus==='present'&&linked?<Button title="✓ In Calendar · Open" disabled={busy} onPress={()=>void openCalendar(linked).catch(problem)}/>:<Button title={busy?'Please wait…':'Add to Calendar'} disabled={busy||locked} onPress={()=>void prepare()}/>}
 {!!choices.length&&<Card><Text style={styles.heading}>Choose a calendar</Text><Text style={styles.body}>{googleCount===1?'Your Google calendar is first — that’s usually the right one.':'Google calendars are listed first. Tap one to add this plan.'}</Text>{!googleCount&&<Text style={styles.body}>{GOOGLE_CALENDAR_SETUP_HINT}</Text>}{choices.map(c=><Button key={c.id} title={calendarChoiceLabel(c,{recommended:googleCount===1&&isGoogleCalendar(c)})} disabled={busy} onPress={()=>void add(c.id)}/>)}<Button title="Cancel" disabled={busy} onPress={()=>setChoices([])}/></Card>}
 {Platform.OS!=='web'&&<Button title="Calendar permission settings" onPress={()=>void Linking.openSettings().catch(problem)}/>}
 {!!saved&&<Button title="Remove from My Vibe" disabled={busy} onPress={()=>Alert.alert('Remove saved plan?','Any event already added to your device calendar will remain there.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>{setBusy(true);void removePlan(id).then(()=>router.back()).catch(problem).finally(()=>setBusy(false))}}])}/>}
 </Page>
}
