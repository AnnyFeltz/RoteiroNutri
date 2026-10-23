import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'
import { Button, Card, Field, Input, Switch } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function Configuracoes() {
  const { nutricionista, setNutricionista } = useAuth()
  const [perfil, setPerfil] = useState({
    nome: nutricionista.nome,
    email: nutricionista.email,
    crn: nutricionista.crn,
    telefone: nutricionista.telefone || '',
  })
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' })
  const avisos = nutricionista.preferencias?.avisosTempoReal !== false

  const salvarPerfil = useMutation({
    mutationFn: () => api('/nutricionista/perfil', { method: 'PUT', body: perfil }),
    onSuccess: (n) => {
      setNutricionista(n)
      toast.success('Perfil atualizado')
    },
    onError: (e) => toast.error(e.message),
  })

  const alterarSenha = useMutation({
    mutationFn: () => api('/nutricionista/senha', { method: 'PUT', body: { senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha } }),
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

  const enviarSenha = () => {
    if (senhas.novaSenha.length < 6) return toast.error('A nova senha deve ter ao menos 6 caracteres.')
    if (senhas.novaSenha !== senhas.confirmar) return toast.error('A confirmação não confere.')
    alterarSenha.mutate()
  }

  const set = (c) => (e) => setPerfil({ ...perfil, [c]: e.target.value })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-semibold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil e preferências.</p>
      </div>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-semibold">Perfil profissional</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome">{(id) => <Input id={id} value={perfil.nome} onChange={set('nome')} />}</Field>
          <Field label="CRN">{(id) => <Input id={id} value={perfil.crn} onChange={set('crn')} />}</Field>
          <Field label="E-mail">{(id) => <Input id={id} type="email" value={perfil.email} onChange={set('email')} />}</Field>
          <Field label="Telefone (aparece para o paciente no app)">{(id) => <Input id={id} value={perfil.telefone} onChange={set('telefone')} />}</Field>
        </div>
        <Button onClick={() => salvarPerfil.mutate()} loading={salvarPerfil.isPending}>
          Salvar alterações
        </Button>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold">Alterar senha</h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Mínimo de 6 caracteres. Sua senha é armazenada criptografada (bcrypt).</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Senha atual">{(id) => <Input id={id} type="password" value={senhas.senhaAtual} onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })} autoComplete="current-password" />}</Field>
          <Field label="Nova senha">{(id) => <Input id={id} type="password" value={senhas.novaSenha} onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })} autoComplete="new-password" />}</Field>
          <Field label="Confirmar nova senha">{(id) => <Input id={id} type="password" value={senhas.confirmar} onChange={(e) => setSenhas({ ...senhas, confirmar: e.target.value })} autoComplete="new-password" />}</Field>
        </div>
        <Button onClick={enviarSenha} loading={alterarSenha.isPending}>
          Alterar senha
        </Button>
      </Card>

      <Card className="p-5 sm:p-6 space-y-4">
        <h2 className="font-display font-semibold">Notificações</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Avisos em tempo real</p>
            <p className="text-xs text-muted-foreground">Mostrar um aviso na tela quando um paciente pedir nova senha ou alterar o perfil pelo app.</p>
          </div>
          <Switch label="Avisos em tempo real" checked={avisos} disabled={salvarPreferencia.isPending} onChange={(v) => salvarPreferencia.mutate({ avisosTempoReal: v })} />
        </div>
      </Card>
    </div>
  )
}
