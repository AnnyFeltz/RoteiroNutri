import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Calculator, Replace, X, Scale } from 'lucide-react'
import {
  mifflinStJeor, harrisBenedict, calcularGET, ajustarParaObjetivo, macroGramas, calcularAlimento, totaisRefeicao,
  gramasEquivalentes, iconeAlimento, planoAlimentarSchema,
} from '@RoteiroNutri/shared'
import { Button, Card, Carregando, ErroCarregamento, Field, Input, Modal, Select } from '../components/ui'
import { FoodPicker } from '../components/FoodPicker'
import { api } from '../lib/api'
import { objetivoLabel } from '../lib/format'
import { validar } from '../lib/validacao'

let contador = 0
const chave = () => `k${++contador}`

const REFEICOES_PADRAO = () => [
  { key: chave(), nome: 'Café da manhã', horario: '08:00', itens: [] },
  { key: chave(), nome: 'Almoço', horario: '12:30', itens: [] },
  { key: chave(), nome: 'Lanche da tarde', horario: '16:00', itens: [] },
  { key: chave(), nome: 'Jantar', horario: '19:00', itens: [] },
]

// RN12 - gramagem do substituto que mantém a mesma energia do alimento original
const gramasDoSubstituto = (item, s) => gramasEquivalentes(item.alimento, item.gramas, s.alimento)
const foraDeEquivalencia = (item) => item.substitutos.filter((s) => s.gramas !== gramasDoSubstituto(item, s)).length
const equivalerItem = (item) => ({ ...item, substitutos: item.substitutos.map((s) => ({ ...s, gramas: gramasDoSubstituto(item, s) })) })

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
    // o mesmo schema Zod que a API usa (macros somando 100%, gramagens positivas...)
    const dados = validar(planoAlimentarSchema, {
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
    if (dados) salvar.mutate(dados)
  }

  const atualizarRefeicao = (idx, nova) => setRefeicoes((rs) => rs.map((r, i) => (i === idx ? nova : r)))

  // Recalcula de uma vez a gramagem de todos os substitutos do plano
  const desalinhados = refeicoes.reduce((n, r) => n + r.itens.reduce((m, item) => m + foraDeEquivalencia(item), 0), 0)
  const equivalerTodos = () => {
    setRefeicoes((rs) => rs.map((r) => ({ ...r, itens: r.itens.map(equivalerItem) })))
    toast.success(`${desalinhados} substituto${desalinhados === 1 ? '' : 's'} ajustado${desalinhados === 1 ? '' : 's'} para a mesma energia do alimento`)
  }
  const diferencaOk = Math.abs(totalKcal - kcalAlvo) <= kcalAlvo * 0.05

  return (
    <div className="pagina" style={{ gap: 20 }}>
      <div className="cabecalho-pagina" style={{ alignItems: 'center' }}>
        <Link to={`/nutri/pacientes/${p.id}`} className="link-voltar">
          <ArrowLeft size={16} /> Voltar para {p.nome}
        </Link>
        <div className="acoes">
          <Button
            variant="outline"
            onClick={equivalerTodos}
            disabled={desalinhados === 0}
            title={desalinhados ? 'Recalcula a gramagem de todos os substitutos do plano' : 'Todos os substitutos já estão equivalentes'}
          >
            <Scale /> Equivaler substitutos{desalinhados > 0 && ` (${desalinhados})`}
          </Button>
          <Button variant="outline" onClick={() => nav(-1)}>
            Cancelar
          </Button>
          <Button onClick={enviar} loading={salvar.isPending}>
            Salvar plano
          </Button>
        </div>
      </div>

      <div>
        <div className="linha linha-quebra alinhar-base">
          <h1 className="titulo-pagina">{planoId ? 'Editar' : 'Criar'} plano alimentar</h1>
          <span className="texto-suave">para {p.nome}</span>
        </div>
        {planoId && base.data && (
          <p className="texto-suave" style={{ marginTop: 4 }}>
            Editando a partir da versão v{base.data.versao}. Ao salvar, uma nova versão será criada e passará a ser o plano ativo (o histórico é
            preservado).
          </p>
        )}
      </div>

      <div className="grade grade-3-lg" style={{ gap: 20 }}>
        <Card className="pilha-lg fixo-no-topo">
          <div>
            <h3 className="titulo-card linha-sm">
              <Calculator size={16} className="cor-primaria" /> Calculadora automática
            </h3>
            <p className="texto-pequeno texto-suave" style={{ marginTop: 4 }}>
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
              <div className="grade grade-2 separador-topo" style={{ gap: 12 }}>
                <div>
                  <p className="texto-pequeno texto-suave">TMB</p>
                  <p className="numero-pequeno">{Math.round(tmb)}</p>
                </div>
                <div>
                  <p className="texto-pequeno texto-suave">GET</p>
                  <p className="numero-pequeno">{Math.round(get)}</p>
                </div>
                <div className="ocupa-tudo">
                  <p className="texto-pequeno texto-suave">Sugerido para "{objetivoLabel(p.objetivo)}"</p>
                  <p className="numero-medio cor-primaria">{sugerido} kcal</p>
                  <Button variant="link" className="texto-pequeno" onClick={() => setKcalAlvo(sugerido)}>
                    Aplicar valor sugerido →
                  </Button>
                </div>
              </div>
            </>
          )}

          <Field label="Calorias alvo" className="separador-topo">
            {(fid) => <Input id={fid} type="number" value={kcalAlvo} onChange={(e) => setKcalAlvo(Math.max(0, Math.round(+e.target.value)))} />}
          </Field>

          <div className="pilha separador-topo">
            <div className="linha entre">
              <span className="texto-medio">Macronutrientes</span>
              <span className={`texto-pequeno texto-medio ${somaMacros === 100 ? 'cor-folha' : 'cor-perigo'}`}>{somaMacros}%</span>
            </div>
            <MacroSlider rotulo="Carboidratos" cor="var(--grafico-carbo)" valor={macros.pctCarbo} gramas={g.carbo} onChange={(v) => setMacros({ ...macros, pctCarbo: v })} />
            <MacroSlider rotulo="Proteínas" cor="var(--primaria)" valor={macros.pctProteina} gramas={g.proteina} onChange={(v) => setMacros({ ...macros, pctProteina: v })} />
            <MacroSlider rotulo="Gorduras" cor="var(--terracota)" valor={macros.pctGordura} gramas={g.gordura} onChange={(v) => setMacros({ ...macros, pctGordura: v })} />
          </div>
        </Card>

        <div className="pilha ocupa-2-lg" style={{ gap: 16 }}>
          <Card className="cabecalho-pagina" style={{ alignItems: 'flex-end' }}>
            <Field label="Nome do plano" className="expandir" >
              {(fid) => <Input id={fid} value={nome} onChange={(e) => setNome(e.target.value)} />}
            </Field>
            <div className="direita">
              <p className="texto-pequeno texto-suave">Total atual</p>
              <p className={`numero-medio ${diferencaOk ? 'cor-primaria' : 'cor-terracota'}`}>{totalKcal} kcal</p>
              <p className="texto-pequeno texto-suave">Alvo: {kcalAlvo} kcal</p>
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

          <Button variant="outline" className="btn-bloco btn-tracejado" onClick={() => setRefeicoes([...refeicoes, { key: chave(), nome: 'Nova refeição', horario: '12:00', itens: [] }])}>
            <Plus /> Adicionar refeição
          </Button>
        </div>
      </div>
    </div>
  )
}

