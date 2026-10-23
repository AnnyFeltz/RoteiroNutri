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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-semibold flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" /> Tabela TACO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tabela Brasileira de Composição de Alimentos (NEPA/UNICAMP) — valores por 100g.</p>
        </div>
        {stats && (
          <div className="flex gap-3">
            <MiniCard rotulo="Alimentos" valor={stats.total} destaque />
            <MiniCard rotulo="Categorias" valor={stats.categorias} />
            <MiniCard rotulo="Kcal média" valor={stats.kcalMedia} />
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar alimento (ex: arroz, frango, banana...)"
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant={categoria === '' ? 'default' : 'outline'} onClick={() => filtrar('')}>
            Todos
          </Button>
          {categorias.map((c) => (
            <Button key={c.nome} size="sm" variant={categoria === c.nome ? 'default' : 'outline'} onClick={() => filtrar(c.nome)}>
              {c.nome} <span className="opacity-60">({c.total})</span>
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <Card className="overflow-x-auto">
          {isLoading ? (
            <Carregando />
          ) : (
            <>
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Alimento</th>
                    <th className="text-right px-3 py-3 font-medium">Kcal</th>
                    <th className="text-right px-3 py-3 font-medium">Carb</th>
                    <th className="text-right px-3 py-3 font-medium">Prot</th>
                    <th className="text-right px-4 py-3 font-medium">Gord</th>
                  </tr>
                </thead>
                <tbody>
                  {data.itens.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelecionado(a)}
                      className={`border-t border-border cursor-pointer transition-colors ${selecionado?.id === a.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{iconeAlimento(a)}</span>
                          <div>
                            <p className="font-medium">{a.nome}</p>
                            <p className="text-xs text-muted-foreground">{a.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-3 py-2.5 font-mono">{a.kcal100g}</td>
                      <td className="text-right px-3 py-2.5 font-mono text-muted-foreground">{a.carboidratoG}g</td>
                      <td className="text-right px-3 py-2.5 font-mono text-muted-foreground">{a.proteinaG}g</td>
                      <td className="text-right px-4 py-2.5 font-mono text-muted-foreground">{a.gorduraG}g</td>
                    </tr>
                  ))}
                  {data.itens.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                        Nenhum alimento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span>
                  {data.total} alimento{data.total !== 1 && 's'} · página {pagina} de {totalPaginas}
                </span>
                <div className="flex gap-2">
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

        <div className="lg:sticky lg:top-24 self-start">
          {selecionado ? (
            <Card className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl">{iconeAlimento(selecionado)}</span>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg leading-tight">{selecionado.nome}</h3>
                  <Badge variant="secondary" className="mt-1.5">
                    {selecionado.categoria}
                  </Badge>
                </div>
              </div>
              <div className="text-center py-3 border-y border-border">
                <p className="text-xs text-muted-foreground">Energia por 100g</p>
                <p className="text-3xl font-display font-semibold text-primary flex items-center justify-center gap-1.5">
                  <Flame className="h-5 w-5" /> {selecionado.kcal100g} <span className="text-base text-muted-foreground font-normal">kcal</span>
                </p>
              </div>
              <div className="space-y-2.5">
                <MacroLinha icone={<Wheat className="h-4 w-4" />} cor="var(--chart-3)" rotulo="Carboidratos" valor={`${selecionado.carboidratoG}g`} />
                <MacroLinha icone={<Beef className="h-4 w-4" />} cor="var(--primary)" rotulo="Proteínas" valor={`${selecionado.proteinaG}g`} />
                <MacroLinha icone={<Droplet className="h-4 w-4" />} cor="var(--terracotta)" rotulo="Gorduras" valor={`${selecionado.gorduraG}g`} />
                <MacroLinha icone={<Apple className="h-4 w-4" />} cor="var(--leaf)" rotulo="Fibras" valor={`${selecionado.fibraG}g`} />
                <MacroLinha icone={<Database className="h-4 w-4" />} cor="var(--chart-5)" rotulo="Sódio" valor={`${selecionado.sodioMg}mg`} />
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Código TACO: <span className="font-mono">{selecionado.id}</span>
              </p>
            </Card>
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-40" />
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
    <Card className="px-4 py-2.5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={`text-xl font-display font-semibold ${destaque ? 'text-primary' : ''}`}>{valor}</p>
    </Card>
  )
}

function MacroLinha({ icone, cor, rotulo, valor }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in oklab, ${cor} 15%, transparent)`, color: cor }}>
        {icone}
      </div>
      <span className="text-sm flex-1">{rotulo}</span>
      <span className="font-mono font-medium">{valor}</span>
    </div>
  )
}
