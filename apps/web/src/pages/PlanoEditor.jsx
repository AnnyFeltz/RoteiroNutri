import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Calculator, Replace, X, Scale } from 'lucide-react'
import {
  mifflinStJeor, harrisBenedict, calcularGET, ajustarParaObjetivo, macroGramas, calcularAlimento, totaisRefeicao,
  gramasEquivalentes, iconeAlimento,
} from '@RoteiroNutri/shared'
import { Button, Card, Carregando, ErroCarregamento, Field, Input, Modal, Select } from '../components/ui'
import { FoodPicker } from '../components/FoodPicker'
import { api } from '../lib/api'
import { objetivoLabel } from '../lib/format'

let contador = 0
const chave = () => `k${++contador}`

const REFEICOES_PADRAO = () => [
  { key: chave(), nome: 'Café da manhã', horario: '08:00', itens: [] },
  { key: chave(), nome: 'Almoço', horario: '12:30', itens: [] },
  { key: chave(), nome: 'Lanche da tarde', horario: '16:00', itens: [] },
  { key: chave(), nome: 'Jantar', horario: '19:00', itens: [] },
]

// Converte o plano vindo da API para o estado editável
function paraEdicao(plano) {
  return plano.refeicoes.map((r) => ({
    key: chave(),
    nome: r.nome,
    horario: r.horario,
    itens: r.itens.map((i) => ({
      key: chave(),
      alimento: i.alimento,
      gramas: i.gramas,
      substitutos: i.substitutos.map((s) => ({ key: chave(), alimento: s.alimento, gramas: s.gramas })),
    })),
  }))
}

