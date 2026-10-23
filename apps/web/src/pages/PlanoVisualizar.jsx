import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Clock, Apple, Printer, CheckCircle2, FileDown } from 'lucide-react'
import { calcularAlimento, totaisRefeicao, totaisPlano, macroGramas, iconeAlimento } from '@RoteiroNutri/shared'
import { Badge, Button, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { dataHoraBR, objetivoLabel } from '../lib/format'

// RN11 / RF15 - Visualizar uma versão do plano (imprimir / PDF)
export default function PlanoVisualizar() {
  const { id, planoId } = useParams()
  const nav = useNavigate()
  const { data: plano, isLoading, error, refetch } = useQuery({ queryKey: ['planos', planoId], queryFn: () => api(`/planos/${planoId}`) })

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const p = plano.paciente
  const total = totaisPlano(plano)
  const g = macroGramas(plano.kcalAlvo, plano)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <Link to={`/nutri/pacientes/${id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar para {p.nome}
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir / salvar PDF
          </Button>
          <Link to={`/nutri/pacientes/${id}/ficha`}>
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Ficha completa (PDF)
            </Button>
          </Link>
          <Button onClick={() => nav(`/nutri/pacientes/${id}/plano/${plano.id}/editar`)}>
            <Pencil className="h-4 w-4" /> {plano.ativo ? 'Editar plano' : 'Criar nova versão a partir desta'}
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-card print-page">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="font-mono">
                v{plano.versao}
              </Badge>
              {plano.ativo ? (
                <Badge>
                  <CheckCircle2 className="h-3 w-3" /> Ativo
                </Badge>
              ) : (
                <Badge variant="muted">Encerrado</Badge>
              )}
              <span className="text-xs text-muted-foreground">Criado em {dataHoraBR(plano.createdAt, true)}</span>
            </div>
            <h1 className="text-3xl font-display font-semibold">{plano.nome}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paciente: {p.nome}
              {p.idade ? ` · ${p.idade} anos` : ''} · objetivo {objetivoLabel(p.objetivo).toLowerCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Calorias alvo</p>
            <p className="text-4xl font-display font-semibold text-primary">{plano.kcalAlvo}</p>
            <p className="text-xs text-muted-foreground">kcal/dia · soma: {total.kcal} kcal</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <MacroPill rotulo="Carboidratos" pct={plano.pctCarbo} gramas={g.carbo} cor="var(--chart-3)" />
          <MacroPill rotulo="Proteínas" pct={plano.pctProteina} gramas={g.proteina} cor="var(--primary)" />
          <MacroPill rotulo="Gorduras" pct={plano.pctGordura} gramas={g.gordura} cor="var(--terracotta)" />
        </div>
      </Card>

      <div className="space-y-4">
        {plano.refeicoes.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{r.nome}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.horario}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono text-primary">{totaisRefeicao(r).kcal} kcal</p>
                <p className="text-xs text-muted-foreground">
                  {r.itens.length} alimento{r.itens.length !== 1 && 's'}
                </p>
              </div>
            </div>
            {r.itens.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sem alimentos nesta refeição.</p>
            ) : (
              <ul className="space-y-2">
                {r.itens.map((item) => {
                  const c = calcularAlimento(item.alimento, item.gramas)
                  return (
                    <li key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                      <span className="text-xl">{iconeAlimento(item.alimento)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.alimento.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.gramas}g · {c.kcal} kcal · C {c.carbo}g · P {c.proteina}g · G {c.gordura}g
                        </p>
                        {item.substitutos.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-primary font-medium">
                              {item.substitutos.length} equivalente{item.substitutos.length > 1 && 's'}:
                            </span>{' '}
                            {item.substitutos.map((s) => `${s.alimento.nome} (${s.gramas}g)`).join(', ')}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function MacroPill({ rotulo, pct, gramas, cor }) {
  return (
    <div className="p-3 rounded-lg bg-background/60 border border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ background: cor }} />
        {rotulo}
      </div>
      <p className="text-xl font-display font-semibold mt-1">{pct}%</p>
      <p className="text-xs text-muted-foreground">{gramas}g</p>
    </div>
  )
}
