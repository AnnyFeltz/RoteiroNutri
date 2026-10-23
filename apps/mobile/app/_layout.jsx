import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../lib/auth'
import { cores } from '../lib/tema'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: (n, erro) => erro?.status === 0 && n < 2, staleTime: 30_000 } },
})

// App mobile EXCLUSIVO do paciente. O nutricionista usa o painel web (apps/web).
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.creme } }} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
