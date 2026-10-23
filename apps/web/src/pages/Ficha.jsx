import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, FileDown, ClipboardList, Printer } from 'lucide-react'
import { imc, classificacaoImc, calcularAlimento, totaisRefeicao, iconeAlimento } from '@RoteiroNutri/shared'
import { Button, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { dataBR, dataHoraBR, objetivoLabel, sinal } from '../lib/format'

// Ficha médica/nutricional do paciente (visualização + exportação PDF)
export default function Ficha() {
  const { id } = useParams()
  const { nutricionista } = useAuth()
  const paciente = useQuery({ queryKey: ['pacientes', id], queryFn: () => api(`/pacientes/${id}`) })
  const versoes = useQuery({
    queryKey: ['pacientes', id, 'planos'],
    queryFn: () => api(`/pacientes/${id}/planos`),
    enabled: !!paciente.data && !paciente.data.planoAtivo,
  })
  // sem plano ativo (ex: paciente inativo): usa a versão mais recente
  const ultimaVersaoId = versoes.data?.[0]?.id
  const ultimaVersao = useQuery({
    queryKey: ['planos', ultimaVersaoId],
    queryFn: () => api(`/planos/${ultimaVersaoId}`),
    enabled: !!ultimaVersaoId,
  })

  if (paciente.isLoading) return <Carregando />
  if (paciente.error) return <ErroCarregamento erro={paciente.error} onTentar={paciente.refetch} />

  const p = paciente.data
  const plano = p.planoAtivo || ultimaVersao.data || null
  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const inicial = p.pesoInicialKg ?? p.evolucao[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const emitidoEm = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="pilha">
      <div className="cabecalho-pagina nao-imprimir" style={{ alignItems: 'center' }}>
        <Link to={`/nutri/pacientes/${p.id}`} className="link-voltar">
          <ArrowLeft size={16} /> Voltar ao prontuário
        </Link>
        <div className="acoes">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
          <Button
            onClick={async () => {
              // jsPDF é carregado só quando necessário (deixa o app inicial mais leve)
              const { exportarFichaPDF } = await import('../lib/pdfFicha')
              exportarFichaPDF(p, plano, nutricionista)
              toast.success('Ficha exportada em PDF')
            }}
          >
            <FileDown /> Exportar PDF profissional
          </Button>
        </div>
      </div>

      <article className="ficha folha-impressao">
        <header className="ficha-cabecalho">
          <div>
            <div className="linha-sm cor-primaria">
              <ClipboardList size={24} />
              <p className="ficha-marca">Roteiro Nutri</p>
            </div>
            <h1 className="ficha-titulo">Ficha Médica/Nutricional</h1>
            <p className="ficha-legenda">Documento de acompanhamento clínico-nutricional</p>
          </div>
          <div className="ficha-emissor">
            <p className="texto-medio">{nutricionista.nome}</p>
            <p>{nutricionista.crn}</p>
            <p style={{ marginTop: 6 }}>Emitido em {emitidoEm}</p>
            <p className="ficha-miudo">Prontuário #{p.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <Secao titulo="1. Identificação do paciente">
          <div className="grade grade-2-sm" style={{ gap: '6px 24px' }}>
            <KV k="Nome completo" v={p.nome} />
            <KV k="E-mail" v={p.email} />
            <KV k="Idade" v={p.idade ? `${p.idade} anos` : '—'} />
            <KV k="Sexo" v={p.sexo === 'F' ? 'Feminino' : p.sexo === 'M' ? 'Masculino' : '—'} />
            <KV k="Início do acompanhamento" v={dataBR(p.dataInicio)} />
            <KV k="Última consulta" v={p.ultimaConsulta ? dataBR(p.ultimaConsulta.data) : '—'} />
            <KV k="Próxima consulta" v={p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} · ${p.proximaConsulta.horario}` : '—'} />
            <KV k="Status" v={p.ativo ? 'Em acompanhamento' : 'Inativo'} />
          </div>
        </Secao>

        <Secao titulo="2. Anamnese clínica">
          <KVBloco k="Histórico médico" v={p.historicoClinico || 'Não informado.'} />
          <KVBloco k="Alergias e intolerâncias" v={p.alergias || 'Nenhuma relatada.'} />
          <KVBloco k="Estilo de vida e rotina" v={p.estiloVida || 'Não informado.'} />
          <KVBloco k="Recordatório alimentar (últimas 24h)" v={p.recordatorioAlimentar || 'Não informado.'} />
        </Secao>

        <Secao titulo="3. Avaliação antropométrica">
          <div className="grade grade-2 grade-3-sm" style={{ gap: 12 }}>
            <Caixa rotulo="Altura" valor={p.alturaCm ? `${p.alturaCm} cm` : '—'} />
            <Caixa rotulo="Peso atual" valor={p.pesoAtualKg != null ? `${p.pesoAtualKg} kg` : '—'} />
            <Caixa rotulo="Peso inicial" valor={inicial != null ? `${inicial} kg` : '—'} />
            <Caixa rotulo="Peso alvo" valor={p.pesoMetaKg != null ? `${p.pesoMetaKg} kg` : '—'} />
            <Caixa rotulo="IMC" valor={valorImc ? `${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})` : '—'} />
            <Caixa rotulo="Variação" valor={delta != null ? `${sinal(delta)} kg` : '—'} />
            <Caixa rotulo="% Gordura corporal" valor={p.gorduraPct != null ? `${p.gorduraPct}%` : '—'} />
            <Caixa rotulo="% Massa magra" valor={p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'} />
            <Caixa rotulo="Objetivo" valor={objetivoLabel(p.objetivo)} />
          </div>
        </Secao>

        <Secao titulo="4. Evolução do peso">
          {p.evolucao.length === 0 ? (
            <p className="ficha-vazio">Nenhuma pesagem registrada.</p>
          ) : (
            <table className="ficha-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Peso (kg)</th>
                  <th>Δ vs início</th>
                </tr>
              </thead>
              <tbody>
                {p.evolucao.map((e) => (
                  <tr key={e.id}>
                    <td>{dataBR(e.data)}</td>
                    <td className="mono">{e.pesoKg.toFixed(1)}</td>
                    <td className="mono">{inicial != null ? `${sinal(e.pesoKg - inicial)} kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>

        <Secao titulo="5. Plano alimentar vigente">
          {plano ? (
            <div className="pilha">
              <div className="linha linha-quebra" style={{ gap: '4px 24px' }}>
                <KV k="Plano" v={`${plano.nome} (versão ${plano.versao})`} />
                <KV k="Criado em" v={dataHoraBR(plano.createdAt)} />
                <KV k="Status" v={plano.ativo ? 'Ativo' : 'Suspenso/encerrado'} />
                <KV k="Meta calórica" v={`${plano.kcalAlvo} kcal/dia`} />
                <KV k="Macros" v={`C ${plano.pctCarbo}% / P ${plano.pctProteina}% / G ${plano.pctGordura}%`} />
              </div>
              {plano.refeicoes.map((r) => (
                <div key={r.id} className="ficha-refeicao">
                  <div className="ficha-refeicao-topo">
                    <p className="texto-forte">
                      {r.nome} <span className="ficha-legenda">— {r.horario}</span>
                    </p>
                    <p className="mono texto-pequeno">{totaisRefeicao(r).kcal} kcal</p>
                  </div>
                  <table className="ficha-itens">
                    <tbody>
                      {r.itens.map((item) => {
                        const c = calcularAlimento(item.alimento, item.gramas)
                        return (
                          <tr key={item.id}>
                            <td style={{ width: 24 }}>{iconeAlimento(item.alimento)}</td>
                            <td>
                              {item.alimento.nome}
                              {item.substitutos.length > 0 && (
                                <span className="ficha-substitutos">
                                  ou {item.substitutos.map((s) => `${s.alimento.nome} (${s.gramas} g)`).join(' · ')}
                                </span>
                              )}
                            </td>
                            <td className="mono direita sem-quebra">{item.gramas} g</td>
                            <td className="mono direita sem-quebra">{c.kcal} kcal</td>
                            <td className="mono direita ficha-legenda sem-quebra">
                              P {c.proteina} · C {c.carbo} · G {c.gordura}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <p className="ficha-vazio">Nenhum plano alimentar cadastrado.</p>
          )}
        </Secao>

        <Secao titulo="6. Histórico de atendimentos">
          {p.consultas.length === 0 ? (
            <p className="ficha-vazio">Sem atendimentos registrados.</p>
          ) : (
            <ul className="pilha">
              {p.consultas.map((c) => (
                <li key={c.id} className="ficha-atendimento">
                  <p className="ficha-legenda">
                    <span className="mono">
                      {dataBR(c.data)} {c.horario}
                    </span>{' '}
                    · <span className="ficha-tipo">{c.tipo}</span>
                  </p>
                  {c.observacoes && <p className="quebrar">{c.observacoes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <footer className="ficha-rodape">
          <p className="ficha-miudo" style={{ maxWidth: 360 }}>
            Documento gerado eletronicamente pelo Roteiro Nutri. Informações sigilosas — uso exclusivo entre profissional e paciente (LGPD
            Art. 11).
          </p>
          <div className="ficha-assinatura">
            <p className="texto-medio">{nutricionista.nome}</p>
            <p className="ficha-miudo">{nutricionista.crn}</p>
          </div>
        </footer>
      </article>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <section className="ficha-secao">
      <h2>{titulo}</h2>
      {children}
    </section>
  )
}

function KV({ k, v }) {
  return (
    <div>
      <span className="ficha-legenda">{k}: </span>
      <span className="texto-medio">{v}</span>
    </div>
  )
}

function KVBloco({ k, v }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p className="ficha-rotulo">{k}</p>
      <p className="quebrar" style={{ marginTop: 2 }}>
        {v}
      </p>
    </div>
  )
}

function Caixa({ rotulo, valor }) {
  return (
    <div className="ficha-caixa">
      <p className="ficha-rotulo">{rotulo}</p>
      <p className="mono texto-medio">{valor}</p>
    </div>
  )
}
