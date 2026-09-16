import { ReactNode } from 'react';
import { ScrollView,Text,Pressable,View,StyleSheet,Linking,Alert,RefreshControl } from 'react-native';
import { showSignalConcertUrls } from './showsignal';
export const colors={
 paper:'#F7F3EC',
 surface:'#FFFDF9',
 ink:'#292622',
 muted:'#6B625A',
 harbor:'#B44A24',
 pressed:'#8E3A1C',
 fog:'#DED7CE',
 wash:'#F1E3D7',
 onAccent:'#FFFDF9',
 selectedFill:'rgba(180,74,36,0.12)',
 accentFill:'rgba(180,74,36,0.14)',
 signal:'#c45c26',
 uvaBlue:'#232D4B',
 uvaOrange:'#F84C1E'
};
export const styles=StyleSheet.create({
 page:{flex:1,backgroundColor:colors.paper},
 content:{padding:16,paddingBottom:40,gap:12},
 intro:{gap:4},
 chrome:{gap:10},
 eyebrow:{fontSize:11,fontWeight:'700',letterSpacing:1.6,color:colors.harbor},
 title:{fontSize:22,fontWeight:'600',color:colors.ink,lineHeight:28},
 heading:{fontSize:17,fontWeight:'600',color:colors.ink},
 body:{fontSize:14,lineHeight:20,color:colors.muted},
 lede:{fontSize:13,lineHeight:18,color:colors.muted},
 card:{backgroundColor:colors.surface,borderRadius:20,padding:20,gap:10,borderWidth:1,borderColor:colors.fog},
 row:{flexDirection:'row',gap:8,flexWrap:'wrap',alignItems:'center'},
 button:{backgroundColor:colors.harbor,borderRadius:10,paddingHorizontal:16,paddingVertical:11,minHeight:44,alignItems:'center',justifyContent:'center'},
 buttonText:{color:colors.onAccent,fontSize:15,fontWeight:'600'},
 segment:{backgroundColor:colors.wash,borderRadius:10,paddingHorizontal:14,paddingVertical:8,minHeight:36,alignItems:'center',justifyContent:'center'},
 segmentSelected:{backgroundColor:colors.harbor},
 segmentText:{color:colors.ink,fontSize:14,fontWeight:'600'},
 segmentTextSelected:{color:colors.onAccent},
 input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.fog,borderRadius:12,padding:14,fontSize:16,color:colors.ink,minHeight:48}
});
export function Page({children,refreshing=false,onRefresh}:{children:ReactNode;refreshing?:boolean;onRefresh?:()=>void}){return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.harbor} colors={[colors.harbor]}/>:undefined}>{children}</ScrollView>}
export function Button({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,disabled&&{opacity:0.5},pressed&&!disabled&&{backgroundColor:colors.pressed}]}><Text style={styles.buttonText}>{title}</Text></Pressable>}
export function Card({children}:{children:ReactNode}){return <View style={styles.card}>{children}</View>}
export function problem(error:unknown){Alert.alert('My Vibe',error instanceof Error?error.message:'Something went wrong. Please try again.');}
export async function openLink(url:string){try{if(!/^https?:\/\//i.test(url)) throw new Error('This link is not supported.');await Linking.openURL(url);}catch(e){problem(e)}}
export async function openAppOrWeb(schemeUrl:string|undefined, webUrl:string|undefined, missingMessage:string){
 try{
  if(schemeUrl){
   let canOpen=false;
   try{canOpen=await Linking.canOpenURL(schemeUrl);}catch{canOpen=false;}
   if(canOpen){
    try{await Linking.openURL(schemeUrl);return;}catch{/* Fall through to https. */}
   }
  }
  if(webUrl && /^https?:\/\//i.test(webUrl)){await Linking.openURL(webUrl);return;}
  problem(new Error(missingMessage));
 }catch(e){problem(e)}
}
export async function openInShowSignal(id:string){
 const trimmed=id.trim();
 if(!trimmed){problem(new Error('This show is missing a ShowSignal link.'));return;}
 const urls=showSignalConcertUrls(trimmed);
 try{
  let canOpenApp=false;
  try{canOpenApp=await Linking.canOpenURL(urls.app);}catch{canOpenApp=false;}
  if(canOpenApp){
   try{await Linking.openURL(urls.app);return;}catch{/* App scheme failed — use the website. */}
  }
  await Linking.openURL(urls.web);
 }catch(e){problem(e)}
}
export const when=(iso:string)=>new Date(iso).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
