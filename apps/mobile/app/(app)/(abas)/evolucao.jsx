import { useState } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingDown, TrendingUp, Target, PencilLine } from 'lucide-react-native'
import { imc, classificacaoImc, progressoMeta, medidasPacienteSchema } from '@RoteiroNutri/shared'
import { BarraProgresso, Botao, Cabecalho, Campo, Card, Carregando, Erro, Selo, Tela, Texto, estilos } from '../../../components/ui'
import { Linha } from '../../../components/graficos'
import { api } from '../../../lib/api'
import { hojeLocal, useEvolucao, usePerfil } from '../../../lib/consultas'
import { validar } from '../../../lib/validacao'
import { dataBR, diaMes, mesCurto, num, sinal } from '../../../lib/formato'
import { cores } from '../../../lib/tema'

// RF21 - Gráficos de evolução (peso, composição corporal e adesão)
export default function Evolucao() {
  const queryClient = useQueryClient()
  const { width } = useWindowDimensions()
  const evolucao = useEvolucao()
  const perfil = usePerfil()
  const [registrando, setRegistrando] = useState(false)
  const [medidas, setMedidas] = useState({ peso: '', altura: '' })
  const [erro, setErro] = useState('')

  const registrar = useMutation({
    mutationFn: (dados) => api('/app/evolucao', { method: 'POST', body: dados }),
    onSuccess: (novo) => {
      queryClient.setQueryData(['evolucao'], novo)
      queryClient.invalidateQueries({ queryKey: ['perfil'] })
      setRegistrando(false)
      setErro('')
    },
    onError: (e) => setErro(e.message),
  })

  // O paciente atualiza peso e/ou altura (o nutricionista é notificado)
  const abrirAtualizacao = () => {
    const p = evolucao.data?.paciente
    setMedidas({ peso: p?.pesoAtualKg != null ? String(p.pesoAtualKg) : '', altura: p?.alturaCm != null ? String(p.alturaCm) : '' })
    setErro('')
    setRegistrando((x) => !x)
  }

  const salvarMedidas = () => {
    const p = evolucao.data.paciente
    const peso = medidas.peso.replace(',', '.')
    const altura = medidas.altura.replace(',', '.')
    const { dados, erro: invalido } = validar(medidasPacienteSchema, {
      data: hojeLocal(),
      pesoKg: peso && Number(peso) !== p.pesoAtualKg ? peso : undefined,
      alturaCm: altura && Number(altura) !== p.alturaCm ? altura : undefined,
    })
    if (invalido) return setErro(invalido === 'Informe o peso ou a altura' ? 'Altere o peso ou a altura para salvar.' : invalido)
    registrar.mutate(dados)
  }

  if (evolucao.isLoading || perfil.isLoading) return <Carregando />
  if (evolucao.error) return <Erro erro={evolucao.error} onTentar={evolucao.refetch} />

  const { paciente: p, registros, adesaoMensal } = evolucao.data
  const inicial = p.pesoInicialKg ?? registros[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const progresso = progressoMeta(inicial, p.pesoAtualKg, p.pesoMetaKg)
  const faltam = p.pesoAtualKg != null && p.pesoMetaKg != null ? Math.abs(p.pesoAtualKg - p.pesoMetaKg) : null
  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const Tendencia = delta != null && delta > 0 ? TrendingUp : TrendingDown
  const largura = Math.min(width, 700) - 72

  return (
    <Tela aoAtualizar={() => Promise.all([evolucao.refetch(), perfil.refetch()])} atualizando={evolucao.isRefetching}>
      <Cabecalho titulo="Sua Evolução" voltar={false} />

      <Botao
        titulo={registrando ? 'Fechar' : 'Atualizar dados'}
        variante={registrando ? 'contorno' : 'primario'}
        icone={registrando ? undefined : <PencilLine size={16} color={cores.primariaTexto} />}
        onPress={abrirAtualizacao}
      />

      {registrando && (
        <Card style={{ backgroundColor: 'rgba(242,226,208,0.4)', gap: 10 }}>
          <Texto estilo="forte">Atualizar peso e altura</Texto>
          <Texto estilo="legenda">O peso de hoje entra no seu histórico. Seu nutricionista é avisado da atualização.</Texto>
          <View style={[estilos.linha, { gap: 8 }]}>
            <Campo
              rotulo="Peso (kg)"
              style={{ flex: 1 }}
              value={medidas.peso}
              onChangeText={(v) => setMedidas({ ...medidas, peso: v })}
              keyboardType="decimal-pad"
              placeholder="ex: 62,5"
            />
            <Campo
              rotulo="Altura (cm)"
              style={{ flex: 1 }}
              value={medidas.altura}
              onChangeText={(v) => setMedidas({ ...medidas, altura: v })}
              keyboardType="decimal-pad"
              placeholder="ex: 168"
            />
          </View>
          {erro ? <Texto style={{ color: cores.perigo, fontSize: 13 }}>{erro}</Texto> : null}
          <Botao titulo="Salvar" onPress={salvarMedidas} carregando={registrar.isPending} />
        </Card>
      )}

      <Card style={{ alignItems: 'center' }}>
        <View style={[estilos.linha, { gap: 6 }]}>
          <Tendencia size={14} color={cores.textoSuave} />
          <Texto estilo="rotulo">Variação total</Texto>
        </View>
        <Texto estilo="titulo" style={{ fontSize: 44, marginTop: 4, color: delta != null && delta <= 0 ? cores.folha : cores.terracota }}>
          {delta != null ? sinal(delta) : '—'}
          <Texto estilo="legenda" style={{ fontSize: 18 }}>
            {' '}
            kg
          </Texto>
        </Texto>
        <Texto estilo="legenda">desde {dataBR(p.dataInicio)}</Texto>

        <View style={[estilos.linha, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: cores.borda, alignSelf: 'stretch' }]}>
          <Valor rotulo="Inicial" valor={inicial} />
          <Valor rotulo="Atual" valor={p.pesoAtualKg} destaque />
          <Valor rotulo="Meta" valor={p.pesoMetaKg} />
        </View>

        {p.pesoMetaKg != null && (
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
            <View style={[estilos.linha, { justifyContent: 'space-between', marginBottom: 4 }]}>
              <Texto estilo="legenda" style={{ fontSize: 11 }}>
                Progresso até a meta
              </Texto>
              <Texto style={{ fontSize: 11, fontWeight: '700', color: cores.primaria }}>{progresso}%</Texto>
            </View>
            <BarraProgresso pct={progresso} altura={8} cor={cores.folha} />
            {faltam != null && (
              <Texto estilo="legenda" style={{ fontSize: 11, marginTop: 6 }}>
                {faltam < 0.05 ? 'Meta atingida! 🎉' : `Faltam ${num(faltam)} kg para sua meta`}
              </Texto>
            )}
          </View>
        )}
      </Card>

      <Card>
        <Texto estilo="forte" style={{ marginBottom: 10 }}>
          Histórico de peso
        </Texto>
        {registros.length === 0 ? (
          <Texto estilo="legenda">Nenhuma pesagem registrada ainda. Toque em “Atualizar dados” para registrar.</Texto>
        ) : (
          <Linha largura={largura} dados={registros.map((r) => ({ valor: r.pesoKg, rotulo: diaMes(r.data) }))} />
        )}
      </Card>

      <Card>
        <Texto estilo="forte" style={{ marginBottom: 10 }}>
          Composição corporal
        </Texto>
        <Composicao rotulo="Massa magra" valor={p.massaMagraPct} cor={cores.primaria} />
        <View style={{ height: 10 }} />
        <Composicao rotulo="Massa gorda" valor={p.gorduraPct} cor={cores.terracota} />
        <View style={[estilos.linha, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: cores.borda }]}>
          <View style={{ flex: 1 }}>
            <Texto estilo="rotulo">IMC</Texto>
            <Texto estilo="numero">{valorImc ? valorImc.toFixed(1) : '—'}</Texto>
            {valorImc && <Selo texto={classificacaoImc(valorImc)} style={{ marginTop: 4 }} />}
          </View>
          <View style={{ flex: 1 }}>
            <Texto estilo="rotulo">Altura</Texto>
            <Texto estilo="numero">{p.alturaCm ? `${(p.alturaCm / 100).toFixed(2)} m` : '—'}</Texto>
          </View>
        </View>
      </Card>

      {adesaoMensal.some((m) => m.pct > 0) && (
        <Card>
          <Texto estilo="forte" style={{ marginBottom: 10 }}>
            Adesão ao plano (mensal)
          </Texto>
          <Linha largura={largura} altura={140} cor={cores.terracota} area={false} minimo={0} maximo={100} sufixo="%" dados={adesaoMensal.map((m) => ({ valor: m.pct, rotulo: mesCurto(m.mes) }))} />
        </Card>
      )}

      {perfil.data?.proximaConsulta && (
        <Card style={[estilos.linha, { gap: 10, backgroundColor: 'rgba(46,89,41,0.05)', borderColor: 'rgba(46,89,41,0.3)' }]}>
          <Target size={20} color={cores.primaria} />
          <View>
            <Texto estilo="forte">Próxima consulta</Texto>
            <Texto estilo="legenda">
              {dataBR(perfil.data.proximaConsulta.data)} às {perfil.data.proximaConsulta.horario}
            </Texto>
          </View>
        </Card>
      )}
    </Tela>
  )
}

function Valor({ rotulo, valor, destaque }) {
  return (
    <View style={{ flex: 1 }}>
      <Texto estilo="rotulo">{rotulo}</Texto>
      <Texto estilo="numero" style={destaque && { color: cores.primaria }}>
        {valor != null ? num(valor) : '—'}
        <Texto estilo="legenda"> kg</Texto>
      </Texto>
    </View>
  )
}

function Composicao({ rotulo, valor, cor }) {
  return (
    <View>
      <View style={[estilos.linha, { justifyContent: 'space-between', marginBottom: 4 }]}>
        <Texto estilo="legenda">{rotulo}</Texto>
        <Texto style={{ fontSize: 12, fontWeight: '600' }}>{valor != null ? `${valor}%` : '—'}</Texto>
      </View>
      <BarraProgresso pct={valor ?? 0} cor={cor} altura={10} />
    </View>
  )
}
