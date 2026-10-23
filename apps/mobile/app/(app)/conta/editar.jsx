import { useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react-native'
import { Botao, Cabecalho, Campo, Card, Carregando, Tela, Texto, estilos } from '../../../components/ui'
import { api } from '../../../lib/api'
import { usePerfil } from '../../../lib/consultas'
import { num, objetivoLabel } from '../../../lib/formato'
import { cores } from '../../../lib/tema'

// RF24 / RN18 - O paciente edita apenas os dados pessoais; o nutricionista é notificado
export default function EditarPerfil() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: p, isLoading } = usePerfil()
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')

  // aberto por link direto não há tela anterior: volta para o perfil
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/perfil'))

  const salvar = useMutation({
    mutationFn: () => api('/app/perfil', { method: 'PUT', body: { nome: form.nome.trim(), email: form.email.trim(), telefone: form.telefone.trim() } }),
    onSuccess: (novo) => {
      queryClient.setQueryData(['perfil'], novo)
      voltar()
    },
    onError: (e) => setErro(e.message),
  })

  if (isLoading) return <Carregando />
  const f = form ?? { nome: p.nome, email: p.email, telefone: p.telefone || '' }

  return (
    <Tela>
      <Cabecalho titulo="Editar perfil" />
      <Card style={[estilos.linha, { gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(242,226,208,0.4)' }]}>
        <Info size={18} color={cores.primaria} />
        <Texto estilo="legenda" style={{ flex: 1 }}>
          Você pode editar suas informações pessoais. Dados nutricionais (peso, altura, objetivo, restrições) só podem ser ajustados pelo seu
          nutricionista — ele será avisado das alterações.
        </Texto>
      </Card>

      <Card style={{ gap: 14 }}>
        <Campo rotulo="Nome completo" value={f.nome} onChangeText={(v) => setForm({ ...f, nome: v })} />
        <Campo rotulo="E-mail (login)" value={f.email} onChangeText={(v) => setForm({ ...f, email: v })} autoCapitalize="none" keyboardType="email-address" />
        <Campo rotulo="Telefone" value={f.telefone} onChangeText={(v) => setForm({ ...f, telefone: v })} keyboardType="phone-pad" />
      </Card>

      <Card style={{ gap: 8, backgroundColor: cores.suave, opacity: 0.8 }}>
        <Texto estilo="rotulo">Dados nutricionais (somente leitura)</Texto>
        <Leitura rotulo="Peso atual" valor={p.pesoAtualKg != null ? `${num(p.pesoAtualKg)} kg` : '—'} />
        <Leitura rotulo="Altura" valor={p.alturaCm ? `${p.alturaCm} cm` : '—'} />
        <Leitura rotulo="Objetivo" valor={objetivoLabel(p.objetivo)} />
        <Leitura rotulo="Meta de peso" valor={p.pesoMetaKg != null ? `${num(p.pesoMetaKg)} kg` : '—'} />
        <Leitura rotulo="Alergias" valor={p.alergias || 'Nenhuma'} />
      </Card>

      {erro ? <Texto style={{ color: cores.perigo }}>{erro}</Texto> : null}
      <View style={[estilos.linha, { gap: 10 }]}>
        <Botao titulo="Cancelar" variante="contorno" style={{ flex: 1 }} onPress={voltar} />
        <Botao titulo="Salvar" style={{ flex: 1 }} carregando={salvar.isPending} onPress={() => (form ? salvar.mutate() : voltar())} />
      </View>
    </Tela>
  )
}

function Leitura({ rotulo, valor }) {
  return (
    <View style={[estilos.linha, { justifyContent: 'space-between' }]}>
      <Texto estilo="legenda" style={{ fontSize: 13 }}>
        {rotulo}
      </Texto>
      <Texto estilo="forte" style={{ flexShrink: 1, textAlign: 'right' }}>
        {valor}
      </Texto>
    </View>
  )
}
