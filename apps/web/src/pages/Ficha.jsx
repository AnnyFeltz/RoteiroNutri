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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link to={`/nutri/pacientes/${p.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar ao prontuário
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button
            onClick={async () => {
              // jsPDF é carregado só quando necessário (deixa o app inicial mais leve)
              const { exportarFichaPDF } = await import('../lib/pdfFicha')
              exportarFichaPDF(p, plano, nutricionista)
              toast.success('Ficha exportada em PDF')
            }}
          >
            <FileDown className="h-4 w-4" /> Exportar PDF profissional
          </Button>
        </div>
      </div>

      <article className="print-page mx-auto bg-white text-zinc-900 shadow-soft border border-border rounded-2xl max-w-[820px] p-6 sm:p-10">
        <header className="flex flex-wrap gap-4 items-start justify-between border-b-2 border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ClipboardList className="h-6 w-6" />
              <p className="text-xs uppercase tracking-[0.2em] font-semibold">Roteiro Nutri</p>
            </div>
            <h1 className="font-display text-3xl font-semibold mt-2">Ficha Médica/Nutricional</h1>
            <p className="text-xs text-zinc-600 mt-1">Documento de acompanhamento clínico-nutricional</p>
          </div>
          <div className="text-right text-xs text-zinc-700">
            <p className="font-medium">{nutricionista.nome}</p>
            <p>{nutricionista.crn}</p>
            <p className="mt-1.5">Emitido em {emitidoEm}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Prontuário #{p.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <Secao titulo="1. Identificação do paciente">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
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
            <p className="text-sm text-zinc-500 italic">Nenhuma pesagem registrada.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-300 text-left text-xs uppercase tracking-wider text-zinc-600">
                  <th className="py-2 pr-3 font-medium">Data</th>
                  <th className="py-2 pr-3 font-medium">Peso (kg)</th>
                  <th className="py-2 font-medium">Δ vs início</th>
                </tr>
              </thead>
              <tbody>
                {p.evolucao.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-100">
                    <td className="py-1.5 pr-3">{dataBR(e.data)}</td>
                    <td className="py-1.5 pr-3 font-mono">{e.pesoKg.toFixed(1)}</td>
                    <td className="py-1.5 font-mono">{inicial != null ? `${sinal(e.pesoKg - inicial)} kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>

        <Secao titulo="5. Plano alimentar vigente">
          {plano ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
                <KV k="Plano" v={`${plano.nome} (versão ${plano.versao})`} />
                <KV k="Criado em" v={dataHoraBR(plano.createdAt)} />
                <KV k="Status" v={plano.ativo ? 'Ativo' : 'Suspenso/encerrado'} />
                <KV k="Meta calórica" v={`${plano.kcalAlvo} kcal/dia`} />
                <KV k="Macros" v={`C ${plano.pctCarbo}% / P ${plano.pctProteina}% / G ${plano.pctGordura}%`} />
              </div>
              {plano.refeicoes.map((r) => (
                <div key={r.id} className="border border-zinc-300 rounded-md p-3">
                  <div className="flex justify-between items-baseline border-b border-zinc-200 pb-1.5 mb-2">
                    <p className="font-semibold text-sm">
                      {r.nome} <span className="text-xs text-zinc-500 font-normal">— {r.horario}</span>
                    </p>
                    <p className="text-xs font-mono text-zinc-700">{totaisRefeicao(r).kcal} kcal</p>
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      {r.itens.map((item) => {
                        const c = calcularAlimento(item.alimento, item.gramas)
                        return (
                          <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                            <td className="py-1 pr-2 w-6">{iconeAlimento(item.alimento)}</td>
                            <td className="py-1 pr-2">
                              {item.alimento.nome}
                              {item.substitutos.length > 0 && (
                                <span className="block text-[10px] text-zinc-500">
                                  ou {item.substitutos.map((s) => `${s.alimento.nome} (${s.gramas} g)`).join(' · ')}
                                </span>
                              )}
                            </td>
                            <td className="py-1 pr-2 font-mono text-right w-16">{item.gramas} g</td>
                            <td className="py-1 pr-2 font-mono text-right w-16">{c.kcal} kcal</td>
                            <td className="py-1 font-mono text-right text-zinc-500 w-36">
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
            <p className="text-sm text-zinc-500 italic">Nenhum plano alimentar cadastrado.</p>
          )}
        </Secao>

        <Secao titulo="6. Histórico de atendimentos">
          {p.consultas.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">Sem atendimentos registrados.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {p.consultas.map((c) => (
                <li key={c.id} className="border-l-2 border-primary pl-3">
                  <p className="text-xs text-zinc-500">
                    <span className="font-mono">
                      {dataBR(c.data)} {c.horario}
                    </span>{' '}
                    · <span className="uppercase tracking-wider">{c.tipo}</span>
                  </p>
                  {c.observacoes && <p className="mt-0.5 whitespace-pre-wrap">{c.observacoes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <footer className="mt-12 pt-6 border-t border-zinc-300 flex flex-wrap gap-6 justify-between items-end">
          <div className="text-[10px] text-zinc-500 max-w-sm leading-relaxed">
            Documento gerado eletronicamente pelo Roteiro Nutri. Informações sigilosas — uso exclusivo entre profissional e paciente (LGPD
            Art. 11).
          </div>
          <div className="text-center">
            <div className="border-t border-zinc-900 w-64 pt-1.5">
              <p className="text-sm font-medium">{nutricionista.nome}</p>
              <p className="text-[10px] text-zinc-600">{nutricionista.crn}</p>
            </div>
          </div>
        </footer>
      </article>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-zinc-500 border-b border-zinc-200 pb-1.5 mb-3 font-sans">{titulo}</h2>
      {children}
    </section>
  )
}

function KV({ k, v }) {
  return (
    <div className="text-sm">
      <span className="text-zinc-500">{k}: </span>
      <span className="font-medium">{v}</span>
    </div>
  )
}

function KVBloco({ k, v }) {
  return (
    <div className="mb-2.5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{k}</p>
      <p className="text-sm whitespace-pre-wrap mt-0.5">{v}</p>
    </div>
  )
}

function Caixa({ rotulo, valor }) {
  return (
    <div className="border border-zinc-300 rounded-md p-2.5">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{rotulo}</p>
      <p className="font-mono text-sm font-medium">{valor}</p>
    </div>
  )
}
