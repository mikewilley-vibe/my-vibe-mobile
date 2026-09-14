import { useEffect,useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { SafeAreaProvider,SafeAreaView } from 'react-native-safe-area-context';
import { hydrate } from '../src/store';
import { Button,colors,Page } from '../src/ui';
export default function Layout(){
 const [ready,setReady]=useState(false);const [error,setError]=useState('');
 const load=()=>{setError('');hydrate().then(()=>setReady(true)).catch(e=>setError(e.message));};
 useEffect(load,[]);
 return <SafeAreaProvider><StatusBar style="dark"/>{ready?<Stack screenOptions={{headerStyle:{backgroundColor:colors.paper},headerTintColor:colors.ink,contentStyle:{backgroundColor:colors.paper}}}><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="plan" options={{title:'Plan details',presentation:'modal'}}/></Stack>:<SafeAreaView style={{flex:1}}><Page><Text>{error||'Loading your plans…'}</Text>{!!error&&<Button title="Try again" onPress={load}/>}</Page></SafeAreaView>}</SafeAreaProvider>;
}
