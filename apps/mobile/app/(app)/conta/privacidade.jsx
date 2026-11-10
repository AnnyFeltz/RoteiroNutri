import { useState } from 'react'
import { Alert, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Shield, KeyRound, FileDown, Trash2 } from 'lucide-react-native'
import { Botao, Cabecalho, Card, Tela, Texto, estilos } from '../../../components/ui'
import { usePerfil, useEvolucao, usePlanoDoDia, useConsultas } from '../../../lib/consultas'
import { exportarFichaPaciente } from '../../../lib/fichaPdf'
import { cores } from '../../../lib/tema'

// Privacidade (LGPD) e redefinição de senha pelo e-mail cadastrado (RF03 / RN09)
export default function Privacidade() {
  const router = useRouter()
  const perfil = usePerfil()
  const evolucao = useEvolucao()
  const plano = usePlanoDoDia()
  const consultas = useConsultas()
  const [exportando, setExportando] = useState(false)

  // RF15 / LGPD: o paciente exporta a própria ficha (versão do paciente da ficha do nutricionista) em PDF
  const exportarDados = async () => {
    if (!perfil.data) return
    setExportando(true)
    try {
      await exportarFichaPaciente({ perfil: perfil.data, plano: plano.data?.plano, evolucao: evolucao.data, consultas: consultas.data })
    } catch (e) {
      Alert.alert('Não foi possível gerar o PDF', e.message)
    } finally {
      setExportando(false)
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
        <Texto estilo="legenda">Baixe sua ficha nutricional completa em PDF: dados, avaliação, evolução, plano alimentar e consultas.</Texto>
        <Botao
          titulo="Exportar meus dados (PDF)"
          variante="contorno"
          icone={<FileDown size={16} color={cores.texto} />}
          onPress={exportarDados}
          carregando={exportando}
          desabilitado={perfil.isLoading}
        />
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
