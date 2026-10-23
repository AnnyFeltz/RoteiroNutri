import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { useAuth } from '../lib/auth'

// RF01 - Cadastrar nutricionista
export default function Cadastro() {
  const { cadastrar, token } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', crn: '', senha: '' })
  const [carregando, setCarregando] = useState(false)

  if (token) return <Navigate to="/nutri" replace />
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    if (form.senha.length < 6) return toast.error('A senha deve ter ao menos 6 caracteres')
    setCarregando(true)
    try {
      await cadastrar(form)
      toast.success('Cadastro realizado!')
      nav('/nutri', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-semibold">Crie sua conta</h1>
      <p className="text-muted-foreground mt-2 text-sm">Comece a organizar seu consultório hoje.</p>
      <form onSubmit={enviar} className="mt-8 space-y-4">
        <Field label="Nome completo">{(id) => <Input id={id} required value={form.nome} onChange={set('nome')} placeholder="Dra. Caroline Madera" />}</Field>
        <Field label="CRN">{(id) => <Input id={id} required value={form.crn} onChange={set('crn')} placeholder="CRN-8 12345" />}</Field>
        <Field label="E-mail profissional">{(id) => <Input id={id} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />}</Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres. Armazenada com hash bcrypt.">
          {(id) => <Input id={id} type="password" required value={form.senha} onChange={set('senha')} autoComplete="new-password" />}
        </Field>
        <Button type="submit" loading={carregando} className="w-full">
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
