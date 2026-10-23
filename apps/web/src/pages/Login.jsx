import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { loginSchema } from '@RoteiroNutri/shared'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../lib/auth'
import { validar } from '../lib/validacao'

// RF02 - Login do nutricionista
export default function Login() {
  const { entrar, token } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erros, setErros] = useState({})
  const [carregando, setCarregando] = useState(false)

  if (token) return <Navigate to="/nutri" replace />

  const enviar = async (e) => {
    e.preventDefault()
    const dados = validar(loginSchema, form, setErros)
    if (!dados) return
    setCarregando(true)
    try {
      await entrar(dados.email, dados.senha)
      toast.success('Bem-vinda de volta!')
      nav(location.state?.de || '/nutri', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout>
      <h1>Bem-vinda de volta</h1>
      <p className="subtitulo-pagina">Entre para acessar seu consultório.</p>
      <form onSubmit={enviar} noValidate>
        <Field label="E-mail" erro={erros.email}>
          {(id) => <Input id={id} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} erro={erros.email} />}
        </Field>
        <div>
          <div className="linha entre" style={{ marginBottom: 6 }}>
            <label htmlFor="senha" className="rotulo" style={{ margin: 0 }}>
              Senha
            </label>
            <Link to="/esqueci-senha" className="link texto-pequeno">
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput id="senha" autoComplete="current-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} erro={erros.senha} />
          {erros.senha && <p className="erro-campo">{erros.senha}</p>}
        </div>
        <Button type="submit" loading={carregando} className="btn-bloco">
          {carregando ? 'Entrando...' : 'Entrar'}
        </Button>
        <p className="centro texto-suave">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="link">
            Cadastre-se
          </Link>
        </p>
        <p className="centro texto-pequeno texto-suave">É paciente? Acesse pelo app Roteiro Nutri no seu celular.</p>
      </form>
    </AuthLayout>
  )
}
