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
    <div className="pagina">
      <div className="cabecalho-pagina">
        <div>
          <h1 className="titulo-pagina">Pacientes</h1>
          <p className="subtitulo-pagina">Gerencie seus pacientes e seus planos.</p>
        </div>
        <Button onClick={() => setNovoAberto(true)}>
          <Plus /> Novo paciente
        </Button>
      </div>

      <Card className="card-compacto filtros">
        <div className="busca">
          <Search />
          <Input
            value={busca}
            onChange={(e) => setParams(e.target.value ? { busca: e.target.value } : {}, { replace: true })}
            placeholder="Buscar por nome ou e-mail..."
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
      </Card>

      {isLoading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregamento erro={error} onTentar={refetch} />
      ) : (
        <Card className="card-sem-espaco rolagem-x">
          <table className="tabela" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Objetivo</th>
                <th>IMC</th>
                <th>Próxima consulta</th>
                <th>Status</th>
                <th className="direita">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => {
                const valorImc = imc(p.pesoAtualKg, p.alturaCm)
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/nutri/pacientes/${p.id}`} className="linha link-texto">
                        <Avatar nome={p.nome} cor={p.avatarCor} foto={p.foto} />
                        <div>
                          <p className="texto-medio">{p.nome}</p>
                          <p className="texto-pequeno texto-suave">
                            {p.idade ? `${p.idade} anos · ` : ''}
                            {p.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td>{objetivoLabel(p.objetivo)}</td>
                    <td className="mono">{valorImc ? valorImc.toFixed(1) : '—'}</td>
                    <td>{p.proximaConsulta ? `${dataBR(p.proximaConsulta.data)} · ${p.proximaConsulta.horario}` : '—'}</td>
                    <td>{p.ativo ? <Badge>Ativo</Badge> : <Badge variant="muted">Inativo</Badge>}</td>
                    <td>
                      <div className="acoes" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/nutri/pacientes/${p.id}/ficha`}>
                          <Button variant="outline" size="sm">
                            <FileText /> Ficha
                          </Button>
                        </Link>
                        {p.ativo && (
                          <Link to={p.planoAtivo ? `/nutri/pacientes/${p.id}/plano/${p.planoAtivo.id}` : `/nutri/pacientes/${p.id}/plano/novo`}>
                            <Button variant="outline" size="sm" className="btn-primaria-suave">
                              <Apple /> Plano
                            </Button>
                          </Link>
                        )}
                        <Link to={`/nutri/pacientes/${p.id}`}>
                          <Button variant="outline" size="sm">
                            Abrir
                          </Button>
                        </Link>
                        {p.ativo ? (
                          <Button variant="ghost" size="icon" className="btn-acao-perigo" title="Desativar paciente" onClick={() => setDesativando(p)}>
                            <UserX />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-primaria-suave"
                            loading={reativar.isPending && reativar.variables?.id === p.id}
                            onClick={() => reativar.mutate(p)}
                          >
                            <RotateCcw /> Reativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pacientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="tabela-vazia">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={novoAberto} onClose={() => setNovoAberto(false)} title="Cadastrar paciente" largo>
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
