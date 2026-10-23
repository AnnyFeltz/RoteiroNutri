import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Apple, Database, Flame, Beef, Wheat, Droplet } from 'lucide-react'
import { iconeAlimento } from '@RoteiroNutri/shared'
import { Badge, Button, Card, Carregando, Input } from '../components/ui'
import { useCategoriasTaco, useDebounce } from '../lib/hooks'
import { api } from '../lib/api'

const POR_PAGINA = 40

// RF13 - Consulta livre à tabela TACO com busca e filtros
export default function Taco() {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [selecionado, setSelecionado] = useState(null)
  const termo = useDebounce(busca)

  const { data: categorias = [] } = useCategoriasTaco()
  const { data: stats } = useQuery({ queryKey: ['alimentos', 'estatisticas'], queryFn: () => api('/alimentos/estatisticas'), staleTime: Infinity })
  const { data, isLoading } = useQuery({
    queryKey: ['alimentos', { termo, categoria, pagina }],
    queryFn: () => api('/alimentos', { query: { busca: termo, categoria, pagina, limite: POR_PAGINA } }),
    placeholderData: (anterior) => anterior,
  })
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / POR_PAGINA)) : 1

  const filtrar = (cat) => {
    setCategoria(cat)
    setPagina(1)
  }

  return (
    <div className="pagina">
      <div className="cabecalho-pagina" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="titulo-pagina titulo-icone">
            <Database size={28} /> Tabela TACO
          </h1>
          <p className="subtitulo-pagina">Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP) — valores por 100g.</p>
        </div>
        {stats && (
          <div className="acoes" style={{ gap: 12 }}>
            <MiniCard rotulo="Alimentos" valor={stats.total} destaque />
            <MiniCard rotulo="Categorias" valor={stats.categorias} />
            <MiniCard rotulo="Kcal média" valor={stats.kcalMedia} />
          </div>
        )}
      </div>

      <Card className="card-compacto">
        <div className="busca">
          <Search />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar alimento (ex: arroz, frango, banana...)"
          />
        </div>
        <div className="acoes" style={{ marginTop: 12 }}>
          <Button size="sm" variant={categoria === '' ? 'default' : 'outline'} onClick={() => filtrar('')}>
            Todos
          </Button>
          {categorias.map((c) => (
            <Button key={c.nome} size="sm" variant={categoria === c.nome ? 'default' : 'outline'} onClick={() => filtrar(c.nome)}>
              {c.nome} <span style={{ opacity: 0.6 }}>({c.total})</span>
            </Button>
          ))}
        </div>
      </Card>

      <div className="taco-layout">
        <Card className="card-sem-espaco rolagem-x">
          {isLoading ? (
            <Carregando />
          ) : (
            <>
              <table className="tabela tabela-maiuscula" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Alimento</th>
                    <th className="direita">Kcal</th>
                    <th className="direita">Carb</th>
                    <th className="direita">Prot</th>
                    <th className="direita">Gord</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itens.map((a) => (
                    <tr key={a.id} onClick={() => setSelecionado(a)} className={`linha-clicavel ${selecionado?.id === a.id ? 'linha-selecionada' : ''}`}>
                      <td>
                        <div className="linha">
                          <span className="emoji">{iconeAlimento(a)}</span>
                          <div>
                            <p className="texto-medio">{a.nome}</p>
                            <p className="texto-pequeno texto-suave">{a.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="num">{a.kcal100g}</td>
                      <td className="num-suave">{a.carboidratoG}g</td>
                      <td className="num-suave">{a.proteinaG}g</td>
                      <td className="num-suave">{a.gorduraG}g</td>
                    </tr>
                  ))}
                  {data.itens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="tabela-vazia">
                        Nenhum alimento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="paginacao">
                <span>
                  {data.total} alimento{data.total !== 1 && 's'} · página {pagina} de {totalPaginas}
                </span>
                <div className="acoes">
                  <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="fixo-no-topo">
          {selecionado ? (
            <Card className="pilha">
              <div className="linha alinhar-topo">
                <span className="emoji-grande">{iconeAlimento(selecionado)}</span>
                <div className="expandir">
                  <h3 className="titulo-secao">{selecionado.nome}</h3>
                  <Badge variant="secondary" style={{ marginTop: 6 }}>
                    {selecionado.categoria}
                  </Badge>
                </div>
              </div>
              <div className="taco-energia">
                <p className="texto-pequeno texto-suave">Energia por 100g</p>
                <p className="numero-medio cor-primaria linha-sm" style={{ justifyContent: 'center' }}>
                  <Flame size={20} /> {selecionado.kcal100g} <span className="texto-suave" style={{ fontSize: 16, fontWeight: 400 }}>kcal</span>
                </p>
              </div>
              <div className="pilha" style={{ gap: 10 }}>
                <MacroLinha icone={<Wheat />} cor="var(--grafico-carbo)" rotulo="Carboidratos" valor={`${selecionado.carboidratoG}g`} />
                <MacroLinha icone={<Beef />} cor="var(--primaria)" rotulo="Proteínas" valor={`${selecionado.proteinaG}g`} />
                <MacroLinha icone={<Droplet />} cor="var(--terracota)" rotulo="Gorduras" valor={`${selecionado.gorduraG}g`} />
                <MacroLinha icone={<Apple />} cor="var(--folha)" rotulo="Fibras" valor={`${selecionado.fibraG}g`} />
                <MacroLinha icone={<Database />} cor="var(--grafico-5)" rotulo="Sódio" valor={`${selecionado.sodioMg}mg`} />
              </div>
              <p className="texto-pequeno texto-suave separador-topo" style={{ paddingTop: 8 }}>
                Código TACO: <span className="mono">{selecionado.id}</span>
              </p>
            </Card>
          ) : (
            <Card className="card-vazio">
              <Database />
              Selecione um alimento para ver os detalhes nutricionais.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniCard({ rotulo, valor, destaque }) {
  return (
    <Card className="mini-card">
      <p className="texto-pequeno texto-suave">{rotulo}</p>
      <p className={`numero-pequeno ${destaque ? 'cor-primaria' : ''}`}>{valor}</p>
    </Card>
  )
}

function MacroLinha({ icone, cor, rotulo, valor }) {
  return (
    <div className="linha">
      <div className="icone-caixa" style={{ width: 32, height: 32, background: `color-mix(in oklab, ${cor} 15%, transparent)`, color: cor }}>
        {icone}
      </div>
      <span className="expandir">{rotulo}</span>
      <span className="mono texto-medio">{valor}</span>
    </div>
  )
}
