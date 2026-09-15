import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,Text,View } from 'react-native';
import { router } from 'expo-router';
import { BASE,getUvaSchedule } from '../../src/api';
import { formatUvaWhen,locationLabel,nextUp,planLocation,recentResults,resultLabel,upcomingGames,uvaHeadline,type UvaGame } from '../../src/uva';
import { useData } from '../../src/store';
import { Button,Card,Page,colors,openLink,styles } from '../../src/ui';

function Chip({label,background,accessibilityLabel}:{label:string;background:string;accessibilityLabel?:string}){
 return <View accessible accessibilityLabel={accessibilityLabel||label} style={{backgroundColor:background,borderRadius:6,paddingHorizontal:8,paddingVertical:3}}><Text style={{color:'white',fontSize:11,fontWeight:'700'}}>{label}</Text></View>;
}

function resultChip(result?:string){
 const label=resultLabel(result);
 if(!label) return null;
 const background=result==='win'?colors.uvaBlue:result==='loss'?colors.uvaOrange:colors.muted;
 const spoken=result==='win'?'Win':result==='loss'?'Loss':label;
 return <Chip label={label} background={background} accessibilityLabel={spoken}/>;
}

function GameCard({game,next}:{game:UvaGame;next?:boolean}){
 const {plans}=useData();
 const loc=locationLabel(game.location);
 const planId='uva:'+game.id;
 const saved=plans.some(p=>p.id===planId);
 return <Card>
  <View style={styles.row}>
   {next?<Chip label="NEXT" background={colors.uvaOrange}/>:null}
   <Text style={styles.eyebrow}>{formatUvaWhen(game.date)}</Text>
   {loc?<Chip label={loc} background={game.location==='home'?colors.uvaBlue:colors.uvaOrange}/>:null}
  </View>
  <Text style={[styles.heading,{color:colors.uvaBlue}]}>{uvaHeadline(game)}</Text>
  {!!game.note&&<Text style={styles.body}>{game.note}</Text>}
  <Button title={saved?'View saved plan':'Add to My Vibe'} onPress={()=>router.push({pathname:'/plan',params:{id:planId,title:uvaHeadline(game),start:game.date,location:planLocation(game),url:game.sourceUrl}})}/>
  {!!game.sourceUrl&&<Button title="Game details ↗" onPress={()=>void openLink(game.sourceUrl!)}/>}
 </Card>;
}

function ResultCard({game}:{game:UvaGame}){
 const loc=locationLabel(game.location);
 return <Card>
  <View style={styles.row}>
   {resultChip(game.result)}
   <Text style={styles.eyebrow}>{formatUvaWhen(game.date)}</Text>
   {loc?<Chip label={loc} background={game.location==='home'?colors.uvaBlue:colors.uvaOrange}/>:null}
  </View>
  <Text style={[styles.heading,{color:colors.uvaBlue}]}>{uvaHeadline(game)}</Text>
  {!!game.note&&<Text style={styles.body}>{game.note}</Text>}
 </Card>;
}

function SportSection({label,games}:{label:string;games:UvaGame[]}){
 const upcoming=upcomingGames(games);
 const results=recentResults(games);
 return <>
  <View style={styles.row}>
   <View style={{flex:1,gap:4}}>
    <Text style={[styles.eyebrow,{color:colors.uvaOrange}]}>{label.toUpperCase()}</Text>
    <Text style={[styles.heading,{color:colors.uvaBlue}]}>Next 5 games</Text>
   </View>
   <Text style={styles.body}>{upcoming.length} shown</Text>
  </View>
  {upcoming.length?upcoming.map((game,i)=><GameCard key={game.id} game={game} next={i===0}/>):<Text style={styles.body}>No upcoming games found.</Text>}
  <View style={styles.row}>
   <View style={{flex:1,gap:4}}>
    <Text style={[styles.heading,{color:colors.uvaBlue}]}>Recent results</Text>
   </View>
   <Text style={styles.body}>{results.length} shown</Text>
  </View>
  {results.length?results.map(game=><ResultCard key={game.id} game={game}/>):<Text style={styles.body}>No recent results yet. When a game is final, the W or L will show up here.</Text>}
 </>;
}

export default function UVA(){
 const [football,setFootball]=useState<UvaGame[]>([]);
 const [basketball,setBasketball]=useState<UvaGame[]>([]);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);

 const load=useCallback((mode:'initial'|'refresh')=>{
  if(mode==='initial'){setLoading(true);setError('');}
  else setRefreshing(true);
  getUvaSchedule({force:mode==='refresh'}).then(data=>{setFootball(data.football);setBasketball(data.basketball);setError('');}).catch(e=>setError(e instanceof Error?e.message:'UVA schedule could not load. Try again in a moment.')).finally(()=>{setLoading(false);setRefreshing(false);});
 },[]);

 useEffect(()=>{load('initial');},[load]);
 const next=nextUp(football,basketball);
 const empty=!football.length&&!basketball.length;

 return <Page refreshing={refreshing} onRefresh={()=>load('refresh')}>
  <Text style={[styles.eyebrow,{color:colors.uvaOrange}]}>ATHLETICS</Text>
  <Text style={[styles.title,{color:colors.uvaBlue}]}>UVA Schedule</Text>
  <Text style={styles.body}>{next?`Next up (${next.sport === 'Basketball' ? "Men's Basketball" : next.sport}): ${uvaHeadline(next.game)}`:'Upcoming games and recent results'}</Text>
  {loading&&<ActivityIndicator accessibilityLabel="Loading UVA schedule" color={colors.uvaBlue}/>}
  {!!error&&<Card><Text style={styles.body}>{error}</Text><Button title="Retry" onPress={()=>load('initial')}/><Button title="Open on the web ↗" onPress={()=>void openLink(`${BASE}/uva`)}/></Card>}
  {!loading&&!error&&empty&&<Card><Text style={styles.body}>UVA games are temporarily unavailable. Please try again in a few minutes.</Text><Button title="Retry" onPress={()=>load('initial')}/></Card>}
  {!loading&&!error&&!empty&&<>
   <SportSection label="Football" games={football}/>
   <SportSection label="Men's Basketball" games={basketball}/>
  </>}
 </Page>;
}
