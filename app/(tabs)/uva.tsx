import { useCallback,useEffect,useState } from 'react';
import { ActivityIndicator,Pressable,Text,View } from 'react-native';
import { BASE,getUvaSchedule } from '../../src/api';
import { formatUvaWhen,locationLabel,nextUp,upcomingGames,type UvaGame } from '../../src/uva';
import { Button,Card,Page,colors,openLink,styles } from '../../src/ui';

function Chip({label,background}:{label:string;background:string}){
 return <View style={{backgroundColor:background,borderRadius:6,paddingHorizontal:8,paddingVertical:3}}><Text style={{color:'white',fontSize:11,fontWeight:'700'}}>{label}</Text></View>;
}

function GameCard({game,next}:{game:UvaGame;next?:boolean}){
 const loc=locationLabel(game.location);
 return <Card>
  <View style={styles.row}>
   {next?<Chip label="NEXT" background={colors.uvaOrange}/>:null}
   <Text style={styles.eyebrow}>{formatUvaWhen(game.date)}</Text>
   {loc?<Chip label={loc} background={game.location==='home'?colors.uvaBlue:colors.uvaOrange}/>:null}
  </View>
  <Text style={[styles.heading,{color:colors.uvaBlue}]}>vs {game.opponent}</Text>
  {!!game.note&&<Text style={styles.body}>{game.note}</Text>}
  {!!game.sourceUrl&&<Button title="Game details ↗" onPress={()=>void openLink(game.sourceUrl!)}/>}
 </Card>;
}

function SportSection({label,games,resultsPath}:{label:string;games:UvaGame[];resultsPath:string}){
 const upcoming=upcomingGames(games);
 return <>
  <View style={styles.row}>
   <View style={{flex:1,gap:4}}>
    <Text style={[styles.eyebrow,{color:colors.uvaOrange}]}>{label.toUpperCase()}</Text>
    <Text style={[styles.heading,{color:colors.uvaBlue}]}>Next 5 games</Text>
   </View>
   <Text style={styles.body}>{upcoming.length} shown</Text>
   <Pressable accessibilityRole="button" accessibilityLabel={`${label} results`} onPress={()=>void openLink(`${BASE}${resultsPath}`)}>
    <Text style={{color:colors.uvaOrange,fontSize:16,fontWeight:'600'}}>Results →</Text>
   </Pressable>
  </View>
  {upcoming.length?upcoming.map((game,i)=><GameCard key={game.id} game={game} next={i===0}/>):<Text style={styles.body}>No upcoming games found.</Text>}
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
  getUvaSchedule().then(data=>{setFootball(data.football);setBasketball(data.basketball);setError('');}).catch(e=>setError(e instanceof Error?e.message:'UVA schedule could not load. Try again in a moment.')).finally(()=>{setLoading(false);setRefreshing(false);});
 },[]);

 useEffect(()=>{load('initial');},[load]);
 const next=nextUp(football,basketball);
 const empty=!football.length&&!basketball.length;

 return <Page refreshing={refreshing} onRefresh={()=>load('refresh')}>
  <Text style={[styles.eyebrow,{color:colors.uvaOrange}]}>ATHLETICS</Text>
  <Text style={[styles.title,{color:colors.uvaBlue}]}>UVA Schedule</Text>
  <Text style={styles.body}>{next?`Next up (${next.sport}): vs ${next.game.opponent}`:'Next five football and basketball games'}</Text>
  {loading&&<ActivityIndicator accessibilityLabel="Loading UVA schedule" color={colors.uvaBlue}/>}
  {!!error&&<Card><Text style={styles.body}>{error}</Text><Button title="Retry" onPress={()=>load('initial')}/><Button title="Open on the web ↗" onPress={()=>void openLink(`${BASE}/uva`)}/></Card>}
  {!loading&&!error&&empty&&<Card><Text style={styles.body}>Upcoming games are temporarily unavailable. Please try again in a few minutes.</Text><Button title="Retry" onPress={()=>load('initial')}/></Card>}
  {!loading&&!error&&!empty&&<>
   <SportSection label="Football" games={football} resultsPath="/uva/football/results"/>
   <SportSection label="Basketball" games={basketball} resultsPath="/uva/basketball/results"/>
  </>}
 </Page>;
}
