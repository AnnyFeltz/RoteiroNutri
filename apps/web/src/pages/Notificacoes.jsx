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
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pedidos de redefinição de senha e alterações de perfil dos pacientes.</p>
        </div>
        {alteracoes.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => limpar.mutate()} loading={limpar.isPending}>
            <Trash2 className="h-4 w-4" /> Limpar atualizações
          </Button>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 font-sans">
          <KeyRound className="h-4 w-4" /> Pedidos de nova senha ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">Nenhum pedido pendente.</Card>
        ) : (
          pendentes.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{r.paciente?.nome ?? 'Paciente'}</p>
                  <p className="text-xs text-muted-foreground">{r.paciente?.email}</p>
                  <p className="text-sm mt-1">Solicitou uma nova senha pelo app. Ao aprovar, geramos uma senha e enviamos para o e-mail do paciente.</p>
                  <p className="text-xs text-muted-foreground mt-1">{dataHoraBR(r.createdAt, true)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => negar.mutate(r)} loading={negar.isPending && negar.variables?.id === r.id}>
                    <X className="h-4 w-4" /> Negar
                  </Button>
                  <Button size="sm" onClick={() => aprovar.mutate(r)} loading={aprovar.isPending && aprovar.variables?.id === r.id}>
                    <Check className="h-4 w-4" /> Aprovar e enviar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}

        {resolvidos.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer py-2">Pedidos recentes resolvidos</summary>
            <ul className="space-y-1 mt-1">
              {resolvidos.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 border-b border-border py-1.5">
                  <span>{r.paciente?.nome ?? '—'}</span>
                  <span className="flex items-center gap-2">
                    {dataHoraBR(r.resolvidaEm)}
                    <Badge variant="outline" className="text-[10px]">
                      {r.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-sans">Alterações de perfil ({alteracoes.length})</h2>
        {alteracoes.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCheck className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação no momento.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {alteracoes.map((u) => (
              <Card key={u.id} className={`p-4 ${u.lida ? '' : 'border-primary/40'}`}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/nutri/pacientes/${u.pacienteId}`} className="font-medium hover:underline">
                        {u.paciente?.nome ?? 'Paciente'}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        {CAMPO[u.campo] ?? u.campo}
                      </Badge>
                      {!u.lida && <Badge className="text-[10px]">nova</Badge>}
                    </div>
                    <p className="text-sm mt-1 break-words">
                      Alterou <span className="font-medium">{CAMPO[u.campo] ?? u.campo}</span>:{' '}
                      <span className="line-through text-muted-foreground">{u.valorAntigo || '(vazio)'}</span> →{' '}
                      <span className="font-medium text-primary">{u.valorNovo || '(vazio)'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{dataHoraBR(u.createdAt, true)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <SenhaGeradaModal dados={senhaGerada} onClose={() => setSenhaGerada(null)} titulo="Nova senha gerada" />
    </div>
  )
}