function MacroSlider({ rotulo, cor, valor, gramas, onChange }) {
  return (
    <div>
      <div className="linha entre texto-pequeno" style={{ marginBottom: 6 }}>
        <span className="linha-sm">
          <span className="ponto" style={{ background: cor }} />
          {rotulo}
        </span>
        <span className="texto-medio">
          {valor}% · {gramas}g
        </span>
      </div>
      <input type="range" min={5} max={70} step={1} value={valor} onChange={(e) => onChange(+e.target.value)} className="faixa" aria-label={rotulo} />
    </div>
  )
}

function RefeicaoBloco({ refeicao, onChange, onRemover }) {
  const [escolhendo, setEscolhendo] = useState(false)
  const atualizarItem = (idx, novo) => onChange({ ...refeicao, itens: refeicao.itens.map((x, i) => (i === idx ? novo : x)) })

  return (
    <Card>
      <div className="linha linha-quebra">
        <Input className="campo-medio" value={refeicao.nome} onChange={(e) => onChange({ ...refeicao, nome: e.target.value })} aria-label="Nome da refeição" />
        <Input type="time" className="campo-horario" value={refeicao.horario} onChange={(e) => onChange({ ...refeicao, horario: e.target.value })} aria-label="Horário" />
        <div className="linha empurrar">
          <span className="mono cor-primaria">{totaisRefeicao(refeicao).kcal} kcal</span>
          <Button variant="ghost" size="icon" className="btn-acao-perigo" onClick={onRemover} title="Remover refeição">
            <Trash2 />
          </Button>
        </div>
      </div>

      <ul className="pilha-sm" style={{ marginTop: 16 }}>
        {refeicao.itens.map((item, i) => (
          <ItemLinha
            key={item.key}
            item={item}
            onChange={(novo) => atualizarItem(i, novo)}
            onRemover={() => onChange({ ...refeicao, itens: refeicao.itens.filter((_, j) => j !== i) })}
          />
        ))}
      </ul>

      <Button variant="outline" size="sm" className="btn-bloco btn-tracejado" style={{ marginTop: 12 }} onClick={() => setEscolhendo(true)}>
        <Plus /> Adicionar alimento
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
  const fora = foraDeEquivalencia(item)
  return (
    <li className="item-plano">
      <span className="emoji">{iconeAlimento(item.alimento)}</span>
      <div className="expandir" style={{ minWidth: 180 }}>
        <p className="texto-medio">{item.alimento.nome}</p>
        <p className="texto-pequeno texto-suave">
          {c.kcal} kcal · C {c.carbo}g · P {c.proteina}g · G {c.gordura}g · {item.substitutos.length} substituições
          {fora > 0 && (
            <button type="button" className="aviso-equivalencia" onClick={() => onChange(equivalerItem(item))} title="Recalcular a gramagem dos substitutos deste alimento">
              <Scale size={12} /> {fora} fora de equivalência — equivaler
            </button>
          )}
        </p>
      </div>
      <div className="linha-sm">
        <Input type="number" min="1" className="campo-curto" value={item.gramas} onChange={(e) => onChange({ ...item, gramas: Math.max(0, +e.target.value || 0) })} aria-label="Gramas" />
        <span className="texto-pequeno texto-suave">g</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => setSubstituicoes(true)}>
        <Replace /> Substituições
      </Button>
      <Button variant="ghost" size="icon" onClick={onRemover} title="Remover alimento">
        <X />
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
  const fora = foraDeEquivalencia(item)

  return (
    <>
      <Modal
        open={open && !escolhendo}
        onClose={onClose}
        title="Lista de substituição"
        description={`Equivalentes para ${item.alimento.nome} (${item.gramas} g · ${original.kcal} kcal). A gramagem é ajustada para manter a mesma energia.`}
        footer={<Button onClick={onClose}>Pronto</Button>}
      >
        <ul className="pilha-sm lista-rolavel">
          {item.substitutos.map((s, i) => {
            const cs = calcularAlimento(s.alimento, s.gramas)
            return (
              <li key={s.key} className="item-substituto">
                <span>{iconeAlimento(s.alimento)}</span>
                <div className="expandir">
                  <p className="cortar">{s.alimento.nome}</p>
                  <p className="texto-pequeno texto-suave">{cs.kcal} kcal</p>
                </div>
                <Input type="number" min="1" className="campo-curto" value={s.gramas} onChange={(e) => atualizar(i, { ...s, gramas: Math.max(0, +e.target.value || 0) })} aria-label="Gramas do substituto" />
                <span className="texto-pequeno texto-suave">g</span>
                <Button variant="ghost" size="icon" title="Recalcular gramagem equivalente" onClick={() => atualizar(i, { ...s, gramas: gramasDoSubstituto(item, s) })}>
                  <Scale />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onChange({ ...item, substitutos: item.substitutos.filter((_, j) => j !== i) })} title="Remover">
                  <X />
                </Button>
              </li>
            )
          })}
          {item.substitutos.length === 0 && <li className="centro texto-suave" style={{ padding: '12px 0' }}>Nenhum equivalente ainda.</li>}
        </ul>
        <div className="linha" style={{ marginTop: 12 }}>
          <Button variant="outline" className="expandir" onClick={() => setEscolhendo(true)}>
            <Plus /> Adicionar equivalente
          </Button>
          <Button variant="outline" onClick={() => onChange(equivalerItem(item))} disabled={fora === 0} title="Recalcula a gramagem de todos os substitutos deste alimento">
            <Scale /> Equivaler todos
          </Button>
        </div>
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
