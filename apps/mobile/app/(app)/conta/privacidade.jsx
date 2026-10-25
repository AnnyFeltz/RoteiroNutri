import { Alert, Share, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Shield, KeyRound, Share2, Trash2 } from 'lucide-react-native'
import { Botao, Cabecalho, Card, Tela, Texto, estilos } from '../../../components/ui'
import { usePerfil, useEvolucao } from '../../../lib/consultas'
import { cores } from '../../../lib/tema'

// Privacidade (LGPD) e redefinição de senha pelo e-mail cadastrado (RF03 / RN09)
export default function Privacidade() {
  const router = useRouter()
  const perfil = usePerfil()
  const evolucao = useEvolucao()

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
          Para trocar a senha, enviamos um código para o seu e-mail cadastrado ({perfil.data?.email}). Com o código, você escolhe a nova
          senha aqui no app.
        </Texto>
        <Botao
          titulo="Redefinir senha por e-mail"
          onPress={() => router.push({ pathname: '/esqueci-senha', params: { email: perfil.data?.email ?? '' } })}
        />
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
