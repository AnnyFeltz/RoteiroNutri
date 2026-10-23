import { View } from 'react-native'
import { FileText, Flame, Activity } from 'lucide-react-native'
import { Cabecalho, Card, Carregando, Erro, Selo, Tela, Texto, estilos } from '../../../components/ui'
import { useHistoricoPlanos } from '../../../lib/consultas'
import { dataBR } from '../../../lib/formato'
import { cores } from '../../../lib/tema'

// Histórico de versões do plano alimentar
export default function Historico() {
  const { data, isLoading, error, refetch } = useHistoricoPlanos()
  if (isLoading) return <Carregando />
  if (error) return <Erro erro={error} onTentar={refetch} />

  return (
    <Tela aoAtualizar={refetch}>
      <Cabecalho titulo="Histórico de planos" />
      {data.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Texto estilo="legenda">Nenhum plano cadastrado ainda.</Texto>
        </Card>
      )}
      {data.map((p) => (
        <Card key={p.id} style={[estilos.linha, { gap: 12, alignItems: 'flex-start' }]}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(46,89,41,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color={cores.primaria} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={[estilos.linha, { gap: 8, flexWrap: 'wrap' }]}>
              <Texto estilo="forte">{p.nome}</Texto>
              {p.ativo ? <Selo texto="Ativo" /> : <Selo texto="Encerrado" cor={cores.textoSuave} fundo={cores.suave} />}
            </View>
            <Texto estilo="legenda" style={{ marginTop: 2 }}>
              Versão {p.versao} · criado em {dataBR(p.createdAt)}
            </Texto>
            <View style={[estilos.linha, { gap: 14, marginTop: 6 }]}>
              <View style={[estilos.linha, { gap: 4 }]}>
                <Flame size={12} color={cores.textoSuave} />
                <Texto estilo="legenda">{p.kcalAlvo} kcal/dia</Texto>
              </View>
              <View style={[estilos.linha, { gap: 4 }]}>
                <Activity size={12} color={cores.textoSuave} />
                <Texto estilo="legenda">{p.totalRefeicoes} refeições</Texto>
              </View>
            </View>
          </View>
        </Card>
      ))}
    </Tela>
  )
}
