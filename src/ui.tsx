import { ReactNode } from 'react';
import { ScrollView,Text,Pressable,View,StyleSheet,Linking,Alert,RefreshControl } from 'react-native';
import { showSignalConcertUrls } from './showsignal';
export const colors={
 paper:'#F5F0E7',
 surface:'#FBF8F2',
 ink:'#A44722',
 muted:'#4B4038',
 harbor:'#A44722',
 pressed:'#863616',
 fog:'#DDD2C3',
 wash:'#EDE6D8',
 onAccent:'#FBF8F2',
 selectedFill:'rgba(164,71,34,0.12)',
 accentFill:'rgba(164,71,34,0.14)',
 signal:'#c45c26',
 uvaBlue:'#232D4B',
 uvaOrange:'#F84C1E'
};
export const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.paper},content:{padding:22,paddingBottom:48,gap:18},eyebrow:{fontSize:12,fontWeight:'700',letterSpacing:2,color:colors.harbor},title:{fontSize:36,fontWeight:'700',color:colors.ink},heading:{fontSize:23,fontWeight:'600',color:colors.ink},body:{fontSize:16,lineHeight:24,color:colors.muted},card:{backgroundColor:colors.surface,borderRadius:20,padding:20,gap:12,borderWidth:1,borderColor:colors.fog},row:{flexDirection:'row',gap:10,flexWrap:'wrap',alignItems:'center'},button:{backgroundColor:colors.harbor,borderRadius:12,paddingHorizontal:18,paddingVertical:14,minHeight:48,alignItems:'center'},buttonText:{color:colors.onAccent,fontSize:16,fontWeight:'600'},input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.fog,borderRadius:12,padding:14,fontSize:17,color:colors.ink,minHeight:50}});
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
