import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/ui';

export const unstable_settings = { initialRouteName: 'home' };

export default function TabsLayout(){
 return <Tabs initialRouteName="home" screenOptions={{tabBarActiveTintColor:colors.harbor,headerStyle:{backgroundColor:colors.paper},headerTitleStyle:{color:colors.ink},tabBarStyle:{backgroundColor:'white'}}}>
  {[['home','Home','⌂'],['calendar','My calendar','▦'],['shows','Shows','♫'],['uva','UVA','⚑']].map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color})=><Text style={{fontSize:24,color}}>{icon}</Text>}}/>)}
  <Tabs.Screen name="index" options={{href:null}}/>
 </Tabs>;
}
