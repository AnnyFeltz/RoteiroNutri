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
    <div className="pagina" style={{ gap: 20 }}>
      <div className="cabecalho-pagina nao-imprimir" style={{ alignItems: 'center' }}>
        <Link to={`/nutri/pacientes/${id}`} className="link-voltar">
          <ArrowLeft size={16} /> Voltar para {p.nome}
        </Link>
        <div className="acoes">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Imprimir / salvar PDF
          </Button>
          <Link to={`/nutri/pacientes/${id}/ficha`}>
            <Button variant="outline">
              <FileDown /> Ficha completa (PDF)
            </Button>
          </Link>
          <Button onClick={() => nav(`/nutri/pacientes/${id}/plano/${plano.id}/editar`)}>
            <Pencil /> {plano.ativo ? 'Editar plano' : 'Criar nova versão a partir desta'}
          </Button>
        </div>
      </div>

      <Card className="card-amplo card-destaque-verde folha-impressao">
        <div className="cabecalho-pagina">
          <div>
            <div className="linha-sm linha-quebra" style={{ marginBottom: 8 }}>
              <Badge variant="outline" className="mono">
                v{plano.versao}
              </Badge>
              {plano.ativo ? (
                <Badge>
                  <CheckCircle2 /> Ativo
                </Badge>
              ) : (
                <Badge variant="muted">Encerrado</Badge>
              )}
              <span className="texto-pequeno texto-suave">Criado em {dataHoraBR(plano.createdAt, true)}</span>
            </div>
            <h1 className="titulo-pagina">{plano.nome}</h1>
            <p className="texto-suave" style={{ marginTop: 4 }}>
              Paciente: {p.nome}
              {p.idade ? ` · ${p.idade} anos` : ''} · objetivo {objetivoLabel(p.objetivo).toLowerCase()}
            </p>
          </div>
          <div className="direita">
            <p className="texto-pequeno texto-suave">Calorias alvo</p>
            <p className="numero-grande cor-primaria">{plano.kcalAlvo}</p>
            <p className="texto-pequeno texto-suave">kcal/dia · soma: {total.kcal} kcal</p>
          </div>
        </div>
        <div className="grade grade-3" style={{ gap: 12, marginTop: 24 }}>
          <MacroPill rotulo="Carboidratos" pct={plano.pctCarbo} gramas={g.carbo} cor="var(--grafico-carbo)" />
          <MacroPill rotulo="Proteínas" pct={plano.pctProteina} gramas={g.proteina} cor="var(--primaria)" />
          <MacroPill rotulo="Gorduras" pct={plano.pctGordura} gramas={g.gordura} cor="var(--terracota)" />
        </div>
      </Card>

      <div className="pilha" style={{ gap: 16 }}>
        {plano.refeicoes.map((r) => (
          <Card key={r.id}>
            <div className="linha entre refeicao-topo">
              <div className="linha">
                <div className="icone-caixa icone-caixa-primaria">
                  <Apple />
                </div>
                <div>
                  <h3 className="titulo-card">{r.nome}</h3>
                  <p className="texto-pequeno texto-suave linha-sm" style={{ gap: 4 }}>
                    <Clock size={12} /> {r.horario}
                  </p>
                </div>
              </div>
              <div className="direita">
                <p className="mono cor-primaria" style={{ fontSize: 18 }}>
                  {totaisRefeicao(r).kcal} kcal
                </p>
                <p className="texto-pequeno texto-suave">
                  {r.itens.length} alimento{r.itens.length !== 1 && 's'}
                </p>
              </div>
            </div>
            {r.itens.length === 0 ? (
              <p className="texto-suave texto-italico">Sem alimentos nesta refeição.</p>
            ) : (
              <ul className="pilha-sm">
                {r.itens.map((item) => {
                  const c = calcularAlimento(item.alimento, item.gramas)
                  return (
                    <li key={item.id} className="item-plano">
                      <span className="emoji">{iconeAlimento(item.alimento)}</span>
                      <div className="expandir">
                        <p className="texto-medio">{item.alimento.nome}</p>
                        <p className="texto-pequeno texto-suave">
                          {item.gramas}g · {c.kcal} kcal · C {c.carbo}g · P {c.proteina}g · G {c.gordura}g
                        </p>
                        {item.substitutos.length > 0 && (
                          <p className="texto-pequeno texto-suave" style={{ marginTop: 4 }}>
                            <span className="cor-primaria texto-medio">
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
    <div className="indicador" style={{ padding: 12 }}>
      <div className="linha-sm texto-pequeno texto-suave">
        <span className="ponto" style={{ background: cor }} />
        {rotulo}
      </div>
      <p className="numero-pequeno" style={{ marginTop: 4 }}>
        {pct}%
      </p>
      <p className="texto-pequeno texto-suave">{gramas}g</p>
    </div>
  )
}
