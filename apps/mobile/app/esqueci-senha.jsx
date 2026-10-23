import { useState } from 'react'
import { View } from 'react-native'
import { CheckCircle2, Mail } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Botao, Cabecalho, Campo, Card, Tela, Texto } from '../components/ui'
import { solicitarRecuperacaoSenhaSchema } from '@RoteiroNutri/shared'
import { api } from '../lib/api'
import { validar } from '../lib/validacao'
import { cores } from '../lib/tema'

// RN09 - O paciente pede uma nova senha; o nutricionista aprova e ela chega por e-mail
export default function EsqueciSenha() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const enviar = async () => {
    setErro('')
    const { dados, erro: invalido } = validar(solicitarRecuperacaoSenhaSchema, { email })
    if (invalido) return setErro(invalido)
    setCarregando(true)
    try {
      await api('/auth/pacientes/solicitar-senha', { method: 'POST', body: dados })
      setEnviado(true)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="Recuperar senha" />
      {enviado ? (
        <Card style={{ alignItems: 'center', padding: 24, gap: 10 }}>
          <CheckCircle2 size={48} color={cores.primaria} />
          <Texto estilo="titulo" style={{ fontSize: 24 }}>
            Pedido enviado
          </Texto>
          <Texto estilo="legenda" style={{ textAlign: 'center', fontSize: 14 }}>
            Se o e-mail estiver cadastrado, seu nutricionista recebeu o pedido. Assim que ele aprovar, a nova senha chegará em {email}.
          </Texto>
          <Botao titulo="Voltar ao login" variante="contorno" onPress={() => router.replace('/login')} style={{ marginTop: 8, alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          <Texto estilo="legenda" style={{ fontSize: 14 }}>
            Seu pedido será enviado ao nutricionista para aprovação. Depois de aprovado, a nova senha chega no seu e-mail.
          </Texto>
          <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          {erro ? <Texto style={{ color: cores.perigo, fontSize: 13 }}>{erro}</Texto> : null}
          <Botao titulo="Solicitar nova senha" onPress={enviar} carregando={carregando} desabilitado={!email} icone={<Mail size={16} color={cores.primariaTexto} />} />
        </View>
      )}
    </Tela>
  )
}
