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
 return <Tabs initialRouteName="calendar" screenOptions={{tabBarActiveTintColor:colors.harbor,headerStyle:{backgroundColor:colors.paper},headerTitleStyle:{color:colors.ink},tabBarStyle:{backgroundColor:'white'}}}>
  {TABS.map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color})=><Text style={{fontSize:24,color}}>{icon}</Text>}}/>)}
  <Tabs.Screen name="index" options={{href:null}}/>
  <Tabs.Screen name="home" options={{href:null,title:'Home'}}/>
 </Tabs>;
}
