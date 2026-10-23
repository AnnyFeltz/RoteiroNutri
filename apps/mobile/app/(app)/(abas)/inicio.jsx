import { Image, Pressable, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Timer, ChevronRight, Flame, CalendarCheck, TrendingDown, Sparkles, Leaf } from 'lucide-react-native'
import { macroGramas, totaisRefeicao, itemEfetivo } from '@RoteiroNutri/shared'
import { Avatar, BarraProgresso, Card, CardDestaque, Carregando, Erro, Tela, Texto, estilos } from '../../../components/ui'
import { Anel, Barras } from '../../../components/graficos'
import { useEvolucao, usePerfil, usePlanoDoDia } from '../../../lib/consultas'
import { diaMes, num, saudacao } from '../../../lib/formato'
import { cores, fonteMono } from '../../../lib/tema'

const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Dashboard do paciente (RNF01 - painel fluido no mobile)
export default function Inicio() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const perfil = usePerfil()
  const dia = usePlanoDoDia()
  const evolucao = useEvolucao()

  if (perfil.isLoading || dia.isLoading) return <Carregando />
  if (perfil.error) return <Erro erro={perfil.error} onTentar={perfil.refetch} />
  if (dia.error) return <Erro erro={dia.error} onTentar={dia.refetch} />

  const p = perfil.data
  const { plano, consumidas } = dia.data
  const refeicoes = plano?.refeicoes ?? []
  const feitas = refeicoes.filter((r) => consumidas.includes(r.id))
  const proxima = refeicoes.find((r) => !consumidas.includes(r.id))

  // macros consumidos hoje (considera os substitutos escolhidos)
  const consumido = feitas.reduce(
    (acc, r) => {
      const t = totaisRefeicao(r, { usarSubstitutos: true })
      return { kcal: acc.kcal + t.kcal, carbo: acc.carbo + t.carbo, proteina: acc.proteina + t.proteina, gordura: acc.gordura + t.gordura }
    },
    { kcal: 0, carbo: 0, proteina: 0, gordura: 0 },
  )
  const meta = plano ? macroGramas(plano.kcalAlvo, plano) : { carbo: 0, proteina: 0, gordura: 0 }
  const semana = evolucao.data?.adesaoSemanal ?? []
  const mediaSemana = evolucao.data?.adesaoMediaSemanal
  const larguraGrafico = Math.min(width, 700) - 72

  const atualizar = () => Promise.all([perfil.refetch(), dia.refetch(), evolucao.refetch()])

  return (
    <Tela aoAtualizar={atualizar} atualizando={perfil.isRefetching || dia.isRefetching}>
      <Image source={require('../../../assets/logo-roteiro-nutri.png')} style={{ width: 120, height: 36 }} resizeMode="contain" />

      <View>
        <Texto estilo="rotulo">{saudacao()},</Texto>
        <Texto estilo="titulo">{p.nome.split(' ')[0]} 👋</Texto>
        <Texto estilo="legenda" style={{ fontSize: 14 }}>
          Vamos para mais um dia de conquistas.
        </Texto>
      </View>

      {!plano ? (
        <Card>
          <Texto estilo="forte">Você ainda não tem um plano alimentar ativo.</Texto>
          <Texto estilo="legenda" style={{ marginTop: 4 }}>
            Assim que seu nutricionista publicar o plano, ele aparece aqui automaticamente.
          </Texto>
        </Card>
      ) : (
        <Card style={[estilos.linha, { gap: 18 }]}>
          <Anel pct={plano.kcalAlvo ? (consumido.kcal / plano.kcalAlvo) * 100 : 0}>
            <Texto estilo="legenda" style={{ fontSize: 10 }}>
              Kcal
            </Texto>
            <Texto estilo="numero">{consumido.kcal}</Texto>
            <Texto estilo="legenda" style={{ fontSize: 10 }}>
              / {plano.kcalAlvo}
            </Texto>
          </Anel>
          <View style={{ flex: 1, gap: 10 }}>
            <BarraMacro rotulo="Carboidratos" cor={cores.carbo} valor={consumido.carbo} max={meta.carbo} />
            <BarraMacro rotulo="Proteínas" cor={cores.primaria} valor={consumido.proteina} max={meta.proteina} />
            <BarraMacro rotulo="Gorduras" cor={cores.terracota} valor={consumido.gordura} max={meta.gordura} />
          </View>
        </Card>
      )}

      {proxima && (
        <Pressable onPress={() => router.push(`/refeicao/${proxima.id}`)}>
          <CardDestaque style={[estilos.linha, { gap: 12 }]}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Timer size={24} color={cores.primariaTexto} />
            </View>
            <View style={{ flex: 1 }}>
              <Texto style={{ color: cores.primariaTexto, opacity: 0.8, fontSize: 12 }}>Próxima refeição</Texto>
              <Texto estilo="tituloPequeno" style={{ color: cores.primariaTexto, fontSize: 19 }}>
                {proxima.nome}
              </Texto>
              <Texto style={{ color: cores.primariaTexto, opacity: 0.8, fontSize: 12 }}>
                {proxima.itens.length} alimentos · {totaisRefeicao(proxima, { usarSubstitutos: true }).kcal} kcal
              </Texto>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texto style={{ color: cores.primariaTexto, fontSize: 22, fontFamily: fonteMono }}>{proxima.horario}</Texto>
              <ChevronRight size={16} color={cores.primariaTexto} />
            </View>
          </CardDestaque>
        </Pressable>
      )}

      <View style={[estilos.linha, { gap: 10 }]}>
        <MiniCard icone={<Flame size={14} color={cores.terracota} />} rotulo="Sequência" valor={`${evolucao.data?.sequenciaDias ?? 0} dias`} />
        <MiniCard icone={<TrendingDown size={14} color={cores.folha} />} rotulo="Peso" valor={p.pesoAtualKg ? `${num(p.pesoAtualKg)} kg` : '—'} />
        <MiniCard icone={<CalendarCheck size={14} color={cores.primaria} />} rotulo="Consulta" valor={p.proximaConsulta ? diaMes(p.proximaConsulta.data) : '—'} />
      </View>

      {plano && (
        <Card>
          <View style={[estilos.linha, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Texto estilo="forte">Refeições de hoje</Texto>
            <Texto estilo="legenda">
              {feitas.length}/{refeicoes.length} concluídas
            </Texto>
          </View>
          <View style={[estilos.linha, { gap: 6, marginBottom: 12 }]}>
            {refeicoes.map((r) => (
              <View key={r.id} style={{ flex: 1, height: 6, borderRadius: 6, backgroundColor: consumidas.includes(r.id) ? cores.primaria : cores.suave }} />
            ))}
          </View>
          <View style={{ gap: 8 }}>
            {refeicoes.map((r) => {
              const feito = consumidas.includes(r.id)
              const primeiro = r.itens[0] ? itemEfetivo(r.itens[0]).alimento : null
              return (
                <Pressable key={r.id} onPress={() => router.push(`/refeicao/${r.id}`)} style={[estilos.linha, { gap: 10 }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: feito ? cores.primaria : cores.borda }} />
                  <Texto estilo="legenda" style={{ width: 44, fontFamily: fonteMono }}>
                    {r.horario}
                  </Texto>
                  <Texto style={{ flex: 1, textDecorationLine: feito ? 'line-through' : 'none', color: feito ? cores.textoSuave : cores.texto }}>{r.nome}</Texto>
                  <Texto estilo="legenda" numberOfLines={1} style={{ maxWidth: 120 }}>
                    {primeiro?.nome.split(',')[0] ?? '—'}
                  </Texto>
                </Pressable>
              )
            })}
          </View>
        </Card>
      )}

      {plano && semana.length > 0 && (
        <Card>
          <View style={[estilos.linha, { justifyContent: 'space-between', marginBottom: 8 }]}>
            <View>
              <Texto estilo="forte">Adesão semanal</Texto>
              <Texto estilo="legenda">média {mediaSemana ?? 0}%</Texto>
            </View>
            <View style={[estilos.linha, { gap: 4 }]}>
              <Texto estilo="tituloPequeno" style={{ color: classificar(mediaSemana).cor }}>
                {classificar(mediaSemana).texto}
              </Texto>
              <Leaf size={16} color={classificar(mediaSemana).cor} />
            </View>
          </View>
          <Barras largura={larguraGrafico} dados={semana.map((d) => ({ valor: d.pct, rotulo: DIAS_CURTOS[new Date(`${d.data}T12:00:00`).getDay()] }))} />
        </Card>
      )}

      {p.nutricionista && (
        <Card style={[estilos.linha, { gap: 12, backgroundColor: 'rgba(242,226,208,0.5)' }]}>
          <Avatar nome={p.nutricionista.nome} foto={p.nutricionista.foto} />
          <View style={{ flex: 1 }}>
            <Texto estilo="legenda">Seu nutricionista</Texto>
            <Texto estilo="forte">{p.nutricionista.nome}</Texto>
            <Texto estilo="legenda">{p.nutricionista.crn}</Texto>
          </View>
          <Sparkles size={20} color={cores.terracota} />
        </Card>
      )}

      {plano && (
        <Pressable onPress={() => router.push('/plano')}>
          <Card style={[estilos.linha, { justifyContent: 'space-between', borderColor: 'rgba(46,89,41,0.3)' }]}>
            <Texto style={{ color: cores.primaria, fontWeight: '600' }}>Ver plano completo do dia</Texto>
            <ChevronRight size={20} color={cores.primaria} />
          </Card>
        </Pressable>
      )}
    </Tela>
  )
}

function classificar(media) {
  if (media == null) return { texto: '—', cor: cores.textoSuave }
  if (media >= 80) return { texto: 'Ótima', cor: cores.folha }
  if (media >= 50) return { texto: 'Boa', cor: cores.carbo }
  return { texto: 'Pode melhorar', cor: cores.terracota }
}

function BarraMacro({ rotulo, valor, max, cor }) {
  return (
    <View>
      <View style={[estilos.linha, { justifyContent: 'space-between', marginBottom: 4 }]}>
        <Texto estilo="legenda" style={{ fontSize: 11 }}>
          {rotulo}
        </Texto>
        <Texto style={{ fontSize: 11, fontWeight: '600' }}>
          {Math.round(valor)}/{max}g
        </Texto>
      </View>
      <BarraProgresso pct={max ? (valor / max) * 100 : 0} cor={cor} />
    </View>
  )
}

function MiniCard({ icone, rotulo, valor }) {
  return (
    <Card style={{ flex: 1, padding: 12 }}>
      <View style={[estilos.linha, { gap: 4 }]}>
        {icone}
        <Texto estilo="rotulo" style={{ fontSize: 9 }}>
          {rotulo}
        </Texto>
      </View>
      <Texto estilo="numero" style={{ fontSize: 16, marginTop: 4 }}>
        {valor}
      </Texto>
    </Card>
  )
}
