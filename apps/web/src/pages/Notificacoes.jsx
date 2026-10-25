import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, Trash2, CheckCheck, User } from 'lucide-react'
import { useEffect } from 'react'
import { Badge, Button, Card, Carregando, ErroCarregamento } from '../components/ui'
import { api } from '../lib/api'
import { dataHoraBR } from '../lib/format'

const CAMPO = { nome: 'Nome', email: 'E-mail', telefone: 'Telefone', peso: 'Peso (kg)', altura: 'Altura (cm)' }

// Alterações de perfil feitas pelos pacientes (RN18)
export default function Notificacoes() {
  const queryClient = useQueryClient()
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
  // ao abrir a página, as alterações de perfil passam a contar como lidas
  const temNaoLidas = data?.alteracoes.some((a) => !a.lida)
  useEffect(() => {
    if (temNaoLidas) marcarLidas.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temNaoLidas])

  if (isLoading) return <Carregando />
  if (error) return <ErroCarregamento erro={error} onTentar={refetch} />

  const { alteracoes } = data

  return (
    <div className="pagina pagina-estreita" style={{ gap: 20 }}>
      <div className="cabecalho-pagina" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="titulo-pagina titulo-icone" style={{ fontSize: 24 }}>
            <Bell size={24} /> Notificações
          </h1>
          <p className="subtitulo-pagina">Alterações de perfil feitas pelos pacientes no app.</p>
        </div>
        {alteracoes.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => limpar.mutate()} loading={limpar.isPending}>
            <Trash2 /> Limpar atualizações
          </Button>
        )}
      </div>

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

    </div>
  )
}
