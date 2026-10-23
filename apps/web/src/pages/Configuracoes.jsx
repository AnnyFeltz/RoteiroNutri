import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { atualizarNutricionistaSchema, alterarSenhaSchema } from '@RoteiroNutri/shared'
import { Button, Card, Field, Input, Switch } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { validar } from '../lib/validacao'

export default function Configuracoes() {
  const { nutricionista, setNutricionista } = useAuth()
  const [perfil, setPerfil] = useState({
    nome: nutricionista.nome,
    email: nutricionista.email,
    crn: nutricionista.crn,
    telefone: nutricionista.telefone || '',
  })
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })
  const [errosPerfil, setErrosPerfil] = useState({})
  const [errosSenha, setErrosSenha] = useState({})
  const avisos = nutricionista.preferencias?.avisosTempoReal !== false

  const salvarPerfil = useMutation({
    mutationFn: (dados) => api('/nutricionista/perfil', { method: 'PUT', body: dados }),
    onSuccess: (n) => {
      setNutricionista(n)
      toast.success('Perfil atualizado')
    },
    onError: (e) => toast.error(e.message),
  })

  const alterarSenha = useMutation({
    mutationFn: (dados) => api('/nutricionista/senha', { method: 'PUT', body: dados }),
    onSuccess: () => {
      setSenhas({ senhaAtual: '', novaSenha: '', confirmar: '' })
      toast.success('Senha alterada com sucesso')
    },
    onError: (e) => toast.error(e.message),
  })

  const salvarPreferencia = useMutation({
    mutationFn: (prefs) => api('/nutricionista/preferencias', { method: 'PUT', body: prefs }),
    onSuccess: (preferencias) => {
      setNutricionista({ ...nutricionista, preferencias })
      toast.success('Preferência salva')
    },
    onError: (e) => toast.error(e.message),
  })

  const enviarPerfil = () => {
    const dados = validar(atualizarNutricionistaSchema, perfil, setErrosPerfil)
    if (dados) salvarPerfil.mutate(dados)
  }

  const enviarSenha = () => {
    const dados = validar(alterarSenhaSchema, { senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha }, setErrosSenha)
    if (!dados) return
    if (senhas.novaSenha !== senhas.confirmar) {
      setErrosSenha({ confirmar: 'A confirmação não confere' })
      return toast.error('A confirmação não confere.')
    }
    alterarSenha.mutate(dados)
  }

  const set = (c) => (e) => setPerfil({ ...perfil, [c]: e.target.value })

  return (
    <div className="pagina pagina-estreita">
      <div>
        <h1 className="titulo-pagina">Configurações</h1>
        <p className="subtitulo-pagina">Gerencie seu perfil e preferências.</p>
      </div>

      <Card className="card-amplo pilha-lg">
        <h2 className="titulo-card">Perfil profissional</h2>
        <div className="grade grade-2-sm">
          <Field label="Nome" erro={errosPerfil.nome}>
            {(id) => <Input id={id} value={perfil.nome} onChange={set('nome')} erro={errosPerfil.nome} />}
          </Field>
          <Field label="CRN" erro={errosPerfil.crn}>
            {(id) => <Input id={id} value={perfil.crn} onChange={set('crn')} erro={errosPerfil.crn} />}
          </Field>
          <Field label="E-mail" erro={errosPerfil.email}>
            {(id) => <Input id={id} type="email" value={perfil.email} onChange={set('email')} erro={errosPerfil.email} />}
          </Field>
          <Field label="Telefone (aparece para o paciente no app)">{(id) => <Input id={id} value={perfil.telefone} onChange={set('telefone')} />}</Field>
        </div>
        <div>
          <Button onClick={enviarPerfil} loading={salvarPerfil.isPending}>
            Salvar alterações
          </Button>
        </div>
      </Card>

      <Card className="card-amplo pilha-lg">
        <div>
          <h2 className="titulo-card linha-sm">
            <KeyRound size={20} className="cor-primaria" /> Alterar senha
          </h2>
          <p className="dica">Mínimo de 6 caracteres. Sua senha é armazenada criptografada (bcrypt).</p>
        </div>
        <div className="grade grade-3-sm">
          <Field label="Senha atual" erro={errosSenha.senhaAtual}>
            {(id) => <Input id={id} type="password" value={senhas.senhaAtual} onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })} autoComplete="current-password" erro={errosSenha.senhaAtual} />}
          </Field>
          <Field label="Nova senha" erro={errosSenha.novaSenha}>
            {(id) => <Input id={id} type="password" value={senhas.novaSenha} onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })} autoComplete="new-password" erro={errosSenha.novaSenha} />}
          </Field>
          <Field label="Confirmar nova senha" erro={errosSenha.confirmar}>
            {(id) => <Input id={id} type="password" value={senhas.confirmar} onChange={(e) => setSenhas({ ...senhas, confirmar: e.target.value })} autoComplete="new-password" erro={errosSenha.confirmar} />}
          </Field>
        </div>
        <div>
          <Button onClick={enviarSenha} loading={alterarSenha.isPending}>
            Alterar senha
          </Button>
        </div>
      </Card>

      <Card className="card-amplo pilha-lg">
        <h2 className="titulo-card">Notificações</h2>
        <div className="linha entre" style={{ gap: 16 }}>
          <div>
            <p className="texto-medio">Avisos em tempo real</p>
            <p className="texto-pequeno texto-suave">Mostrar um aviso na tela quando um paciente pedir nova senha ou alterar o perfil pelo app.</p>
          </div>
          <Switch label="Avisos em tempo real" checked={avisos} disabled={salvarPreferencia.isPending} onChange={(v) => salvarPreferencia.mutate({ avisosTempoReal: v })} />
        </div>
      </Card>
    </div>
  )
}
