import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, Trash2, CheckCheck, User, KeyRound, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, Carregando, ErroCarregamento } from '../components/ui'
import { SenhaGeradaModal } from '../components/SenhaGeradaModal'
import { api } from '../lib/api'
import { dataHoraBR } from '../lib/format'

const CAMPO = { nome: 'Nome', email: 'E-mail', telefone: 'Telefone' }

// Pedidos de nova senha (RN09) e alterações de perfil feitas pelos pacientes (RN18)
export default function Notificacoes() {
  const queryClient = useQueryClient()
  const [senhaGerada, setSenhaGerada] = useState(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['notificacoes', 'lista'], queryFn: () => api('/notificacoes') })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })

  const marcarLidas = useMutation({ mutationFn: () => api('/notificacoes/alteracoes/lidas', { method: 'PATCH' }), onSuccess: invalidar })
  const limpar = useMutation({
    mutationFn: () => api('/notificacoes/alteracoes', { method: 'DELETE' }),
    onSuccess: () => {
      invalidar()
      toast.success('Atualizações removidas')
    },
  })
  const aprovar = useMutation({
    mutationFn: (pedido) => api(`/notificacoes/pedidos-senha/${pedido.id}/aprovar`, { method: 'POST' }),
    onSuccess: (r) => {
      invalidar()
      setSenhaGerada({ email: r.email, senha: r.novaSenha, emailEnviado: r.emailEnviado })
    },
    onError: (e) => toast.error(e.message),
  })
  const negar = useMutation({
    mutationFn: (pedido) => api(`/notificacoes/pedidos-senha/${pedido.id}/negar`, { method: 'POST' }),
    onSuccess: () => {
      invalidar()
      toast.success('Pedido negado')
    },
    onError: (e) => toast.error(e.message),
  })

  // ao abrir a página, as alterações de perfil passam a contar como lidas
  const temNaoLidas = data?.alteracoes.some((a) => !a.lida)
  useEffect(() => {
    if (temNaoLidas) marcarLidas.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temNaoLidas])

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const { alteracoes, pedidosSenhaPendentes: pendentes, pedidosSenhaResolvidos: resolvidos } = data

  return (
    <div className="pagina pagina-estreita" style={{ gap: 20 }}>
      <div className="cabecalho-pagina" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="titulo-pagina titulo-icone" style={{ fontSize: 24 }}>
            <Bell size={24} /> Notificações
          </h1>
          <p className="subtitulo-pagina">Pedidos de redefinição de senha e alterações de perfil dos pacientes.</p>
        </div>
        {alteracoes.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => limpar.mutate()} loading={limpar.isPending}>
            <Trash2 /> Limpar atualizações
          </Button>
        )}
      </div>

      <section className="pilha-sm">
        <h2 className="rotulo-maiusculo linha-sm" style={{ fontFamily: 'var(--fonte-texto)', fontSize: 13 }}>
          <KeyRound size={16} /> Pedidos de nova senha ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <Card className="texto-suave">Nenhum pedido pendente.</Card>
        ) : (
          pendentes.map((r) => (
            <Card key={r.id} className="card-compacto linha linha-quebra alinhar-topo">
              <div className="icone-caixa icone-caixa-alerta">
                <KeyRound />
              </div>
              <div className="expandir" style={{ minWidth: 200 }}>
                <p className="texto-medio">{r.paciente?.nome ?? 'Paciente'}</p>
                <p className="texto-pequeno texto-suave">{r.paciente?.email}</p>
                <p style={{ marginTop: 4 }}>Solicitou uma nova senha pelo app. Ao aprovar, geramos uma senha e enviamos para o e-mail do paciente.</p>
                <p className="texto-pequeno texto-suave" style={{ marginTop: 4 }}>
                  {dataHoraBR(r.createdAt, true)}
                </p>
              </div>
              <div className="acoes">
                <Button size="sm" variant="outline" onClick={() => negar.mutate(r)} loading={negar.isPending && negar.variables?.id === r.id}>
                  <X /> Negar
                </Button>
                <Button size="sm" onClick={() => aprovar.mutate(r)} loading={aprovar.isPending && aprovar.variables?.id === r.id}>
                  <Check /> Aprovar e enviar
                </Button>
              </div>
            </Card>
          ))
        )}

        {resolvidos.length > 0 && (
          <details className="texto-pequeno texto-suave">
            <summary style={{ cursor: 'pointer', padding: '8px 0' }}>Pedidos recentes resolvidos</summary>
            <ul className="lista-divisoria">
              {resolvidos.map((r) => (
                <li key={r.id} className="linha entre" style={{ padding: '6px 0' }}>
                  <span>{r.paciente?.nome ?? '—'}</span>
                  <span className="linha-sm">
                    {dataHoraBR(r.resolvidaEm)}
                    <Badge variant="outline" className="selo-mini">
                      {r.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="pilha-sm">
        <h2 className="rotulo-maiusculo" style={{ fontFamily: 'var(--fonte-texto)', fontSize: 13 }}>
          Alterações de perfil ({alteracoes.length})
        </h2>
        {alteracoes.length === 0 ? (
          <Card className="card-vazio">
            <CheckCheck className="cor-primaria" />
            <p>Nenhuma notificação no momento.</p>
          </Card>
        ) : (
          alteracoes.map((u) => (
            <Card key={u.id} className="card-compacto linha alinhar-topo" style={u.lida ? undefined : { borderColor: 'oklch(0.42 0.09 142 / 0.4)' }}>
              <div className="icone-caixa icone-caixa-primaria">
                <User />
              </div>
              <div className="expandir">
                <div className="linha-sm linha-quebra">
                  <Link to={`/nutri/pacientes/${u.pacienteId}`} className="texto-medio link-texto">
                    {u.paciente?.nome ?? 'Paciente'}
                  </Link>
                  <Badge variant="outline" className="selo-mini">
                    {CAMPO[u.campo] ?? u.campo}
                  </Badge>
                  {!u.lida && <Badge className="selo-mini">nova</Badge>}
                </div>
                <p className="quebrar" style={{ marginTop: 4 }}>
                  Alterou <span className="texto-medio">{CAMPO[u.campo] ?? u.campo}</span>:{' '}
                  <span className="riscado texto-suave">{u.valorAntigo || '(vazio)'}</span> →{' '}
                  <span className="texto-medio cor-primaria">{u.valorNovo || '(vazio)'}</span>
                </p>
                <p className="texto-pequeno texto-suave" style={{ marginTop: 4 }}>
                  {dataHoraBR(u.createdAt, true)}
                </p>
              </div>
            </Card>
          ))
        )}
      </section>

      <SenhaGeradaModal dados={senhaGerada} onClose={() => setSenhaGerada(null)} titulo="Nova senha gerada" />
    </div>
  )
}
