import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect, useRouter } from 'expo-router'
import { Leaf } from 'lucide-react-native'
import { Botao, Campo, Texto, estilos } from '../components/ui'
import { loginSchema } from '@RoteiroNutri/shared'
import { useAuth } from '../lib/auth'
import { validar } from '../lib/validacao'
import { cores } from '../lib/tema'

// RF16 - Login do paciente
export default function Login() {
  const { entrar, token } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (token) return <Redirect href="/inicio" />

  const enviar = async () => {
    setErro('')
    const { dados, erro: invalido } = validar(loginSchema, { email, senha })
    if (invalido) return setErro(invalido)
    setCarregando(true)
    try {
      await entrar(dados.email, dados.senha)
      router.replace('/inicio')
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../assets/logo-roteiro-nutri.png')} style={{ width: 180, height: 60 }} resizeMode="contain" />
          </View>
          <View style={[estilos.linha, { gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(46,89,41,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }]}>
            <Leaf size={12} color={cores.primaria} />
            <Texto style={{ color: cores.primaria, fontSize: 12, fontWeight: '600' }}>App do paciente</Texto>
          </View>
          <Texto estilo="titulo" style={{ marginTop: 14, fontSize: 30 }}>
            Acesse seu plano
          </Texto>
          <Texto estilo="legenda" style={{ marginTop: 6, fontSize: 14 }}>
            Use as credenciais fornecidas pelo seu nutricionista.
          </Texto>

          <View style={{ gap: 14, marginTop: 28 }}>
            <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={enviar} />
            <Pressable onPress={() => router.push('/esqueci-senha')} style={{ alignSelf: 'flex-end' }}>
              <Texto style={{ color: cores.primaria, fontSize: 13, fontWeight: '600' }}>Esqueci minha senha</Texto>
            </Pressable>
            {erro ? <Texto style={{ color: cores.perigo, fontSize: 13 }}>{erro}</Texto> : null}
            <Botao titulo={carregando ? 'Entrando...' : 'Entrar'} onPress={enviar} carregando={carregando} />
          </View>
          <Texto estilo="legenda" style={{ textAlign: 'center', marginTop: 24 }}>
            É nutricionista? Acesse o painel web do Roteiro Nutri.
          </Texto>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
