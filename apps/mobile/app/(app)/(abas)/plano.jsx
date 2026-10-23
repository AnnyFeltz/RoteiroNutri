import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Check, ChevronRight } from 'lucide-react-native'
import { totaisRefeicao, totaisPlano, itemEfetivo, iconeAlimento } from '@RoteiroNutri/shared'
import { BarraProgresso, Cabecalho, Card, CardDestaque, Carregando, Erro, Tela, Texto, estilos } from '../../../components/ui'
import { usePlanoDoDia } from '../../../lib/consultas'
import { dataExtensa } from '../../../lib/formato'
import { cores, fonteMono } from '../../../lib/tema'

// RF18 / RN11 - Plano alimentar ativo (plano do dia)
export default function Plano() {
  const router = useRouter()
  const { data, isLoading, error, refetch, isRefetching } = usePlanoDoDia()

  if (isLoading) return <Carregando />
  if (error) return <Erro erro={error} onTentar={refetch} />

  const { plano, consumidas } = data
  if (!plano) {
    return (
      <Tela aoAtualizar={refetch} atualizando={isRefetching}>
        <Cabecalho titulo="Plano do Dia" voltar={false} />
        <Card style={{ alignItems: 'center', padding: 28 }}>
          <Texto estilo="legenda" style={{ fontSize: 14, textAlign: 'center' }}>
            Nenhum plano ativo. Seu nutricionista ainda não publicou um plano alimentar para você.
          </Texto>
        </Card>
      </Tela>
    )
  }

  const total = totaisPlano(plano, { usarSubstitutos: true })
  const consumido = plano.refeicoes.filter((r) => consumidas.includes(r.id)).reduce((s, r) => s + totaisRefeicao(r, { usarSubstitutos: true }).kcal, 0)
  const pct = plano.kcalAlvo ? Math.min(100, Math.round((consumido / plano.kcalAlvo) * 100)) : 0

  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <Cabecalho titulo="Plano do Dia" subtitulo={dataExtensa()} voltar={false} />

      <CardDestaque>
        <Texto estilo="rotulo" style={{ color: cores.primariaTexto, opacity: 0.8 }}>
          {plano.nome}
        </Texto>
        <View style={[estilos.linha, { justifyContent: 'space-between', marginTop: 4 }]}>
          <Texto estilo="titulo" style={{ color: cores.primariaTexto }}>
            {consumido}
            <Texto style={{ color: cores.primariaTexto, opacity: 0.7, fontSize: 15 }}> / {plano.kcalAlvo} kcal</Texto>
          </Texto>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Texto style={{ color: cores.primariaTexto, fontWeight: '700', fontSize: 12 }}>{pct}%</Texto>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <BarraProgresso pct={pct} cor={cores.branco} fundo="rgba(255,255,255,0.15)" altura={8} />
        </View>
        <View style={[estilos.linha, { gap: 8, marginTop: 14 }]}>
          {[
            ['CARB', plano.pctCarbo],
            ['PROT', plano.pctProteina],
            ['GORD', plano.pctGordura],
          ].map(([r, v]) => (
            <View key={r} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
              <Texto style={{ color: cores.primariaTexto, opacity: 0.8, fontSize: 10 }}>{r}</Texto>
              <Texto estilo="numero" style={{ color: cores.primariaTexto }}>
                {v}%
              </Texto>
            </View>
          ))}
        </View>
      </CardDestaque>

      <Texto estilo="rotulo" style={{ marginTop: 6 }}>
        Refeições do dia
      </Texto>

      {plano.refeicoes.map((r) => {
        const feito = consumidas.includes(r.id)
        const primeiro = r.itens[0] ? itemEfetivo(r.itens[0]).alimento : null
        return (
          <Pressable key={r.id} onPress={() => router.push(`/refeicao/${r.id}`)}>
            <Card style={[estilos.linha, { gap: 12 }, feito && { borderColor: 'rgba(46,89,41,0.4)', backgroundColor: '#f6f8f1' }]}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: feito ? 'rgba(46,89,41,0.15)' : 'rgba(242,226,208,0.6)',
                }}
              >
                <Texto style={{ fontSize: 26 }}>{iconeAlimento(primeiro)}</Texto>
              </View>
              <View style={{ flex: 1 }}>
                <View style={[estilos.linha, { gap: 6 }]}>
                  <Texto estilo="tituloPequeno">{r.nome}</Texto>
                  {feito && (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: cores.primaria, alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color={cores.primariaTexto} />
                    </View>
                  )}
                </View>
                <Texto estilo="legenda" style={{ marginTop: 2 }}>
                  <Texto estilo="legenda" style={{ fontFamily: fonteMono }}>
                    {r.horario}
                  </Texto>{' '}
                  · {totaisRefeicao(r, { usarSubstitutos: true }).kcal} kcal · {r.itens.length} alimentos
                </Texto>
              </View>
              <ChevronRight size={20} color={cores.textoSuave} />
            </Card>
          </Pressable>
        )
      })}

      <View style={[estilos.linha, { justifyContent: 'space-between', paddingHorizontal: 4 }]}>
        <Texto estilo="legenda" style={{ fontSize: 14 }}>
          Total planejado
        </Texto>
        <Texto estilo="tituloPequeno" style={{ color: cores.primaria }}>
          {total.kcal} kcal
        </Texto>
      </View>
    </Tela>
  )
}
