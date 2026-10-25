import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, ChevronRight, Trash2, ClipboardList, Pencil, FileDown, History } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import {
  OBJETIVO_LABEL, imc, classificacaoImc, macroGramas, totaisRefeicao, totaisPlano, calcularAlimento, iconeAlimento,
  atualizarPacienteSchema, evolucaoSchema, consultaSchema, atualizarConsultaSchema,
} from '@RoteiroNutri/shared'
import {
  Avatar, Badge, Button, Card, Carregando, ConfirmDialog, ErroCarregamento, Field, Input, Modal, Select, Stat, Tabs, Textarea,
} from '../components/ui'
import { api } from '../lib/api'
import { dataBR, dataHoraBR, isoLocal, kg, objetivoLabel, sinal } from '../lib/format'
import { validar } from '../lib/validacao'

const ABAS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'plano', label: 'Plano' },
  { value: 'evolucao', label: 'Evolução' },
  { value: 'consultas', label: 'Consultas' },
]

const TOOLTIP = { background: 'var(--card)', border: '1px solid var(--borda)', borderRadius: 8 }
const EIXO = { fontSize: 12, fill: 'var(--texto-suave)' }

// Prontuário do paciente: RF05, RF08, RF21, RF22
export default function PacienteDetalhe() {
  const { id } = useParams()
  const [aba, setAba] = useState('resumo')
  const queryClient = useQueryClient()

  const { data: p, isLoading, error, refetch } = useQuery({
    queryKey: ['pacientes', id],
    queryFn: () => api(`/pacientes/${id}`),
  })

  const atualizar = useMutation({
    mutationFn: (dados) => api(`/pacientes/${id}`, { method: 'PUT', body: dados }),
    onSuccess: (novo) => {
      queryClient.setQueryData(['pacientes', id], novo)
      queryClient.invalidateQueries({ queryKey: ['pacientes'], exact: false })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Dados do paciente atualizados')
    },
    onError: (e) => toast.error(e.message),
  })

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const plano = p.planoAtivo

  return (
    <div className="pagina" style={{ gap: 20 }}>
      <div className="linha-sm">
        <Link to="/nutri/pacientes" className="link-voltar">
          <ArrowLeft size={16} /> Pacientes
        </Link>
        <ChevronRight size={12} className="texto-suave" />
        <span className="texto-medio">{p.nome}</span>
      </div>

      <Card className="card-amplo cabecalho-pagina" style={{ alignItems: 'center' }}>
        <div className="linha" style={{ gap: 16 }}>
          <Avatar nome={p.nome} cor={p.avatarCor} foto={p.foto} tamanho="lg" />
          <div>
            <div className="linha linha-quebra">
              <h1 className="numero-medio">{p.nome}</h1>
              {p.ativo ? <Badge>Paciente ativo</Badge> : <Badge variant="muted">Inativo</Badge>}
            </div>
            <p className="texto-suave" style={{ marginTop: 4 }}>
              {[
                p.idade && `${p.idade} anos`,
                p.alturaCm && `${(p.alturaCm / 100).toFixed(2)} m`,
                p.pesoAtualKg && kg(p.pesoAtualKg),
                valorImc && `IMC ${valorImc.toFixed(1)} (${classificacaoImc(valorImc)})`,
              ]
                .filter(Boolean)
                .join(' · ') || p.email}
            </p>
          </div>
        </div>
        <div className="acoes">
          <Link to={`/nutri/pacientes/${p.id}/ficha`}>
            <Button variant="outline">
              <ClipboardList /> Ficha médica/nutricional
            </Button>
          </Link>
          {p.ativo && (
            <Link to={plano ? `/nutri/pacientes/${p.id}/plano/${plano.id}/editar` : `/nutri/pacientes/${p.id}/plano/novo`}>
              <Button>
                <Plus /> {plano ? 'Editar plano' : 'Novo plano'}
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <Tabs value={aba} onChange={setAba} tabs={ABAS} />

      {aba === 'resumo' && <ResumoTab p={p} plano={plano} />}
      {aba === 'anamnese' && <AnamneseTab p={p} onSalvar={(d) => atualizar.mutate(d)} salvando={atualizar.isPending} />}
      {aba === 'avaliacao' && <AvaliacaoTab p={p} onSalvar={(d) => atualizar.mutate(d)} salvando={atualizar.isPending} />}
      {aba === 'plano' && <PlanoTab p={p} plano={plano} />}
      {aba === 'evolucao' && <EvolucaoTab p={p} />}
      {aba === 'consultas' && <ConsultasTab p={p} />}

    </div>
  )
}

function ResumoTab({ p, plano }) {
  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const g = plano ? macroGramas(plano.kcalAlvo, plano) : null
  return (
    <div className="grade grade-3-lg" style={{ gap: 20 }}>
      <Card>
        <h4 className="card-subtitulo">Objetivo</h4>
        <div className="linha-sm">
          <span className="icone-caixa icone-caixa-primaria" style={{ width: 32, height: 32, borderRadius: '50%' }}>
            🎯
          </span>
          <p className="texto-medio">{objetivoLabel(p.objetivo)}</p>
        </div>
        <div className="pilha-sm" style={{ marginTop: 20 }}>
          <p>
            <span className="texto-suave">Início do acompanhamento:</span> {dataBR(p.dataInicio)}
          </p>
          <p>
            <span className="texto-suave">Telefone:</span> {p.telefone || '—'}
          </p>
          {plano && (
            <p style={{ marginTop: 8 }}>
              <span className="texto-suave">Plano atual:</span>
              <br />
              <span className="texto-medio">
                {plano.nome} (v{plano.versao})
              </span>
              <br />
              <span className="texto-pequeno texto-suave">Criado em {dataHoraBR(plano.createdAt)}</span>
            </p>
          )}
        </div>
      </Card>

      <Card className="ocupa-2-lg">
        <h4 className="card-subtitulo">Dados principais</h4>
        <div className="grade grade-2 grade-3-md" style={{ gap: 12 }}>
          <Stat label="Peso atual" value={kg(p.pesoAtualKg)} />
          <Stat label="Peso inicial" value={kg(p.pesoInicialKg)} />
          <Stat label="Peso alvo" value={kg(p.pesoMetaKg)} />
          <Stat label="IMC atual" value={valorImc ? valorImc.toFixed(1) : '—'} sub={valorImc ? classificacaoImc(valorImc) : undefined} />
          <Stat label="% Gordura" value={p.gorduraPct != null ? `${p.gorduraPct}%` : '—'} />
          <Stat label="% Massa magra" value={p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'} />
        </div>
      </Card>

      <Card className="ocupa-2-lg">
        <h4 className="card-subtitulo">Resumo do plano atual</h4>
        {plano ? (
          <ul className="pilha-sm">
            <LinhaValor rotulo="Calorias diárias" valor={`${plano.kcalAlvo} kcal`} />
            <LinhaValor rotulo="Proteínas" valor={`${g.proteina} g (${plano.pctProteina}%)`} />
            <LinhaValor rotulo="Carboidratos" valor={`${g.carbo} g (${plano.pctCarbo}%)`} />
            <LinhaValor rotulo="Gorduras" valor={`${g.gordura} g (${plano.pctGordura}%)`} />
          </ul>
        ) : (
          <p className="texto-suave">Nenhum plano ativo. Crie um plano alimentar para este paciente.</p>
        )}
      </Card>

      <Card>
        <h4 className="card-subtitulo">Próxima consulta</h4>
        <p className="numero-medio cor-primaria">{p.proximaConsulta ? dataBR(p.proximaConsulta.data) : '—'}</p>
        {p.proximaConsulta && (
          <p className="texto-suave">
            {p.proximaConsulta.horario} · {p.proximaConsulta.tipo}
          </p>
        )}
        <p className="texto-pequeno texto-suave" style={{ marginTop: 4 }}>
          Última: {p.ultimaConsulta ? dataBR(p.ultimaConsulta.data) : '—'}
        </p>
      </Card>
    </div>
  )
}

function LinhaValor({ rotulo, valor }) {
  return (
    <li className="linha entre">
      <span>{rotulo}</span>
      <span className="texto-medio">{valor}</span>
    </li>
  )
}

// RF08 / RN05 - Registro clínico (anamnese)
function AnamneseTab({ p, onSalvar, salvando }) {
  const [d, setD] = useState({
    objetivo: p.objetivo || 'emagrecimento',
    alergias: p.alergias || '',
    historicoClinico: p.historicoClinico || '',
    estiloVida: p.estiloVida || '',
    recordatorioAlimentar: p.recordatorioAlimentar || '',
  })
  const set = (c) => (e) => setD({ ...d, [c]: e.target.value })
  const salvar = () => {
    const dados = validar(atualizarPacienteSchema, d)
    if (dados) onSalvar(dados)
  }
  return (
    <Card className="card-amplo pilha-lg">
      <h3 className="titulo-secao">Anamnese</h3>
      <div className="grade grade-2-md" style={{ gap: 20 }}>
        <Field label="Objetivo">
          {(id) => (
            <Select id={id} value={d.objetivo} onChange={set('objetivo')}>
              {Object.entries(OBJETIVO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Alergias e intolerâncias">{(id) => <Input id={id} value={d.alergias} onChange={set('alergias')} />}</Field>
      </div>
      <Field label="Histórico médico">{(id) => <Textarea id={id} value={d.historicoClinico} onChange={set('historicoClinico')} />}</Field>
      <Field label="Estilo de vida e rotina">{(id) => <Textarea id={id} value={d.estiloVida} onChange={set('estiloVida')} />}</Field>
      <Field label="Recordatório alimentar (últimas 24h)">
        {(id) => <Textarea id={id} className="campo-alto" value={d.recordatorioAlimentar} onChange={set('recordatorioAlimentar')} />}
      </Field>
      <div className="linha" style={{ justifyContent: 'flex-end' }}>
        <Button onClick={salvar} loading={salvando}>
          Salvar anamnese
        </Button>
      </div>
    </Card>
  )
}

// RF05 - Dados cadastrais e avaliação física
function AvaliacaoTab({ p, onSalvar, salvando }) {
  const [d, setD] = useState({
    nome: p.nome,
    email: p.email,
    telefone: p.telefone || '',
    idade: p.idade ?? '',
    sexo: p.sexo || 'F',
    alturaCm: p.alturaCm ?? '',
    pesoInicialKg: p.pesoInicialKg ?? '',
    pesoAtualKg: p.pesoAtualKg ?? '',
    pesoMetaKg: p.pesoMetaKg ?? '',
    gorduraPct: p.gorduraPct ?? '',
    massaMagraPct: p.massaMagraPct ?? '',
  })
  const [erros, setErros] = useState({})
  const set = (c) => (e) => setD({ ...d, [c]: e.target.value })
  const valorImc = imc(Number(d.pesoAtualKg), Number(d.alturaCm))

  const salvar = () => {
    const dados = validar(atualizarPacienteSchema, d, setErros)
    if (dados) onSalvar(dados)
  }

  const campo = (rotulo, chave, props = {}) => (
    <Field label={rotulo} erro={erros[chave]}>
      {(id) => <Input id={id} value={d[chave]} onChange={set(chave)} erro={erros[chave]} {...props} />}
    </Field>
  )

  return (
    <div className="pilha-lg">
      <Card className="card-amplo">
        <h3 className="card-titulo">Avaliação física</h3>
        <div className="grade grade-2 grade-3-md">
          <Stat label="Peso atual" value={kg(p.pesoAtualKg)} large />
          <Stat label="IMC" value={valorImc ? valorImc.toFixed(1) : '—'} sub={valorImc ? classificacaoImc(valorImc) : undefined} large />
          <Stat label="% Gordura corporal" value={p.gorduraPct != null ? `${p.gorduraPct}%` : '—'} large />
          <Stat label="% Massa magra" value={p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'} large />
          <Stat label="Altura" value={p.alturaCm ? `${p.alturaCm} cm` : '—'} large />
          <Stat label="Peso alvo" value={kg(p.pesoMetaKg)} large />
        </div>
      </Card>

      <Card className="card-amplo">
        <h3 className="titulo-secao">Editar dados do paciente</h3>
        <p className="dica" style={{ marginBottom: 16 }}>
          Alterar o peso atual registra automaticamente uma nova pesagem na evolução.
        </p>
        <div className="grade grade-2-sm grade-3-lg">
          {campo('Nome', 'nome')}
          {campo('E-mail (login do app)', 'email', { type: 'email' })}
          {campo('Telefone', 'telefone')}
          {campo('Idade', 'idade', { type: 'number' })}
          <Field label="Sexo">
            {(id) => (
              <Select id={id} value={d.sexo} onChange={set('sexo')}>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </Select>
            )}
          </Field>
          {campo('Altura (cm)', 'alturaCm', { type: 'number', step: '0.1' })}
          {campo('Peso inicial (kg)', 'pesoInicialKg', { type: 'number', step: '0.1' })}
          {campo('Peso atual (kg)', 'pesoAtualKg', { type: 'number', step: '0.1' })}
          {campo('Peso alvo (kg)', 'pesoMetaKg', { type: 'number', step: '0.1' })}
          {campo('% Gordura corporal', 'gorduraPct', { type: 'number', step: '0.1' })}
          {campo('% Massa magra', 'massaMagraPct', { type: 'number', step: '0.1' })}
        </div>
        <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <Button onClick={salvar} loading={salvando}>
            Salvar avaliação
          </Button>
        </div>
      </Card>
    </div>
  )
}

function PlanoTab({ p, plano }) {
  const nav = useNavigate()
  const { data: versoes } = useQuery({
    queryKey: ['pacientes', p.id, 'planos'],
    queryFn: () => api(`/pacientes/${p.id}/planos`),
  })

  return (
    <div className="pilha-lg">
      {!plano ? (
        <Card className="card-vazio">
          <p>Este paciente não possui plano alimentar ativo.</p>
          {p.ativo && (
            <Button onClick={() => nav(`/nutri/pacientes/${p.id}/plano/novo`)} style={{ marginTop: 16 }}>
              Criar plano
            </Button>
          )}
        </Card>
      ) : (
        <PlanoResumoCard p={p} plano={plano} />
      )}

      {versoes && versoes.length > 0 && (
        <Card className="card-amplo">
          <h3 className="titulo-secao linha-sm" style={{ marginBottom: 12 }}>
            <History size={16} className="cor-primaria" /> Histórico de versões ({versoes.length})
          </h3>
          <ul className="lista-divisoria">
            {versoes.map((v) => (
              <li key={v.id} className="linha linha-quebra" style={{ padding: '10px 0' }}>
                <Badge variant="outline" className="mono">
                  v{v.versao}
                </Badge>
                <span className="texto-medio expandir" style={{ minWidth: 160 }}>
                  {v.nome}
                </span>
                <span className="texto-suave">{dataHoraBR(v.createdAt)}</span>
                <span className="texto-suave">
                  {v.kcalAlvo} kcal · {v.totalRefeicoes} refeições
                </span>
                {v.ativo ? <Badge>Ativo</Badge> : <Badge variant="muted">Encerrado</Badge>}
                <Link to={`/nutri/pacientes/${p.id}/plano/${v.id}`} className="link">
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function PlanoResumoCard({ p, plano }) {
  const nav = useNavigate()
  const macros = [
    { nome: 'Carboidratos', v: plano.pctCarbo, cor: 'var(--grafico-carbo)' },
    { nome: 'Proteínas', v: plano.pctProteina, cor: 'var(--primaria)' },
    { nome: 'Gorduras', v: plano.pctGordura, cor: 'var(--terracota)' },
  ]
  const total = totaisPlano(plano)
  return (
    <Card className="card-amplo">
      <div className="cabecalho-pagina">
        <div>
          <h3 className="titulo-secao">
            {plano.nome} <span className="texto-pequeno texto-suave">v{plano.versao}</span>
          </h3>
          <p className="texto-suave">
            Plano ativo · criado em {dataHoraBR(plano.createdAt)} · soma das refeições: {total.kcal} kcal
          </p>
        </div>
        <div className="acoes">
          <Button variant="outline" onClick={() => nav(`/nutri/pacientes/${p.id}/plano/${plano.id}`)}>
            <FileDown /> Ver / exportar PDF
          </Button>
          <Button onClick={() => nav(`/nutri/pacientes/${p.id}/plano/${plano.id}/editar`)}>
            <Pencil /> Editar plano
          </Button>
        </div>
      </div>
      <div className="grade grade-3-md" style={{ gap: 20, marginTop: 20 }}>
        <div>
          <div className="grafico" style={{ height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={macros} startAngle={90} endAngle={-270} dataKey="v" innerRadius={45} outerRadius={70} stroke="none">
                  {macros.map((m) => (
                    <Cell key={m.nome} fill={m.cor} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grafico-centro">
              <p className="numero-pequeno">{plano.kcalAlvo}</p>
              <p className="texto-pequeno texto-suave">kcal</p>
            </div>
          </div>
          <ul className="legenda" style={{ marginTop: 8 }}>
            {macros.map((m) => (
              <li key={m.nome}>
                <span className="linha-sm">
                  <span className="ponto" style={{ background: m.cor }} />
                  {m.nome}
                </span>
                <span>{m.v}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="pilha ocupa-2-md">
          {plano.refeicoes.map((r) => (
            <div key={r.id} className="bloco">
              <div className="linha entre alinhar-topo">
                <div>
                  <p className="texto-medio">{r.nome}</p>
                  <p className="texto-pequeno texto-suave">{r.horario}</p>
                </div>
                <p className="mono cor-primaria">{totaisRefeicao(r).kcal} kcal</p>
              </div>
              <ul className="pilha-sm" style={{ marginTop: 8 }}>
                {r.itens.map((item) => (
                  <li key={item.id} className="linha entre texto-suave">
                    <span>
                      {iconeAlimento(item.alimento)} {item.alimento.nome} · {item.gramas}g
                    </span>
                    <span className="sem-quebra">{calcularAlimento(item.alimento, item.gramas).kcal} kcal</span>
                  </li>
                ))}
                {r.itens.length === 0 && <li className="texto-suave texto-italico">Sem alimentos.</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// RF21 - Evolução de peso e medidas
function EvolucaoTab({ p }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ data: isoLocal(), pesoKg: '', gorduraPct: '', massaMagraPct: '' })
  const [erros, setErros] = useState({})
  const [removendo, setRemovendo] = useState(null)
  const inicial = p.pesoInicialKg ?? p.evolucao[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const serie = useMemo(() => p.evolucao.map((e) => ({ data: dataBR(e.data).slice(0, 5), peso: e.pesoKg })), [p.evolucao])

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    queryClient.invalidateQueries({ queryKey: ['evolucao'] })
  }

  const registrar = useMutation({
    mutationFn: (dados) => api(`/pacientes/${p.id}/evolucao`, { method: 'POST', body: dados }),
    onSuccess: () => {
      recarregar()
      setForm({ ...form, pesoKg: '', gorduraPct: '', massaMagraPct: '' })
      toast.success('Pesagem registrada')
    },
    onError: (e) => toast.error(e.message),
  })

  const remover = useMutation({
    mutationFn: (registro) => api(`/pacientes/${p.id}/evolucao/${registro.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      recarregar()
      setRemovendo(null)
      toast.success('Registro removido')
    },
    onError: (e) => toast.error(e.message),
  })

  const enviar = (e) => {
    e.preventDefault()
    const dados = validar(evolucaoSchema, form, setErros)
    if (dados) registrar.mutate(dados)
  }

  return (
    <div className="pilha-lg">
      <Card className="card-amplo">
        <div className="card-cabecalho linha-quebra">
          <h3>Evolução do peso</h3>
          {delta != null && (
            <p>
              <span className={`texto-forte ${delta <= 0 ? 'cor-folha' : 'cor-terracota'}`}>{sinal(delta)} kg</span>{' '}
              <span className="texto-suave">desde o início</span>
            </p>
          )}
        </div>
        {serie.length === 0 ? (
          <p className="centro texto-suave" style={{ padding: '40px 0' }}>
            Nenhuma pesagem registrada ainda.
          </p>
        ) : (
          <div style={{ height: 288 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--borda)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" tick={EIXO} axisLine={false} tickLine={false} />
                <YAxis tick={EIXO} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Peso']} contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="peso" stroke="var(--primaria)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--primaria)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="card-amplo">
        <h3 className="card-titulo">Registrar pesagem</h3>
        <form className="formulario-pesagem" onSubmit={enviar} noValidate>
          <Field label="Data" erro={erros.data}>
            {(id) => <Input id={id} type="date" max={isoLocal()} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />}
          </Field>
          <Field label="Peso (kg)" erro={erros.pesoKg}>
            {(id) => <Input id={id} type="number" step="0.1" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} erro={erros.pesoKg} />}
          </Field>
          <Field label="% Gordura" erro={erros.gorduraPct}>
            {(id) => <Input id={id} type="number" step="0.1" value={form.gorduraPct} onChange={(e) => setForm({ ...form, gorduraPct: e.target.value })} />}
          </Field>
          <Field label="% Massa magra" erro={erros.massaMagraPct}>
            {(id) => <Input id={id} type="number" step="0.1" value={form.massaMagraPct} onChange={(e) => setForm({ ...form, massaMagraPct: e.target.value })} />}
          </Field>
          <Button type="submit" loading={registrar.isPending}>
            <Plus /> Registrar
          </Button>
        </form>
      </Card>

      {p.evolucao.length > 0 && (
        <Card className="card-sem-espaco rolagem-x">
          <table className="tabela tabela-maiuscula" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Data</th>
                <th className="direita">Peso</th>
                <th className="direita">Δ início</th>
                <th className="direita">% Gordura</th>
                <th className="direita">% Massa magra</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...p.evolucao].reverse().map((e) => (
                <tr key={e.id}>
                  <td>
                    {dataBR(e.data)}
                    {e.registradoPor === 'paciente' && <span className="texto-pequeno texto-suave"> · pelo app</span>}
                  </td>
                  <td className="num">{e.pesoKg.toFixed(1)}</td>
                  <td className="num-suave">{inicial != null ? `${sinal(e.pesoKg - inicial)} kg` : '—'}</td>
                  <td className="num-suave">{e.gorduraPct ?? '—'}</td>
                  <td className="num-suave">{e.massaMagraPct ?? '—'}</td>
                  <td className="direita">
                    <button onClick={() => setRemovendo(e)} className="icone-acao perigo" title="Remover">
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ConfirmDialog
        open={!!removendo}
        onClose={() => setRemovendo(null)}
        onConfirm={() => remover.mutate(removendo)}
        loading={remover.isPending}
        destructive
        confirmText="Remover"
        title="Remover pesagem?"
        description={removendo ? `Registro de ${dataBR(removendo.data)} (${removendo.pesoKg} kg).` : ''}
      />
    </div>
  )
}

// Horários de atendimento: 07:00 até 19:30, a cada 30 minutos
const HORARIOS = Array.from({ length: 26 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

// RF22 / RN16 / RN17 - Agendar e registrar consultas
function ConsultasTab({ p }) {
  const queryClient = useQueryClient()
  const vazio = { data: isoLocal(), horario: '', tipo: 'Retorno', observacoes: '' }
  const [form, setForm] = useState(vazio)
  const [erros, setErros] = useState({})
  const [editando, setEditando] = useState(null)
  const [removendo, setRemovendo] = useState(null)

  const { data: ocupados = [] } = useQuery({
    queryKey: ['consultas', 'ocupados', form.data],
    queryFn: () => api('/consultas/horarios-ocupados', { query: { data: form.data } }),
    enabled: /^\d{4}-\d{2}-\d{2}$/.test(form.data),
  })

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    queryClient.invalidateQueries({ queryKey: ['consultas'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const criar = useMutation({
    mutationFn: (dados) => api('/consultas', { method: 'POST', body: dados }),
    onSuccess: () => {
      recarregar()
      setForm(vazio)
      toast.success('Consulta registrada')
    },
    onError: (e) => toast.error(e.message),
  })

  const salvarEdicao = useMutation({
    mutationFn: ({ id, dados }) => api(`/consultas/${id}`, { method: 'PUT', body: dados }),
    onSuccess: () => {
      recarregar()
      setEditando(null)
      toast.success('Consulta atualizada')
    },
    onError: (e) => toast.error(e.message),
  })

  const remover = useMutation({
    mutationFn: (c) => api(`/consultas/${c.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      recarregar()
      setRemovendo(null)
      toast.success('Consulta removida')
    },
    onError: (e) => toast.error(e.message),
  })

  const enviar = () => {
    if (!form.horario) {
      setErros({ horario: 'Selecione um horário disponível' })
      return toast.error('Selecione um horário disponível')
    }
    const dados = validar(consultaSchema, { ...form, pacienteId: p.id }, setErros)
    if (dados) criar.mutate(dados)
  }

  const enviarEdicao = () => {
    const { id, data, horario, tipo, observacoes } = editando
    const dados = validar(atualizarConsultaSchema, { data, horario, tipo, observacoes })
    if (dados) salvarEdicao.mutate({ id, dados })
  }

  return (
    <div className="pilha-lg">
      {p.ativo ? (
        <Card className="card-amplo">
          <h3 className="card-titulo">Agendar / registrar atendimento</h3>
          <div className="grade grade-3-md" style={{ gap: 12 }}>
            <Field label="Data" erro={erros.data}>
              {(id) => <Input id={id} type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value, horario: '' })} />}
            </Field>
            <Field label="Horário" erro={erros.horario}>
              {(id) => (
                <Select id={id} value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className={erros.horario ? 'campo-com-erro' : ''}>
                  <option value="">Selecione...</option>
                  {HORARIOS.map((h) => {
                    const ocupado = ocupados.includes(h)
                    return (
                      <option key={h} value={h} disabled={ocupado}>
                        {h}
                        {ocupado ? ' — ocupado' : ''}
                      </option>
                    )
                  })}
                </Select>
              )}
            </Field>
            <Field label="Tipo">
              {(id) => (
                <Select id={id} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option>Retorno</option>
                  <option>Avaliação</option>
                  <option>Avaliação inicial</option>
                  <option>Teleconsulta</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Notas do atendimento (opcional)" className="campo-espaco">
            {(id) => (
              <Textarea id={id} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Conduta, observações clínicas, ajustes..." />
            )}
          </Field>
          <div className="linha" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <Button onClick={enviar} loading={criar.isPending}>
              <Plus /> Registrar
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="texto-suave">Reative o paciente para agendar novas consultas.</Card>
      )}

      <Card className="card-amplo">
        <h3 className="card-titulo">Histórico de atendimentos ({p.consultas.length})</h3>
        {p.consultas.length === 0 ? (
          <p className="texto-suave texto-italico">Nenhum atendimento registrado.</p>
        ) : (
          <ul className="pilha">
            {p.consultas.map((c) => (
              <li key={c.id} className="item-consulta">
                <div className="mono texto-suave sem-quebra">
                  {dataBR(c.data)} · {c.horario}
                </div>
                <div className="expandir">
                  <div className="linha-sm" style={{ marginBottom: 4 }}>
                    <Badge variant="outline">{c.tipo}</Badge>
                    {c.data >= isoLocal() && <Badge>Agendada</Badge>}
                  </div>
                  <p className="quebrar">{c.observacoes || <span className="texto-suave texto-italico">Sem anotações.</span>}</p>
                </div>
                <div className="item-consulta-acoes">
                  <button onClick={() => setEditando({ ...c, observacoes: c.observacoes || '' })} className="icone-acao" title="Editar">
                    <Pencil />
                  </button>
                  <button onClick={() => setRemovendo(c)} className="icone-acao perigo" title="Remover">
                    <Trash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="Editar consulta"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={enviarEdicao} loading={salvarEdicao.isPending}>
              Salvar
            </Button>
          </>
        }
      >
        {editando && (
          <div className="grade grade-2" style={{ gap: 12 }}>
            <Field label="Data">{(id) => <Input id={id} type="date" value={editando.data} onChange={(e) => setEditando({ ...editando, data: e.target.value })} />}</Field>
            <Field label="Horário">
              {(id) => (
                <Select id={id} value={editando.horario} onChange={(e) => setEditando({ ...editando, horario: e.target.value })}>
                  {[...new Set([editando.horario, ...HORARIOS])].map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Tipo" className="ocupa-tudo">
              {(id) => <Input id={id} value={editando.tipo} onChange={(e) => setEditando({ ...editando, tipo: e.target.value })} />}
            </Field>
            <Field label="Notas do atendimento" className="ocupa-tudo">
              {(id) => <Textarea id={id} className="campo-alto" value={editando.observacoes} onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })} />}
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removendo}
        onClose={() => setRemovendo(null)}
        onConfirm={() => remover.mutate(removendo)}
        loading={remover.isPending}
        destructive
        confirmText="Remover"
        title="Remover consulta?"
        description={removendo ? `${dataBR(removendo.data)} às ${removendo.horario} (${removendo.tipo}).` : ''}
      />
    </div>
  )
}
