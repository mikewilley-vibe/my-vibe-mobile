import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/ui';

export const unstable_settings = { initialRouteName: 'calendar' };

const TABS = [
 ['calendar', 'Calendar', '▦'],
 ['projects', 'My Projects', '◈'],
 ['shows', 'Shows', '♫'],
 ['uva', 'UVA', '⚑'],
] as const;

export default function TabsLayout(){
 return <Tabs initialRouteName="calendar" screenOptions={{tabBarActiveTintColor:colors.harbor,tabBarInactiveTintColor:colors.muted,headerStyle:{backgroundColor:colors.paper},headerTitleStyle:{color:colors.ink,fontWeight:'600'},tabBarLabelStyle:{fontSize:11,fontWeight:'600'},tabBarStyle:{backgroundColor:colors.paper,borderTopColor:colors.fog,borderTopWidth:1,elevation:0,boxShadow:'none'}}}>
  {TABS.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color})=><Text style={{fontSize:20,color}}>{icon}</Text>,...(name==='shows'?{headerStyle:{backgroundColor:colors.signalBlack,borderBottomColor:colors.signalLine,borderBottomWidth:1},headerTitleStyle:{color:colors.signalInk,fontWeight:'600' as const},headerShadowVisible:false,sceneStyle:{backgroundColor:colors.signalBlack}}:{})}}/>)}
  <Tabs.Screen name="index" options={{href:null}}/>
  <Tabs.Screen name="home" options={{href:null,title:'Home'}}/>
 </Tabs>;
}
