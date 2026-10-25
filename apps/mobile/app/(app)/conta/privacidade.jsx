import { useState } from 'react'
import { Alert, Platform, Share, View } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { Shield, KeyRound, Share2, Trash2 } from 'lucide-react-native'
import { Botao, Cabecalho, Card, Tela, Texto, estilos } from '../../../components/ui'
import { api } from '../../../lib/api'
import { usePerfil, useEvolucao } from '../../../lib/consultas'
import { cores } from '../../../lib/tema'

// Privacidade (LGPD) e pedido de nova senha (RN09: o nutricionista aprova)
export default function Privacidade() {
  const perfil = usePerfil()
  const evolucao = useEvolucao()
  const [mensagem, setMensagem] = useState(null)

  const pedir = useMutation({
    mutationFn: () => api('/app/senha/solicitar', { method: 'POST' }),
    onSuccess: (r) => setMensagem({ ok: true, texto: r.mensagem }),
    onError: (e) => setMensagem({ ok: false, texto: e.message }),
  })

  const pedirNovaSenha = () => {
    if (Platform.OS === 'web') return pedir.mutate()
    Alert.alert(
      'Pedir nova senha',
      'Seu nutricionista vai receber o pedido. Quando ele aprovar, uma nova senha será enviada para o seu e-mail.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar pedido', onPress: () => pedir.mutate() },
      ]
    )
  }

  // LGPD: o paciente pode obter uma cópia dos próprios dados
  const compartilharDados = async () => {
    const { nutricionista, ...dados } = perfil.data || {}
    const conteudo = JSON.stringify({ perfil: dados, nutricionista: nutricionista?.nome, evolucao: evolucao.data?.registros }, null, 2)
    try {
      await Share.share({ title: 'Meus dados — Roteiro Nutri', message: conteudo })
    } catch {
      Alert.alert('Não foi possível compartilhar')
    }
  }

  return (
    <Tela>
      <Cabecalho titulo="Privacidade e senha" />
      <Card style={[estilos.linha, { gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(242,226,208,0.4)' }]}>
        <Shield size={18} color={cores.primaria} />
        <Texto estilo="legenda" style={{ flex: 1 }}>
          Seus dados de saúde são confidenciais e visíveis apenas para você e seu nutricionista, conforme a LGPD. Sua senha é armazenada
          criptografada.
        </Texto>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={[estilos.linha, { gap: 6 }]}>
          <KeyRound size={16} color={cores.primaria} />
          <Texto estilo="forte">Senha</Texto>
        </View>
        <Texto estilo="legenda">
          Para trocar a senha, faça o pedido ao seu nutricionista. Depois que ele aprovar, a nova senha chega no seu e-mail.
        </Texto>
        {mensagem && <Texto style={{ color: mensagem.ok ? cores.primaria : cores.perigo, fontSize: 13 }}>{mensagem.texto}</Texto>}
        <Botao titulo="Pedir nova senha ao nutricionista" onPress={pedirNovaSenha} carregando={pedir.isPending} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Texto estilo="rotulo">Seus dados</Texto>
        <Botao titulo="Exportar meus dados" variante="contorno" icone={<Share2 size={16} color={cores.texto} />} onPress={compartilharDados} />
        <Botao
          titulo="Excluir minha conta"
          variante="perigo"
          icone={<Trash2 size={16} color={cores.perigo} />}
          onPress={() => Alert.alert('Excluir conta', 'Por se tratar de um prontuário de saúde, solicite ao seu nutricionista o encerramento do acompanhamento.')}
        />
      </Card>
    </Tela>
  )
}
