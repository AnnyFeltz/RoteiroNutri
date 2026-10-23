import { Linking, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { LogOut, AlertTriangle, Target, Ruler, Mail, Phone, CalendarCheck, FileText, ChevronRight, Shield, Pencil } from 'lucide-react-native'
import { imc, classificacaoImc } from '@RoteiroNutri/shared'
import { Avatar, Botao, Cabecalho, Card, CardDestaque, Carregando, Erro, Tela, Texto, estilos } from '../../../components/ui'
import { useAuth } from '../../../lib/auth'
import { usePerfil } from '../../../lib/consultas'
import { dataBR, mesAno, num, objetivoLabel } from '../../../lib/formato'
import { cores } from '../../../lib/tema'

// RF17 / RN10 - Dados cadastrais e clínicos do paciente
export default function Perfil() {
  const router = useRouter()
  const { sair } = useAuth()
  const { data: p, isLoading, error, refetch, isRefetching } = usePerfil()

  if (isLoading) return <Carregando />
  if (error) return <Erro erro={error} onTentar={refetch} />

  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const n = p.nutricionista

  return (
    <Tela aoAtualizar={refetch} atualizando={isRefetching}>
      <Cabecalho titulo="Meu Perfil" voltar={false} />

      <CardDestaque style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Avatar nome={p.nome} cor={p.avatarCor || cores.terracota} tamanho={80} />
        <Texto estilo="tituloPequeno" style={{ color: cores.primariaTexto, fontSize: 20, marginTop: 10 }}>
          {p.nome}
        </Texto>
        <Texto style={{ color: cores.primariaTexto, opacity: 0.8, fontSize: 13 }}>{p.email}</Texto>
        <View style={[estilos.linha, { gap: 8, marginTop: 10 }]}>
          <Pilula texto={objetivoLabel(p.objetivo)} />
          {p.dataInicio && <Pilula texto={`Desde ${mesAno(p.dataInicio)}`} />}
        </View>
        <Pressable
          onPress={() => router.push('/conta/editar')}
          style={[estilos.linha, { gap: 6, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }]}
        >
          <Pencil size={12} color={cores.primariaTexto} />
          <Texto style={{ color: cores.primariaTexto, fontSize: 12 }}>Editar perfil</Texto>
        </Pressable>
      </CardDestaque>

      <View style={[estilos.linha, { gap: 10 }]}>
        <Mini rotulo="Peso" valor={p.pesoAtualKg != null ? `${num(p.pesoAtualKg)} kg` : '—'} />
        <Mini rotulo="IMC" valor={valorImc ? valorImc.toFixed(1) : '—'} />
        <Mini rotulo="Meta" valor={p.pesoMetaKg != null ? `${num(p.pesoMetaKg)} kg` : '—'} />
      </View>

      {n && (
        <Card>
          <Texto estilo="rotulo" style={{ marginBottom: 10 }}>
            Seu nutricionista
          </Texto>
          <View style={[estilos.linha, { gap: 12 }]}>
            <Avatar nome={n.nome} tamanho={48} />
            <View style={{ flex: 1 }}>
              <Texto estilo="forte">{n.nome}</Texto>
              <Texto estilo="legenda">{n.crn}</Texto>
            </View>
          </View>
          <View style={[estilos.linha, { gap: 8, marginTop: 12 }]}>
            <Botao titulo="E-mail" variante="contorno" style={{ flex: 1, minHeight: 38 }} icone={<Mail size={14} color={cores.texto} />} onPress={() => Linking.openURL(`mailto:${n.email}`)} />
            {n.telefone ? (
              <Botao
                titulo="Ligar"
                variante="contorno"
                style={{ flex: 1, minHeight: 38 }}
                icone={<Phone size={14} color={cores.texto} />}
                onPress={() => Linking.openURL(`tel:${n.telefone.replace(/[^\d+]/g, '')}`)}
              />
            ) : null}
          </View>
        </Card>
      )}

      <Card>
        <Texto estilo="rotulo" style={{ marginBottom: 4 }}>
          Dados pessoais
        </Texto>
        <Linha rotulo="Idade" valor={p.idade ? `${p.idade} anos` : '—'} />
        <Linha rotulo="Sexo" valor={p.sexo === 'F' ? 'Feminino' : p.sexo === 'M' ? 'Masculino' : '—'} />
        <Linha rotulo="Altura" valor={p.alturaCm ? `${p.alturaCm} cm` : '—'} />
        <Linha rotulo="Peso atual" valor={p.pesoAtualKg != null ? `${num(p.pesoAtualKg)} kg` : '—'} />
        <Linha rotulo="Classificação" valor={valorImc ? classificacaoImc(valorImc) : '—'} ultima />
      </Card>

      <Card style={{ gap: 12 }}>
        <Texto estilo="rotulo">Objetivos e restrições</Texto>
        <Item icone={<Target size={16} color={cores.primaria} />} titulo="Objetivo" texto={objetivoLabel(p.objetivo)} />
        <Item icone={<Ruler size={16} color={cores.folha} />} titulo="Meta de peso" texto={p.pesoMetaKg != null ? `${num(p.pesoMetaKg)} kg` : '—'} />
        <Item icone={<AlertTriangle size={16} color={cores.terracota} />} titulo="Alergias e intolerâncias" texto={p.alergias || 'Nenhuma'} />
        <Item icone={<Shield size={16} color={cores.textoSuave} />} titulo="Histórico clínico" texto={p.historicoClinico || '—'} />
      </Card>

      {p.planoAtivo && (
        <Card>
          <Texto estilo="rotulo" style={{ marginBottom: 6 }}>
            Plano alimentar atual
          </Texto>
          <Texto estilo="forte">{p.planoAtivo.nome}</Texto>
          <Texto estilo="legenda" style={{ marginTop: 2 }}>
            Versão {p.planoAtivo.versao} · desde {dataBR(p.planoAtivo.createdAt)} · {p.planoAtivo.kcalAlvo} kcal/dia
          </Texto>
        </Card>
      )}

      <Card style={[estilos.linha, { gap: 12, backgroundColor: 'rgba(242,226,208,0.5)' }]}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(46,89,41,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarCheck size={20} color={cores.primaria} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto estilo="legenda">Próxima consulta</Texto>
          <Texto estilo="forte">
            {p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} às ${p.proximaConsulta.horario} · ${p.proximaConsulta.tipo}` : 'Nenhuma consulta agendada'}
          </Texto>
        </View>
      </Card>

      <Card style={{ padding: 6 }}>
        <ItemMenu icone={<FileText size={16} color={cores.textoSuave} />} rotulo="Histórico de planos" onPress={() => router.push('/conta/historico')} />
        <ItemMenu icone={<Shield size={16} color={cores.textoSuave} />} rotulo="Privacidade e senha" onPress={() => router.push('/conta/privacidade')} />
      </Card>

      <Botao titulo="Sair" variante="contorno" icone={<LogOut size={16} color={cores.texto} />} onPress={() => sair()} />
      <Texto estilo="legenda" style={{ textAlign: 'center', fontSize: 10 }}>
        Roteiro Nutri · v1.0
      </Texto>
    </Tela>
  )
}

function Pilula({ texto }) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Texto style={{ color: cores.primariaTexto, fontSize: 12, fontWeight: '600' }}>{texto}</Texto>
    </View>
  )
}

function Mini({ rotulo, valor }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', padding: 12 }}>
      <Texto estilo="rotulo">{rotulo}</Texto>
      <Texto estilo="numero">{valor}</Texto>
    </Card>
  )
}

function Linha({ rotulo, valor, ultima }) {
  return (
    <View style={[estilos.linha, { justifyContent: 'space-between', paddingVertical: 10 }, !ultima && { borderBottomWidth: 1, borderBottomColor: cores.borda }]}>
      <Texto estilo="legenda" style={{ fontSize: 14 }}>
        {rotulo}
      </Texto>
      <Texto estilo="forte">{valor}</Texto>
    </View>
  )
}

function Item({ icone, titulo, texto }) {
  return (
    <View style={[estilos.linha, { gap: 10, alignItems: 'flex-start' }]}>
      <View style={{ marginTop: 2 }}>{icone}</View>
      <View style={{ flex: 1 }}>
        <Texto estilo="legenda">{titulo}</Texto>
        <Texto>{texto}</Texto>
      </View>
    </View>
  )
}

function ItemMenu({ icone, rotulo, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [estilos.linha, { gap: 12, padding: 12, borderRadius: 10 }, pressed && { backgroundColor: cores.suave }]}>
      {icone}
      <Texto style={{ flex: 1 }}>{rotulo}</Texto>
      <ChevronRight size={16} color={cores.textoSuave} />
    </Pressable>
  )
}
