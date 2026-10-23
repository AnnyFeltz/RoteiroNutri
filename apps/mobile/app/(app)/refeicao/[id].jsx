import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Replace, Info, RotateCcw } from 'lucide-react-native'
import { calcularAlimento, totaisRefeicao, itemEfetivo, iconeAlimento } from '@RoteiroNutri/shared'
import { Botao, Cabecalho, Card, CardDestaque, Carregando, Erro, Selo, Tela, Texto, estilos } from '../../../components/ui'
import { api } from '../../../lib/api'
import { hojeLocal, usePlanoDoDia } from '../../../lib/consultas'
import { cores } from '../../../lib/tema'

// RF19 / RF20 / RF25 - Detalhe da refeição: marcar consumo e trocar por substitutos
export default function Refeicao() {
  const { id } = useLocalSearchParams()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = usePlanoDoDia()
  const [itemSubstituindo, setItemSubstituindo] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const aplicar = (novo) => {
    queryClient.setQueryData(['plano'], novo)
    queryClient.invalidateQueries({ queryKey: ['evolucao'] })
  }

  const consumo = useMutation({
    mutationFn: (consumida) => api(`/app/refeicoes/${id}/consumo`, { method: 'PUT', body: { consumida, data: hojeLocal() } }),
    onSuccess: (novo, consumida) => {
      aplicar(novo)
      setMensagem(consumida ? 'Refeição concluída! 🎉' : 'Refeição desmarcada')
    },
    onError: (e) => setMensagem(e.message),
  })

  const substituir = useMutation({
    mutationFn: ({ itemId, substitutoId }) => api(`/app/itens/${itemId}/substituto`, { method: 'PUT', body: { substitutoId } }),
    onSuccess: (novo, { nome }) => {
      aplicar(novo)
      setItemSubstituindo(null)
      setMensagem(nome ? `Substituído por ${nome}` : 'Alimento original restaurado')
    },
    onError: (e) => setMensagem(e.message),
  })

  if (isLoading) return <Carregando />
  if (error) return <Erro erro={error} onTentar={refetch} />

  const refeicao = data.plano?.refeicoes.find((r) => r.id === id)
  if (!refeicao) {
    return (
      <Tela>
        <Cabecalho titulo="Refeição" />
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Texto estilo="legenda">Refeição não encontrada no seu plano ativo.</Texto>
        </Card>
      </Tela>
    )
  }

  const feito = data.consumidas.includes(refeicao.id)
  const totais = totaisRefeicao(refeicao, { usarSubstitutos: true })
  const item = itemSubstituindo && refeicao.itens.find((i) => i.id === itemSubstituindo)

  return (
    <Tela>
      <Cabecalho titulo={refeicao.nome} subtitulo={refeicao.horario} />

      <CardDestaque>
        <View style={[estilos.linha, { justifyContent: 'space-between' }]}>
          <View>
            <Texto estilo="rotulo" style={{ color: cores.primariaTexto, opacity: 0.8 }}>
              {feito ? 'Concluída' : 'Planejada'}
            </Texto>
            <Texto estilo="titulo" style={{ color: cores.primariaTexto, fontSize: 30 }}>
              {totais.kcal}
              <Texto style={{ color: cores.primariaTexto, opacity: 0.7, fontSize: 15 }}> kcal</Texto>
            </Texto>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Texto style={{ color: cores.primariaTexto, fontSize: 12 }}>C {Math.round(totais.carbo)}g</Texto>
            <Texto style={{ color: cores.primariaTexto, fontSize: 12 }}>P {Math.round(totais.proteina)}g</Texto>
            <Texto style={{ color: cores.primariaTexto, fontSize: 12 }}>G {Math.round(totais.gordura)}g</Texto>
          </View>
        </View>
        <Botao
          titulo={feito ? 'Marcar como não consumida' : 'Marcar como consumida'}
          variante={feito ? 'translucido' : 'claro'}
          icone={<Check size={16} color={feito ? cores.primariaTexto : cores.primaria} />}
          carregando={consumo.isPending}
          onPress={() => consumo.mutate(!feito)}
          style={{ marginTop: 14 }}
        />
      </CardDestaque>

      {mensagem ? (
        <Texto style={{ color: cores.primaria, fontWeight: '600', textAlign: 'center' }} onPress={() => setMensagem('')}>
          {mensagem}
        </Texto>
      ) : null}

      <Texto estilo="rotulo">Alimentos</Texto>
      {refeicao.itens.length === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <Texto estilo="legenda">Nenhum alimento nesta refeição.</Texto>
        </Card>
      )}
      {refeicao.itens.map((it) => {
        const { alimento, gramas, substituido } = itemEfetivo(it)
        const c = calcularAlimento(alimento, gramas)
        return (
          <Card key={it.id} style={[estilos.linha, { gap: 10, padding: 12 }]}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(242,226,208,0.6)', alignItems: 'center', justifyContent: 'center' }}>
              <Texto style={{ fontSize: 22 }}>{iconeAlimento(alimento)}</Texto>
            </View>
            <View style={{ flex: 1 }}>
              <Texto estilo="forte" numberOfLines={2}>
                {alimento.nome}
              </Texto>
              <Texto estilo="legenda" style={{ fontSize: 11 }}>
                {gramas}g · {c.kcal} kcal · C {c.carbo}g · P {c.proteina}g · G {c.gordura}g
              </Texto>
              {substituido && <Selo texto="substituto escolhido" style={{ marginTop: 4 }} />}
            </View>
            {it.substitutos.length > 0 ? (
              <Pressable
                onPress={() => setItemSubstituindo(it.id)}
                style={[estilos.linha, { gap: 4, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }]}
              >
                <Replace size={14} color={cores.texto} />
                <Texto style={{ fontSize: 12, fontWeight: '600' }}>Substituir</Texto>
              </Pressable>
            ) : (
              <Texto estilo="legenda" style={{ fontSize: 10 }}>
                sem subst.
              </Texto>
            )}
          </Card>
        )
      })}

      <Card style={[estilos.linha, { gap: 8, backgroundColor: 'rgba(242,226,208,0.4)', alignItems: 'flex-start' }]}>
        <Info size={16} color={cores.terracota} style={{ marginTop: 2 }} />
        <Texto style={{ flex: 1, fontSize: 12 }}>
          Toque em <Texto style={{ fontSize: 12, fontWeight: '700', color: cores.primaria }}>Substituir</Texto> para trocar um alimento por um
          equivalente nutricional aprovado pelo seu nutricionista.
        </Texto>
      </Card>

      <Modal visible={!!item} transparent animationType="slide" onRequestClose={() => setItemSubstituindo(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(22,35,22,0.4)', justifyContent: 'flex-end' }} onPress={() => setItemSubstituindo(null)}>
          <Pressable style={{ backgroundColor: cores.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }} onPress={() => {}}>
            {item && <FolhaSubstituicao item={item} refeicao={refeicao} carregando={substituir.isPending} onEscolher={(s) => substituir.mutate(s)} onFechar={() => setItemSubstituindo(null)} />}
          </Pressable>
        </Pressable>
      </Modal>
    </Tela>
  )
}

function FolhaSubstituicao({ item, refeicao, carregando, onEscolher, onFechar }) {
  const original = calcularAlimento(item.alimento, item.gramas)
  const opcoes = [
    { id: null, alimento: item.alimento, gramas: item.gramas, original: true },
    ...item.substitutos.map((s) => ({ id: s.id, alimento: s.alimento, gramas: s.gramas })),
  ]
  const atual = item.substitutoEscolhidoId ?? null

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: cores.borda, alignSelf: 'center', marginBottom: 6 }} />
      <Texto estilo="tituloPequeno" style={{ textAlign: 'center' }}>
        Substituir alimento
      </Texto>
      <Texto estilo="legenda" style={{ textAlign: 'center' }}>
        {refeicao.nome}
      </Texto>
      <Texto estilo="rotulo" style={{ marginTop: 10 }}>
        Opções equivalentes
      </Texto>
      {opcoes.map((o) => {
        const c = calcularAlimento(o.alimento, o.gramas)
        const diff = c.kcal - original.kcal
        const selecionado = o.id === atual
        return (
          <Pressable
            key={o.id ?? 'original'}
            disabled={carregando || selecionado}
            onPress={() => onEscolher({ itemId: item.id, substitutoId: o.id, nome: o.original ? null : o.alimento.nome })}
            style={[
              estilos.linha,
              { gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: selecionado ? cores.primaria : cores.borda },
              selecionado && { backgroundColor: 'rgba(46,89,41,0.06)' },
            ]}
          >
            <Texto style={{ fontSize: 24 }}>{iconeAlimento(o.alimento)}</Texto>
            <View style={{ flex: 1 }}>
              <Texto estilo="forte">{o.alimento.nome}</Texto>
              <Texto estilo="legenda">
                {o.gramas}g · {c.kcal} kcal
              </Texto>
            </View>
            {selecionado ? (
              <Selo texto="Atual" />
            ) : o.original ? (
              <View style={[estilos.linha, { gap: 4 }]}>
                <RotateCcw size={12} color={cores.textoSuave} />
                <Texto estilo="legenda" style={{ fontSize: 11 }}>
                  original
                </Texto>
              </View>
            ) : (
              <Selo
                texto={`${diff > 0 ? '+' : ''}${diff} kcal`}
                cor={Math.abs(diff) <= 20 ? cores.folha : cores.terracota}
                fundo={Math.abs(diff) <= 20 ? 'rgba(54,123,48,0.1)' : 'rgba(174,85,40,0.1)'}
              />
            )}
          </Pressable>
        )
      })}
      <Botao titulo="Manter atual" variante="contorno" onPress={onFechar} style={{ marginTop: 8 }} />
    </ScrollView>
  )
}
