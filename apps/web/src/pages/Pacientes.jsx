import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Search, UserX, Apple, FileText, RotateCcw } from 'lucide-react'
import { imc } from '@RoteiroNutri/shared'
import { Avatar, Badge, Button, Card, Carregando, ConfirmDialog, ErroCarregamento, Input, Modal, Segmented } from '../components/ui'
import { PacienteForm } from '../components/PacienteForm'
import { SenhaGeradaModal } from '../components/SenhaGeradaModal'
import { api } from '../lib/api'
import { dataBR, objetivoLabel } from '../lib/format'

// RF04 / RF06 / RF07 - Listar, cadastrar e desativar pacientes
export default function Pacientes() {
  const [params, setParams] = useSearchParams()
  const busca = params.get('busca') || ''
  const [filtro, setFiltro] = useState('ativos')
  const [novoAberto, setNovoAberto] = useState(false)
  const [credenciais, setCredenciais] = useState(null)
  const [desativando, setDesativando] = useState(null)
  const queryClient = useQueryClient()

  const { data: pacientes, isLoading, error, refetch } = useQuery({
    queryKey: ['pacientes', { busca, filtro }],
    queryFn: () => api('/pacientes', { query: { busca, status: filtro === 'todos' ? undefined : filtro } }),
    placeholderData: (anterior) => anterior,
  })

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['planos'] })
  }

  const cadastrar = useMutation({
    mutationFn: (dados) => api('/pacientes', { method: 'POST', body: dados }),
    onSuccess: (r) => {
      invalidar()
      setNovoAberto(false)
      setCredenciais({ email: r.paciente.email, senha: r.senhaProvisoria, emailEnviado: r.emailEnviado })
      toast.success('Paciente cadastrado')
    },
    onError: (e) => toast.error(e.message),
  })

  const desativar = useMutation({
    mutationFn: (p) => api(`/pacientes/${p.id}/desativar`, { method: 'PATCH' }),
    onSuccess: (_, p) => {
      invalidar()
      setDesativando(null)
      toast.success(`${p.nome} desativado(a). Plano alimentar suspenso.`)
    },
    onError: (e) => toast.error(e.message),
  })

  const reativar = useMutation({
    mutationFn: (p) => api(`/pacientes/${p.id}/reativar`, { method: 'PATCH' }),
    onSuccess: (_, p) => {
      invalidar()
      toast.success(`${p.nome} reativado(a). Plano anterior restaurado.`)
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus pacientes e seus planos.</p>
        </div>
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="h-4 w-4" /> Novo paciente
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setParams(e.target.value ? { busca: e.target.value } : {}, { replace: true })}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9 bg-background"
            />
          </div>
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'ativos', label: 'Ativos' },
              { value: 'inativos', label: 'Inativos' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
        </div>
      </Card>

      {isLoading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregamento erro={error} onTentar={refetch} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Paciente</th>
                <th className="px-3 py-3">Objetivo</th>
                <th className="px-3 py-3">IMC</th>
                <th className="px-3 py-3">Próxima consulta</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => {
                const valorImc = imc(p.pesoAtualKg, p.alturaCm)
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition">
                    <td className="px-5 py-4">
                      <Link to={`/nutri/pacientes/${p.id}`} className="flex items-center gap-3 group">
                        <Avatar nome={p.nome} cor={p.avatarCor} />
                        <div>
                          <p className="font-medium text-sm group-hover:text-primary">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.idade ? `${p.idade} anos · ` : ''}
                            {p.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-sm">{objetivoLabel(p.objetivo)}</td>
                    <td className="px-3 py-4 text-sm font-mono">{valorImc ? valorImc.toFixed(1) : '—'}</td>
                    <td className="px-3 py-4 text-sm">
                      {p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} · ${p.proximaConsulta.horario}` : '—'}
                    </td>
                    <td className="px-3 py-4">{p.ativo ? <Badge>Ativo</Badge> : <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}</td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/nutri/pacientes/${p.id}/ficha`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-3.5 w-3.5" /> Ficha
                          </Button>
                        </Link>
                        {p.ativo && (
                          <Link to={p.planoAtivo ? `/nutri/pacientes/${p.id}/plano/${p.planoAtivo.id}` : `/nutri/pacientes/${p.id}/plano/novo`}>
                            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                              <Apple className="h-3.5 w-3.5" /> Plano
                            </Button>
                          </Link>
                        )}
                        <Link to={`/nutri/pacientes/${p.id}`}>
                          <Button variant="outline" size="sm">
                            Abrir
                          </Button>
                        </Link>
                        {p.ativo ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Desativar paciente"
                            onClick={() => setDesativando(p)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/40 text-primary hover:bg-primary/10"
                            loading={reativar.isPending && reativar.variables?.id === p.id}
                            onClick={() => reativar.mutate(p)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pacientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={novoAberto} onClose={() => setNovoAberto(false)} title="Cadastrar paciente" className="max-w-2xl">
        <PacienteForm onSubmit={(d) => cadastrar.mutate(d)} onCancel={() => setNovoAberto(false)} carregando={cadastrar.isPending} />
      </Modal>

      <SenhaGeradaModal dados={credenciais} onClose={() => setCredenciais(null)} />

      <ConfirmDialog
        open={!!desativando}
        onClose={() => setDesativando(null)}
        onConfirm={() => desativar.mutate(desativando)}
        loading={desativar.isPending}
        destructive
        confirmText="Desativar"
        title={`Desativar ${desativando?.nome}?`}
        description="O plano alimentar ativo será automaticamente suspenso (RN04) e o paciente não poderá mais acessar o app. Você poderá reativar depois e o plano será restaurado."
      />
    </div>
  )
}
