import { View } from 'react-native'
import { Trophy, Lock } from 'lucide-react-native'
import { Cabecalho, Card, CardDestaque, Carregando, Selo, Tela, Texto, estilos } from '../../components/ui'
import { useEvolucao, usePerfil } from '../../lib/consultas'
import { conquistas } from '../../lib/conquistas'
import { cores } from '../../lib/tema'

export default function Conquistas() {
  const perfil = usePerfil()
  const evolucao = useEvolucao()
  if (perfil.isLoading || evolucao.isLoading) return <Carregando />

  const todas = conquistas(perfil.data, evolucao.data)
  const obtidas = todas.filter((c) => c.obtida)
  const bloqueadas = todas.filter((c) => !c.obtida)

  return (
    <Tela>
      <Cabecalho titulo="Conquistas" />
      <CardDestaque de={cores.terracota} para={cores.folhaEscura} style={{ alignItems: 'center' }}>
        <Trophy size={32} color={cores.branco} />
        <Texto estilo="titulo" style={{ color: cores.branco, marginTop: 6 }}>
          {obtidas.length}
          <Texto style={{ color: cores.branco, opacity: 0.7, fontSize: 18 }}>/{todas.length}</Texto>
        </Texto>
        <Texto style={{ color: cores.branco, opacity: 0.9, fontSize: 12 }}>conquistas desbloqueadas</Texto>
      </CardDestaque>

      <Texto estilo="rotulo">Desbloqueadas ({obtidas.length})</Texto>
      {obtidas.map((c) => (
        <Card key={c.titulo} style={[estilos.linha, { gap: 10, padding: 12 }]}>
          <Texto style={{ fontSize: 24 }}>{c.icone}</Texto>
          <View style={{ flex: 1 }}>
            <Texto estilo="forte">{c.titulo}</Texto>
            <Texto estilo="legenda" style={{ fontSize: 11 }}>
              {c.descricao}
            </Texto>
          </View>
          <Selo texto={c.categoria} cor={cores.texto} fundo={cores.suave} />
        </Card>
      ))}

      <Texto estilo="rotulo" style={{ marginTop: 6 }}>
        A conquistar ({bloqueadas.length})
      </Texto>
      {bloqueadas.map((c) => (
        <Card key={c.titulo} style={[estilos.linha, { gap: 10, padding: 12, opacity: 0.65, backgroundColor: cores.suave }]}>
          <View>
            <Texto style={{ fontSize: 24, opacity: 0.5 }}>{c.icone}</Texto>
            <Lock size={12} color={cores.textoSuave} style={{ position: 'absolute', right: -2, bottom: -2 }} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto estilo="forte">{c.titulo}</Texto>
            <Texto estilo="legenda" style={{ fontSize: 11 }}>
              {c.descricao}
            </Texto>
          </View>
        </Card>
      ))}
    </Tela>
  )
}