// RF10 / RF11 / RF12 - Criar e editar plano (cada salvamento gera uma nova versão)
export default function PlanoEditor() {
  const { id, planoId } = useParams()
  const nav = useNavigate()
  const queryClient = useQueryClient()

  const paciente = useQuery({ queryKey: ['pacientes', id], queryFn: () => api(`/pacientes/${id}`) })
  const base = useQuery({ queryKey: ['planos', planoId], queryFn: () => api(`/planos/${planoId}`), enabled: !!planoId })

  const [formula, setFormula] = useState('mifflin')
  const [atividade, setAtividade] = useState('moderado')
  const [nome, setNome] = useState('Plano alimentar personalizado')
  const [kcalAlvo, setKcalAlvo] = useState(1700)
  const [macros, setMacros] = useState({ pctCarbo: 40, pctProteina: 30, pctGordura: 30 })
  const [refeicoes, setRefeicoes] = useState(null)

  // inicializa o formulário com a versão base (edição) ou um modelo vazio (novo)
  useEffect(() => {
    if (refeicoes) return
    if (planoId && base.data) {
      setNome(base.data.nome)
      setKcalAlvo(base.data.kcalAlvo)
      setMacros({ pctCarbo: base.data.pctCarbo, pctProteina: base.data.pctProteina, pctGordura: base.data.pctGordura })
      setRefeicoes(paraEdicao(base.data))
    } else if (!planoId) {
      setRefeicoes(REFEICOES_PADRAO())
    }
  }, [planoId, base.data, refeicoes])

  const salvar = useMutation({
    mutationFn: (corpo) => api(`/pacientes/${id}/planos`, { method: 'POST', body: corpo }),
    onSuccess: (plano) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] })
      queryClient.invalidateQueries({ queryKey: ['planos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(planoId ? `Nova versão (v${plano.versao}) criada` : 'Plano alimentar criado')
      nav(`/nutri/pacientes/${id}/plano/${plano.id}`, { replace: true })
    },
    onError: (e) => toast.error(e.message),
  })

  if (paciente.isLoading || (planoId && base.isLoading) || !refeicoes) return <Carregando />
  if (paciente.error) return <ErroCarregamento erro={paciente.error} />
  if (base.error) return <ErroCarregamento erro={base.error} />

  const p = paciente.data
  const podeCalcular = p.pesoAtualKg && p.alturaCm && p.idade && p.sexo
  const tmb = podeCalcular
    ? formula === 'mifflin'
      ? mifflinStJeor(p.pesoAtualKg, p.alturaCm, p.idade, p.sexo)
      : harrisBenedict(p.pesoAtualKg, p.alturaCm, p.idade, p.sexo)
    : 0
  const get = calcularGET(tmb, atividade)
  const sugerido = Math.round(ajustarParaObjetivo(get, p.objetivo))
  const g = macroGramas(kcalAlvo, macros)
  const somaMacros = macros.pctCarbo + macros.pctProteina + macros.pctGordura
  const totalKcal = refeicoes.reduce((s, r) => s + totaisRefeicao(r).kcal, 0)

  const enviar = () => {
    if (somaMacros !== 100) return toast.error('Os macronutrientes devem somar 100%')
    if (!refeicoes.length) return toast.error('Adicione ao menos uma refeição')
    salvar.mutate({
      nome,
      kcalAlvo,
      ...macros,
      refeicoes: refeicoes.map((r) => ({
        nome: r.nome,
        horario: r.horario,
        itens: r.itens.map((i) => ({
          alimentoId: i.alimento.id,
          gramas: i.gramas,
          substitutos: i.substitutos.map((s) => ({ alimentoId: s.alimento.id, gramas: s.gramas })),
        })),
      })),
    })
  }

  const atualizarRefeicao = (idx, nova) => setRefeicoes((rs) => rs.map((r, i) => (i === idx ? nova : r)))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={`/nutri/pacientes/${p.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar para {p.nome}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
          <Button onClick={enviar} loading={salvar.isPending}>
            Salvar plano
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-semibold">{planoId ? 'Editar' : 'Criar'} plano alimentar</h1>
        <span className="text-muted-foreground">para {p.nome}</span>
      </div>
      {planoId && base.data && (
        <p className="text-sm text-muted-foreground -mt-3">
          Editando a partir da versão v{base.data.versao}. Ao salvar, uma nova versão será criada e passará a ser o plano ativo (o histórico é
          preservado).
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 space-y-5 self-start lg:sticky lg:top-24">
          <div>
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" /> Calculadora automática
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {podeCalcular
                ? `${p.pesoAtualKg}kg · ${p.alturaCm}cm · ${p.idade} anos · ${p.sexo === 'F' ? 'Feminino' : 'Masculino'}`
                : 'Preencha peso, altura, idade e sexo do paciente (aba Avaliação) para usar a calculadora.'}
            </p>
          </div>

          {podeCalcular && (
            <>
              <Field label="Fórmula">
                {(fid) => (
                  <Select id={fid} value={formula} onChange={(e) => setFormula(e.target.value)}>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="harris">Harris-Benedict</option>
                  </Select>
                )}
              </Field>
              <Field label="Nível de atividade">
                {(fid) => (
                  <Select id={fid} value={atividade} onChange={(e) => setAtividade(e.target.value)}>
                    <option value="sedentario">Sedentário</option>
                    <option value="leve">Leve (1-3x/sem)</option>
                    <option value="moderado">Moderado (3-5x/sem)</option>
                    <option value="intenso">Intenso (6-7x/sem)</option>
                    <option value="muitoIntenso">Muito intenso</option>
                  </Select>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">TMB</p>
                  <p className="text-xl font-display font-semibold">{Math.round(tmb)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GET</p>
                  <p className="text-xl font-display font-semibold">{Math.round(get)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Sugerido para "{objetivoLabel(p.objetivo)}"</p>
                  <p className="text-2xl font-display font-semibold text-primary">{sugerido} kcal</p>
                  <Button variant="link" className="text-xs" onClick={() => setKcalAlvo(sugerido)}>
                    Aplicar valor sugerido →
                  </Button>
                </div>
              </div>
            </>
          )}

          <Field label="Calorias alvo" className="pt-2 border-t border-border">
            {(fid) => <Input id={fid} type="number" value={kcalAlvo} onChange={(e) => setKcalAlvo(Math.max(0, Math.round(+e.target.value)))} />}
          </Field>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Macronutrientes</span>
              <span className={`text-xs font-medium ${somaMacros === 100 ? 'text-leaf' : 'text-destructive'}`}>{somaMacros}%</span>
            </div>
            <MacroSlider rotulo="Carboidratos" cor="var(--chart-3)" valor={macros.pctCarbo} gramas={g.carbo} onChange={(v) => setMacros({ ...macros, pctCarbo: v })} />
            <MacroSlider rotulo="Proteínas" cor="var(--primary)" valor={macros.pctProteina} gramas={g.proteina} onChange={(v) => setMacros({ ...macros, pctProteina: v })} />
            <MacroSlider rotulo="Gorduras" cor="var(--terracotta)" valor={macros.pctGordura} gramas={g.gordura} onChange={(v) => setMacros({ ...macros, pctGordura: v })} />
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-end gap-3 justify-between">
              <Field label="Nome do plano" className="flex-1 min-w-[200px]">
                {(fid) => <Input id={fid} value={nome} onChange={(e) => setNome(e.target.value)} />}
              </Field>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total atual</p>
                <p className={`text-2xl font-display font-semibold ${Math.abs(totalKcal - kcalAlvo) <= kcalAlvo * 0.05 ? 'text-primary' : 'text-terracotta'}`}>
                  {totalKcal} kcal
                </p>
                <p className="text-xs text-muted-foreground">Alvo: {kcalAlvo} kcal</p>
              </div>
            </div>
          </Card>

          {refeicoes.map((r, idx) => (
            <RefeicaoBloco
              key={r.key}
              refeicao={r}
              onChange={(nova) => atualizarRefeicao(idx, nova)}
              onRemover={() => setRefeicoes((rs) => rs.filter((_, i) => i !== idx))}
            />
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setRefeicoes([...refeicoes, { key: chave(), nome: 'Nova refeição', horario: '12:00', itens: [] }])}
          >
            <Plus className="h-4 w-4" /> Adicionar refeição
          </Button>
        </div>
      </div>
    </div>
  )
}

function MacroSlider({ rotulo, cor, valor, gramas, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: cor }} />
          {rotulo}
        </span>
        <span className="font-medium">
          {valor}% · {gramas}g
        </span>
      </div>
      <input type="range" min={5} max={70} step={1} value={valor} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--primary)]" aria-label={rotulo} />
    </div>
  )
}

function RefeicaoBloco({ refeicao, onChange, onRemover }) {
  const [escolhendo, setEscolhendo] = useState(false)
  const atualizarItem = (idx, novo) => onChange({ ...refeicao, itens: refeicao.itens.map((x, i) => (i === idx ? novo : x)) })

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Input className="max-w-[220px]" value={refeicao.nome} onChange={(e) => onChange({ ...refeicao, nome: e.target.value })} aria-label="Nome da refeição" />
        <Input type="time" className="max-w-[120px]" value={refeicao.horario} onChange={(e) => onChange({ ...refeicao, horario: e.target.value })} aria-label="Horário" />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-mono text-primary">{totaisRefeicao(refeicao).kcal} kcal</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemover} title="Remover refeição">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {refeicao.itens.map((item, i) => (
          <ItemLinha
            key={item.key}
            item={item}
            onChange={(novo) => atualizarItem(i, novo)}
            onRemover={() => onChange({ ...refeicao, itens: refeicao.itens.filter((_, j) => j !== i) })}
          />
        ))}
      </ul>

      <Button variant="outline" size="sm" className="mt-3 w-full border-dashed" onClick={() => setEscolhendo(true)}>
        <Plus className="h-4 w-4" /> Adicionar alimento
      </Button>

      <FoodPicker
        open={escolhendo}
        onClose={() => setEscolhendo(false)}
        onPick={(alimento) => {
          onChange({ ...refeicao, itens: [...refeicao.itens, { key: chave(), alimento, gramas: 100, substitutos: [] }] })
          setEscolhendo(false)
        }}
      />
    </Card>
  )
}

function ItemLinha({ item, onChange, onRemover }) {
  const [substituicoes, setSubstituicoes] = useState(false)
  const c = calcularAlimento(item.alimento, item.gramas)
  return (
    <li className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
      <span className="text-xl">{iconeAlimento(item.alimento)}</span>
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium">{item.alimento.nome}</p>
        <p className="text-xs text-muted-foreground">
          {c.kcal} kcal · C {c.carbo}g · P {c.proteina}g · G {c.gordura}g · {item.substitutos.length} substituições
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Input type="number" min="1" className="w-20 h-8" value={item.gramas} onChange={(e) => onChange({ ...item, gramas: Math.max(0, +e.target.value || 0) })} aria-label="Gramas" />
        <span className="text-xs text-muted-foreground">g</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => setSubstituicoes(true)}>
        <Replace className="h-3.5 w-3.5" /> Substituições
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onRemover} title="Remover alimento">
        <X className="h-4 w-4" />
      </Button>
      <SubstituicoesModal open={substituicoes} onClose={() => setSubstituicoes(false)} item={item} onChange={onChange} />
    </li>
  )
}

// RF12 / RN12 - Substitutos com gramagem equivalente calculada automaticamente
function SubstituicoesModal({ open, onClose, item, onChange }) {
  const [escolhendo, setEscolhendo] = useState(false)
  const original = calcularAlimento(item.alimento, item.gramas)
  const atualizar = (idx, novo) => onChange({ ...item, substitutos: item.substitutos.map((s, i) => (i === idx ? novo : s)) })

  return (
    <>
      <Modal
        open={open && !escolhendo}
        onClose={onClose}
        title="Lista de substituição"
        description={`Equivalentes para ${item.alimento.nome} (${item.gramas} g · ${original.kcal} kcal). A gramagem é ajustada para manter a mesma energia.`}
        footer={<Button onClick={onClose}>Pronto</Button>}
      >
        <ul className="space-y-2 max-h-72 overflow-auto">
          {item.substitutos.map((s, i) => {
            const cs = calcularAlimento(s.alimento, s.gramas)
            return (
              <li key={s.key} className="flex items-center gap-2 p-2 border border-border rounded-lg text-sm">
                <span>{iconeAlimento(s.alimento)}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{s.alimento.nome}</p>
                  <p className="text-xs text-muted-foreground">{cs.kcal} kcal</p>
                </div>
                <Input type="number" min="1" className="w-20 h-8" value={s.gramas} onChange={(e) => atualizar(i, { ...s, gramas: Math.max(0, +e.target.value || 0) })} aria-label="Gramas do substituto" />
                <span className="text-xs text-muted-foreground">g</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Recalcular gramagem equivalente"
                  onClick={() => atualizar(i, { ...s, gramas: gramasEquivalentes(item.alimento, item.gramas, s.alimento) })}
                >
                  <Scale className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange({ ...item, substitutos: item.substitutos.filter((_, j) => j !== i) })} title="Remover">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            )
          })}
          {item.substitutos.length === 0 && <li className="text-sm text-muted-foreground text-center py-3">Nenhum equivalente ainda.</li>}
        </ul>
        <Button variant="outline" className="w-full mt-3" onClick={() => setEscolhendo(true)}>
          <Plus className="h-4 w-4" /> Adicionar equivalente
        </Button>
      </Modal>
      <FoodPicker
        open={open && escolhendo}
        titulo="Escolher equivalente"
        onClose={() => setEscolhendo(false)}
        onPick={(alimento) => {
          onChange({
            ...item,
            substitutos: [...item.substitutos, { key: chave(), alimento, gramas: gramasEquivalentes(item.alimento, item.gramas, alimento) }],
          })
          setEscolhendo(false)
        }}
      />
    </>
  )
}
