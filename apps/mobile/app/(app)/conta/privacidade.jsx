import { useState } from 'react'
import { Alert, Share, View } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { Shield, KeyRound, Share2, Trash2 } from 'lucide-react-native'
import { Botao, Cabecalho, Campo, Card, Tela, Texto, estilos } from '../../../components/ui'
import { alterarSenhaSchema } from '@RoteiroNutri/shared'
import { api } from '../../../lib/api'
import { validar } from '../../../lib/validacao'
import { usePerfil, useEvolucao } from '../../../lib/consultas'
import { cores } from '../../../lib/tema'

// Privacidade (LGPD) e troca de senha
export default function Privacidade() {
  const perfil = usePerfil()
  const evolucao = useEvolucao()
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })
  const [mensagem, setMensagem] = useState(null)

  const alterar = useMutation({
    mutationFn: (dados) => api('/app/senha', { method: 'PUT', body: dados }),
    onSuccess: () => {
      setSenhas({ senhaAtual: '', novaSenha: '', confirmar: '' })
      setMensagem({ ok: true, texto: 'Senha alterada com sucesso.' })
    },
    onError: (e) => setMensagem({ ok: false, texto: e.message }),
  })

  const trocarSenha = () => {
    const { dados, erro } = validar(alterarSenhaSchema, { senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha })
    if (erro) return setMensagem({ ok: false, texto: erro })
    if (senhas.novaSenha !== senhas.confirmar) return setMensagem({ ok: false, texto: 'A confirmação não confere.' })
    alterar.mutate(dados)
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
          <Texto estilo="forte">Alterar senha</Texto>
        </View>
        <Campo rotulo="Senha atual" secureTextEntry value={senhas.senhaAtual} onChangeText={(v) => setSenhas({ ...senhas, senhaAtual: v })} />
        <Campo rotulo="Nova senha" secureTextEntry value={senhas.novaSenha} onChangeText={(v) => setSenhas({ ...senhas, novaSenha: v })} />
        <Campo rotulo="Confirmar nova senha" secureTextEntry value={senhas.confirmar} onChangeText={(v) => setSenhas({ ...senhas, confirmar: v })} />
        {mensagem && <Texto style={{ color: mensagem.ok ? cores.primaria : cores.perigo, fontSize: 13 }}>{mensagem.texto}</Texto>}
        <Botao titulo="Alterar senha" onPress={trocarSenha} carregando={alterar.isPending} />
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
