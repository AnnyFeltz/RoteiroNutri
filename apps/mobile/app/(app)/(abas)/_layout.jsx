import { Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { Home, UtensilsCrossed, TrendingUp, User } from 'lucide-react-native'
import { cores } from '../../../lib/tema'

export default function Abas() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: {
          backgroundColor: cores.card,
          borderTopColor: cores.borda,
          // no navegador não há safe-area inferior: dá espaço para o rótulo
          ...(Platform.OS === 'web' && { height: 64, paddingTop: 6, paddingBottom: 8 }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="plano" options={{ title: 'Plano', tabBarIcon: ({ color }) => <UtensilsCrossed size={22} color={color} /> }} />
      <Tabs.Screen name="evolucao" options={{ title: 'Evolução', tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  )
}
