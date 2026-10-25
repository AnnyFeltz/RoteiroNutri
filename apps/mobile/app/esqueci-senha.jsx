import { useState } from 'react'
import { View } from 'react-native'
import { CheckCircle2, KeyRound, Mail } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Botao, Cabecalho, Campo, Card, Tela, Texto } from '../components/ui'
import { redefinirSenhaPacienteSchema, solicitarRecuperacaoSenhaSchema } from '@RoteiroNutri/shared'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { validar } from '../lib/validacao'
import { cores } from '../lib/tema'

// RF03 / RN09 - O paciente pede a redefinição pelo e-mail cadastrado:
// recebe um código e escolhe a nova senha aqui no app.
export default function EsqueciSenha() {
  const router = useRouter()
  const { token } = useAuth()
  const params = useLocalSearchParams()
  const [etapa, setEtapa] = useState('email') // email -> codigo -> pronto
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '')
  const [form, setForm] = useState({ codigo: '', novaSenha: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const executar = async (acao) => {
    setErro('')
    setCarregando(true)
    try {
      await acao()
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  const enviarCodigo = () => {
    const { dados, erro: invalido } = validar(solicitarRecuperacaoSenhaSchema, { email })
    if (invalido) return setErro(invalido)
    executar(async () => {
      await api('/auth/pacientes/solicitar-senha', { method: 'POST', body: dados })
      setEtapa('codigo')
    })
  }

  const redefinir = () => {
    const { dados, erro: invalido } = validar(redefinirSenhaPacienteSchema, { email, codigo: form.codigo, novaSenha: form.novaSenha })
    if (invalido) return setErro(invalido)
    if (form.novaSenha !== form.confirmar) return setErro('A confirmação não confere.')
    executar(async () => {
      await api('/auth/pacientes/redefinir-senha', { method: 'POST', body: dados })
      setEtapa('pronto')
    })
  }

  return (
    <Tela>
      <Cabecalho titulo="Redefinir senha" />

      {etapa === 'email' && (
        <View style={{ gap: 14 }}>
          <Texto estilo="legenda" style={{ fontSize: 14 }}>
            Informe o e-mail cadastrado. Vamos enviar um código para você criar uma nova senha.
          </Texto>
          <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          {erro ? <Texto style={{ color: cores.perigo, fontSize: 13 }}>{erro}</Texto> : null}
          <Botao titulo="Enviar código" onPress={enviarCodigo} carregando={carregando} desabilitado={!email} icone={<Mail size={16} color={cores.primariaTexto} />} />
        </View>
      )}

      {etapa === 'codigo' && (
        <View style={{ gap: 14 }}>
          <Texto estilo="legenda" style={{ fontSize: 14 }}>
            Se o e-mail {email} estiver cadastrado, você vai receber um código de 8 caracteres (válido por 1 hora). Digite-o abaixo e escolha a
            nova senha.
          </Texto>
          <Campo
            rotulo="Código"
            value={form.codigo}
            onChangeText={(v) => setForm({ ...form, codigo: v.toUpperCase() })}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
          />
          <Campo rotulo="Nova senha" senha value={form.novaSenha} onChangeText={(v) => setForm({ ...form, novaSenha: v })} />
          <Campo rotulo="Confirmar nova senha" senha value={form.confirmar} onChangeText={(v) => setForm({ ...form, confirmar: v })} />
          {erro ? <Texto style={{ color: cores.perigo, fontSize: 13 }}>{erro}</Texto> : null}
          <Botao titulo="Redefinir senha" onPress={redefinir} carregando={carregando} icone={<KeyRound size={16} color={cores.primariaTexto} />} />
          <Botao titulo="Reenviar código" variante="contorno" onPress={enviarCodigo} desabilitado={carregando} />
        </View>
      )}

      {etapa === 'pronto' && (
        <Card style={{ alignItems: 'center', padding: 24, gap: 10 }}>
          <CheckCircle2 size={48} color={cores.primaria} />
          <Texto estilo="titulo" style={{ fontSize: 24 }}>
            Senha redefinida
          </Texto>
          <Texto estilo="legenda" style={{ textAlign: 'center', fontSize: 14 }}>
            {token ? 'Na próxima vez que entrar, use a nova senha.' : 'Agora é só entrar com a nova senha.'}
          </Texto>
          <Botao
            titulo={token ? 'Voltar' : 'Ir para o login'}
            variante="contorno"
            onPress={() => (token ? router.back() : router.replace('/login'))}
            style={{ marginTop: 8, alignSelf: 'stretch' }}
          />
        </Card>
      )}
    </Tela>
  )
}
