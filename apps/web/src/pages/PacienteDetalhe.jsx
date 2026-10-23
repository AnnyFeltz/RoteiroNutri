import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, ChevronRight, Trash2, ClipboardList, KeyRound, Pencil, FileDown, History } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import {
  OBJETIVO_LABEL, imc, classificacaoImc, macroGramas, totaisRefeicao, totaisPlano, calcularAlimento, iconeAlimento,
} from '@RoteiroNutri/shared'
import {
  Avatar, Badge, Button, Card, Carregando, ConfirmDialog, ErroCarregamento, Field, Input, Modal, Select, Stat, Tabs, Textarea,
} from '../components/ui'
import { SenhaGeradaModal } from '../components/SenhaGeradaModal'
import { api } from '../lib/api'
import { dataBR, dataHoraBR, isoLocal, kg, objetivoLabel, sinal } from '../lib/format'

const ABAS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'anamnese', label: 'Anamnese' },
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'plano', label: 'Plano' },
  { value: 'evolucao', label: 'Evolução' },
  { value: 'consultas', label: 'Consultas' },
]

// Prontuário do paciente: RF05, RF08, RF21, RF22
export default function PacienteDetalhe() {
  const { id } = useParams()
  const [aba, setAba] = useState('resumo')
  const [novaSenha, setNovaSenha] = useState(null)
  const [confirmarSenha, setConfirmarSenha] = useState(false)
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

  const gerarSenha = useMutation({
    mutationFn: () => api(`/pacientes/${id}/nova-senha`, { method: 'POST' }),
    onSuccess: (r) => {
      setConfirmarSenha(false)
      setNovaSenha({ email: r.email, senha: r.novaSenha, emailEnviado: r.emailEnviado })
    },
    onError: (e) => toast.error(e.message),
  })

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const plano = p.planoAtivo

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/nutri/pacientes" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{p.nome}</span>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Avatar nome={p.nome} cor={p.avatarCor} className="h-16 w-16" textClassName="text-lg" />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{p.nome}</h1>
                {p.ativo ? <Badge>Paciente ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setConfirmarSenha(true)} title="Gerar nova senha de acesso ao app">
              <KeyRound className="h-4 w-4" /> Nova senha
            </Button>
            <Link to={`/nutri/pacientes/${p.id}/ficha`}>
              <Button variant="outline">
                <ClipboardList className="h-4 w-4" /> Ficha médica/nutricional
              </Button>
            </Link>
            {p.ativo && (
              <Link to={plano ? `/nutri/pacientes/${p.id}/plano/${plano.id}/editar` : `/nutri/pacientes/${p.id}/plano/novo`}>
                <Button>
                  <Plus className="h-4 w-4" /> {plano ? 'Editar plano' : 'Novo plano'}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Tabs value={aba} onChange={setAba} tabs={ABAS} />

      {aba === 'resumo' && <ResumoTab p={p} plano={plano} />}
      {aba === 'anamnese' && <AnamneseTab p={p} onSalvar={(d) => atualizar.mutate(d)} salvando={atualizar.isPending} />}
      {aba === 'avaliacao' && <AvaliacaoTab p={p} onSalvar={(d) => atualizar.mutate(d)} salvando={atualizar.isPending} />}
      {aba === 'plano' && <PlanoTab p={p} plano={plano} />}
      {aba === 'evolucao' && <EvolucaoTab p={p} />}
      {aba === 'consultas' && <ConsultasTab p={p} />}

      <ConfirmDialog
        open={confirmarSenha}
        onClose={() => setConfirmarSenha(false)}
        onConfirm={() => gerarSenha.mutate()}
        loading={gerarSenha.isPending}
        title="Gerar nova senha?"
        description={`Uma nova senha de acesso ao app será gerada para ${p.nome}. A senha atual deixará de funcionar.`}
        confirmText="Gerar nova senha"
      />
      <SenhaGeradaModal dados={novaSenha} onClose={() => setNovaSenha(null)} titulo="Nova senha gerada" />
    </div>
  )
}

function ResumoTab({ p, plano }) {
  const valorImc = imc(p.pesoAtualKg, p.alturaCm)
  const g = plano ? macroGramas(plano.kcalAlvo, plano) : null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="p-5">
        <h4 className="text-sm text-muted-foreground mb-3">Objetivo</h4>
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">🎯</span>
          <p className="font-medium">{objetivoLabel(p.objetivo)}</p>
        </div>
        <div className="mt-5 space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Início do acompanhamento:</span> {dataBR(p.dataInicio)}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone:</span> {p.telefone || '—'}
          </p>
          {plano && (
            <p className="mt-2">
              <span className="text-muted-foreground">Plano atual:</span>
              <br />
              <span className="font-medium">
                {plano.nome} (v{plano.versao})
              </span>
              <br />
              <span className="text-xs text-muted-foreground">Criado em {dataHoraBR(plano.createdAt)}</span>
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h4 className="text-sm text-muted-foreground mb-3">Dados principais</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Peso atual" value={kg(p.pesoAtualKg)} />
          <Stat label="Peso inicial" value={kg(p.pesoInicialKg)} />
          <Stat label="Peso alvo" value={kg(p.pesoMetaKg)} />
          <Stat label="IMC atual" value={valorImc ? valorImc.toFixed(1) : '—'} sub={valorImc ? classificacaoImc(valorImc) : undefined} />
          <Stat label="% Gordura" value={p.gorduraPct != null ? `${p.gorduraPct}%` : '—'} />
          <Stat label="% Massa magra" value={p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'} />
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <h4 className="text-sm text-muted-foreground mb-3">Resumo do plano atual</h4>
        {plano ? (
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Calorias diárias</span>
              <span className="font-medium">{plano.kcalAlvo} kcal</span>
            </li>
            <li className="flex justify-between">
              <span>Proteínas</span>
              <span className="font-medium">
                {g.proteina} g ({plano.pctProteina}%)
              </span>
            </li>
            <li className="flex justify-between">
              <span>Carboidratos</span>
              <span className="font-medium">
                {g.carbo} g ({plano.pctCarbo}%)
              </span>
            </li>
            <li className="flex justify-between">
              <span>Gorduras</span>
              <span className="font-medium">
                {g.gordura} g ({plano.pctGordura}%)
              </span>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum plano ativo. Crie um plano alimentar para este paciente.</p>
        )}
      </Card>

      <Card className="p-5">
        <h4 className="text-sm text-muted-foreground mb-3">Próxima consulta</h4>
        <p className="text-2xl font-display font-semibold text-primary">{p.proximaConsulta ? dataBR(p.proximaConsulta.data) : '—'}</p>
        {p.proximaConsulta && (
          <p className="text-sm text-muted-foreground">
            {p.proximaConsulta.horario} · {p.proximaConsulta.tipo}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Última: {p.ultimaConsulta ? dataBR(p.ultimaConsulta.data) : '—'}</p>
      </Card>
    </div>
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
  return (
    <Card className="p-6 space-y-5">
      <h3 className="font-display font-semibold text-lg">Anamnese</h3>
      <div className="grid md:grid-cols-2 gap-5">
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
      <Field label="Histórico médico">{(id) => <Textarea id={id} className="min-h-[100px]" value={d.historicoClinico} onChange={set('historicoClinico')} />}</Field>
      <Field label="Estilo de vida e rotina">{(id) => <Textarea id={id} className="min-h-[100px]" value={d.estiloVida} onChange={set('estiloVida')} />}</Field>
      <Field label="Recordatório alimentar (últimas 24h)">
        {(id) => <Textarea id={id} className="min-h-[120px]" value={d.recordatorioAlimentar} onChange={set('recordatorioAlimentar')} />}
      </Field>
      <div className="flex justify-end">
        <Button onClick={() => onSalvar(d)} loading={salvando}>
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
  const set = (c) => (e) => setD({ ...d, [c]: e.target.value })
  const valorImc = imc(Number(d.pesoAtualKg), Number(d.alturaCm))

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Avaliação física</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Peso atual" value={kg(p.pesoAtualKg)} large />
          <Stat label="IMC" value={valorImc ? valorImc.toFixed(1) : '—'} sub={valorImc ? classificacaoImc(valorImc) : undefined} large />
          <Stat label="% Gordura corporal" value={p.gorduraPct != null ? `${p.gorduraPct}%` : '—'} large />
          <Stat label="% Massa magra" value={p.massaMagraPct != null ? `${p.massaMagraPct}%` : '—'} large />
          <Stat label="Altura" value={p.alturaCm ? `${p.alturaCm} cm` : '—'} large />
          <Stat label="Peso alvo" value={kg(p.pesoMetaKg)} large />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-lg mb-1">Editar dados do paciente</h3>
        <p className="text-xs text-muted-foreground mb-4">Alterar o peso atual registra automaticamente uma nova pesagem na evolução.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Nome">{(id) => <Input id={id} value={d.nome} onChange={set('nome')} />}</Field>
          <Field label="E-mail (login do app)">{(id) => <Input id={id} type="email" value={d.email} onChange={set('email')} />}</Field>
          <Field label="Telefone">{(id) => <Input id={id} value={d.telefone} onChange={set('telefone')} />}</Field>
          <Field label="Idade">{(id) => <Input id={id} type="number" value={d.idade} onChange={set('idade')} />}</Field>
          <Field label="Sexo">
            {(id) => (
              <Select id={id} value={d.sexo} onChange={set('sexo')}>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </Select>
            )}
          </Field>
          <Field label="Altura (cm)">{(id) => <Input id={id} type="number" step="0.1" value={d.alturaCm} onChange={set('alturaCm')} />}</Field>
          <Field label="Peso inicial (kg)">{(id) => <Input id={id} type="number" step="0.1" value={d.pesoInicialKg} onChange={set('pesoInicialKg')} />}</Field>
          <Field label="Peso atual (kg)">{(id) => <Input id={id} type="number" step="0.1" value={d.pesoAtualKg} onChange={set('pesoAtualKg')} />}</Field>
          <Field label="Peso alvo (kg)">{(id) => <Input id={id} type="number" step="0.1" value={d.pesoMetaKg} onChange={set('pesoMetaKg')} />}</Field>
          <Field label="% Gordura corporal">{(id) => <Input id={id} type="number" step="0.1" value={d.gorduraPct} onChange={set('gorduraPct')} />}</Field>
          <Field label="% Massa magra">{(id) => <Input id={id} type="number" step="0.1" value={d.massaMagraPct} onChange={set('massaMagraPct')} />}</Field>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={() => onSalvar(d)} loading={salvando}>
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
    <div className="space-y-5">
      {!plano ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">Este paciente não possui plano alimentar ativo.</p>
          {p.ativo && (
            <Button onClick={() => nav(`/nutri/pacientes/${p.id}/plano/novo`)} className="mt-4">
              Criar plano
            </Button>
          )}
        </Card>
      ) : (
        <PlanoResumoCard p={p} plano={plano} />
      )}

      {versoes && versoes.length > 0 && (
        <Card className="p-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Histórico de versões ({versoes.length})
          </h3>
          <ul className="divide-y divide-border">
            {versoes.map((v) => (
              <li key={v.id} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="outline" className="font-mono">
                  v{v.versao}
                </Badge>
                <span className="font-medium flex-1 min-w-[160px]">{v.nome}</span>
                <span className="text-muted-foreground">{dataHoraBR(v.createdAt)}</span>
                <span className="text-muted-foreground">
                  {v.kcalAlvo} kcal · {v.totalRefeicoes} refeições
                </span>
                {v.ativo ? <Badge>Ativo</Badge> : <Badge variant="muted">Encerrado</Badge>}
                <Link to={`/nutri/pacientes/${p.id}/plano/${v.id}`} className="text-primary hover:underline">
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
    { nome: 'Carboidratos', v: plano.pctCarbo, cor: 'var(--chart-3)' },
    { nome: 'Proteínas', v: plano.pctProteina, cor: 'var(--primary)' },
    { nome: 'Gorduras', v: plano.pctGordura, cor: 'var(--terracotta)' },
  ]
  const total = totaisPlano(plano)
  return (
    <Card className="p-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h3 className="font-display font-semibold text-lg">
            {plano.nome} <span className="text-sm text-muted-foreground font-sans">v{plano.versao}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Plano ativo · criado em {dataHoraBR(plano.createdAt)} · soma das refeições: {total.kcal} kcal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(`/nutri/pacientes/${p.id}/plano/${plano.id}`)}>
            <FileDown className="h-4 w-4" /> Ver / exportar PDF
          </Button>
          <Button onClick={() => nav(`/nutri/pacientes/${p.id}/plano/${plano.id}/editar`)}>
            <Pencil className="h-4 w-4" /> Editar plano
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mt-5">
        <div>
          <div className="relative h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie startAngle={90} endAngle={-270} data={macros} dataKey="v" innerRadius={45} outerRadius={70} stroke="none">
                  {macros.map((m) => (
                    <Cell key={m.nome} fill={m.cor} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-display font-semibold">{plano.kcalAlvo}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </div>
          <ul className="text-xs space-y-1 mt-2">
            {macros.map((m) => (
              <li key={m.nome} className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.cor }} />
                  {m.nome}
                </span>
                <span>{m.v}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2 space-y-3">
          {plano.refeicoes.map((r) => (
            <div key={r.id} className="border border-border rounded-xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{r.nome}</p>
                  <p className="text-xs text-muted-foreground">{r.horario}</p>
                </div>
                <p className="text-sm font-mono text-primary">{totaisRefeicao(r).kcal} kcal</p>
              </div>
              <ul className="mt-2 space-y-1">
                {r.itens.map((item) => (
                  <li key={item.id} className="text-sm flex justify-between gap-3 text-muted-foreground">
                    <span>
                      {iconeAlimento(item.alimento)} {item.alimento.nome} · {item.gramas}g
                    </span>
                    <span className="shrink-0">{calcularAlimento(item.alimento, item.gramas).kcal} kcal</span>
                  </li>
                ))}
                {r.itens.length === 0 && <li className="text-sm text-muted-foreground italic">Sem alimentos.</li>}
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
  const [removendo, setRemovendo] = useState(null)
  const inicial = p.pesoInicialKg ?? p.evolucao[0]?.pesoKg
  const delta = p.pesoAtualKg != null && inicial != null ? p.pesoAtualKg - inicial : null
  const serie = useMemo(() => p.evolucao.map((e) => ({ data: dataBR(e.data).slice(0, 5), peso: e.pesoKg })), [p.evolucao])

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    queryClient.invalidateQueries({ queryKey: ['evolucao'] })
  }

  const registrar = useMutation({
    mutationFn: () => api(`/pacientes/${p.id}/evolucao`, { method: 'POST', body: form }),
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

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex justify-between items-baseline mb-4 flex-wrap gap-2">
          <h3 className="font-display font-semibold text-lg">Evolução do peso</h3>
          {delta != null && (
            <p className="text-sm">
              <span className={`font-semibold ${delta <= 0 ? 'text-leaf' : 'text-terracotta'}`}>{sinal(delta)} kg</span>{' '}
              <span className="text-muted-foreground">desde o início</span>
            </p>
          )}
        </div>
        {serie.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Nenhuma pesagem registrada ainda.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Peso']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="peso" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold mb-4">Registrar pesagem</h3>
        <form
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            registrar.mutate()
          }}
        >
          <Field label="Data">{(id) => <Input id={id} type="date" max={isoLocal()} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />}</Field>
          <Field label="Peso (kg)">{(id) => <Input id={id} type="number" step="0.1" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} required />}</Field>
          <Field label="% Gordura">{(id) => <Input id={id} type="number" step="0.1" value={form.gorduraPct} onChange={(e) => setForm({ ...form, gorduraPct: e.target.value })} />}</Field>
          <Field label="% Massa magra">{(id) => <Input id={id} type="number" step="0.1" value={form.massaMagraPct} onChange={(e) => setForm({ ...form, massaMagraPct: e.target.value })} />}</Field>
          <Button type="submit" loading={registrar.isPending}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        </form>
      </Card>

      {p.evolucao.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-right px-3 py-3 font-medium">Peso</th>
                <th className="text-right px-3 py-3 font-medium">Δ início</th>
                <th className="text-right px-3 py-3 font-medium">% Gordura</th>
                <th className="text-right px-3 py-3 font-medium">% Massa magra</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {[...p.evolucao].reverse().map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-2.5">
                    {dataBR(e.data)}
                    {e.registradoPor === 'paciente' && <span className="text-xs text-muted-foreground"> · pelo app</span>}
                  </td>
                  <td className="text-right px-3 py-2.5 font-mono">{e.pesoKg.toFixed(1)}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-muted-foreground">{inicial != null ? `${sinal(e.pesoKg - inicial)} kg` : '—'}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-muted-foreground">{e.gorduraPct ?? '—'}</td>
                  <td className="text-right px-3 py-2.5 font-mono text-muted-foreground">{e.massaMagraPct ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => setRemovendo(e)} className="text-muted-foreground hover:text-destructive" title="Remover">
                      <Trash2 className="h-4 w-4" />
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
    mutationFn: () => api('/consultas', { method: 'POST', body: { ...form, pacienteId: p.id } }),
    onSuccess: () => {
      recarregar()
      setForm(vazio)
      toast.success('Consulta registrada')
    },
    onError: (e) => toast.error(e.message),
  })

  const salvarEdicao = useMutation({
    mutationFn: (c) => api(`/consultas/${c.id}`, { method: 'PUT', body: { data: c.data, horario: c.horario, tipo: c.tipo, observacoes: c.observacoes } }),
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
    if (!form.horario) return toast.error('Selecione um horário disponível')
    criar.mutate()
  }

  return (
    <div className="space-y-5">
      {p.ativo ? (
        <Card className="p-6">
          <h3 className="font-display font-semibold mb-4">Agendar / registrar atendimento</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <Field label="Data">{(id) => <Input id={id} type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value, horario: '' })} />}</Field>
            <Field label="Horário">
              {(id) => (
                <Select id={id} value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })}>
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
          <Field label="Notas do atendimento (opcional)" className="mt-3">
            {(id) => (
              <Textarea
                id={id}
                className="min-h-[90px]"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Conduta, observações clínicas, ajustes..."
              />
            )}
          </Field>
          <div className="flex justify-end mt-3">
            <Button onClick={enviar} loading={criar.isPending}>
              <Plus className="h-4 w-4" /> Registrar
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-sm text-muted-foreground">Reative o paciente para agendar novas consultas.</Card>
      )}

      <Card className="p-6">
        <h3 className="font-display font-semibold mb-4">Histórico de atendimentos ({p.consultas.length})</h3>
        {p.consultas.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum atendimento registrado.</p>
        ) : (
          <ul className="space-y-3">
            {p.consultas.map((c) => (
              <li key={c.id} className="flex gap-4 p-4 rounded-xl border border-border group">
                <div className="text-sm font-mono text-muted-foreground whitespace-nowrap shrink-0">
                  {dataBR(c.data)} · {c.horario}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-1">
                    {c.tipo}
                  </Badge>
                  {c.data >= isoLocal() && <Badge className="mb-1 ml-1">Agendada</Badge>}
                  <p className="text-sm whitespace-pre-wrap">{c.observacoes || <span className="text-muted-foreground italic">Sem anotações.</span>}</p>
                </div>
                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition">
                  <button onClick={() => setEditando({ ...c, observacoes: c.observacoes || '' })} className="text-muted-foreground hover:text-primary" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setRemovendo(c)} className="text-muted-foreground hover:text-destructive" title="Remover">
                    <Trash2 className="h-4 w-4" />
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
            <Button onClick={() => salvarEdicao.mutate(editando)} loading={salvarEdicao.isPending}>
              Salvar
            </Button>
          </>
        }
      >
        {editando && (
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="Tipo" className="col-span-2">{(id) => <Input id={id} value={editando.tipo} onChange={(e) => setEditando({ ...editando, tipo: e.target.value })} />}</Field>
            <Field label="Notas do atendimento" className="col-span-2">
              {(id) => <Textarea id={id} className="min-h-[120px]" value={editando.observacoes} onChange={(e) => setEditando({ ...editando, observacoes: e.target.value })} />}
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
