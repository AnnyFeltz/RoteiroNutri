import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { entrar, token } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  if (token) return <Navigate to="/nutri" replace />

  const enviar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      await entrar(email, senha)
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
      <h1 className="text-3xl font-semibold">Bem-vinda de volta</h1>
      <p className="text-muted-foreground mt-2 text-sm">Entre para acessar seu consultório.</p>
      <form onSubmit={enviar} className="mt-8 space-y-4">
        <Field label="E-mail">
          {(id) => <Input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
        </Field>
        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="senha" className="text-sm font-medium">
              Senha
            </label>
            <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <Input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="mt-1.5" />
        </div>
        <Button type="submit" loading={carregando} className="w-full">
          {carregando ? 'Entrando...' : 'Entrar'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground/80">É paciente? Acesse pelo app Roteiro Nutri no seu celular.</p>
      </form>
    </AuthLayout>
  )
}
