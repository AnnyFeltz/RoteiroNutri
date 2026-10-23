import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cadastrarNutricionistaSchema } from '@RoteiroNutri/shared'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../lib/auth'
import { validar } from '../lib/validacao'

// RF01 - Cadastrar nutricionista
export default function Cadastro() {
  const { cadastrar, token } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', crn: '', senha: '' })
  const [erros, setErros] = useState({})
  const [carregando, setCarregando] = useState(false)

  if (token) return <Navigate to="/nutri" replace />
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    const dados = validar(cadastrarNutricionistaSchema, form, setErros)
    if (!dados) return
    setCarregando(true)
    try {
      await cadastrar(dados)
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
      <h1>Crie sua conta</h1>
      <p className="subtitulo-pagina">Comece a organizar seu consultório hoje.</p>
      <form onSubmit={enviar} noValidate>
        <Field label="Nome completo" erro={erros.nome}>
          {(id) => <Input id={id} value={form.nome} onChange={set('nome')} placeholder="Dra. Caroline Madera" erro={erros.nome} />}
        </Field>
        <Field label="CRN" erro={erros.crn}>
          {(id) => <Input id={id} value={form.crn} onChange={set('crn')} placeholder="CRN-8 12345" erro={erros.crn} />}
        </Field>
        <Field label="E-mail profissional" erro={erros.email}>
          {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} autoComplete="email" erro={erros.email} />}
        </Field>
        <Field label="Senha" hint="Mínimo de 6 caracteres. Armazenada com hash bcrypt." erro={erros.senha}>
          {(id) => <PasswordInput id={id} value={form.senha} onChange={set('senha')} autoComplete="new-password" erro={erros.senha} />}
        </Field>
        <Button type="submit" loading={carregando} className="btn-bloco">
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </Button>
        <p className="centro texto-suave">
          Já tem conta?{' '}
          <Link to="/login" className="link">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
