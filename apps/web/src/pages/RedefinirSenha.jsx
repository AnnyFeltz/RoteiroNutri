import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { api } from '../lib/api'

// RF03 - Redefinir senha com o token recebido por e-mail
export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const nav = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [feito, setFeito] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    if (senha.length < 6) return toast.error('A senha deve ter ao menos 6 caracteres')
    if (senha !== confirmar) return toast.error('As senhas não conferem')
    setCarregando(true)
    try {
      await api('/auth/redefinir-senha', { method: 'POST', body: { token, novaSenha: senha } })
      setFeito(true)
      toast.success('Senha redefinida com sucesso')
      setTimeout(() => nav('/login'), 1500)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout>
      {!token ? (
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Link inválido</h1>
          <p className="text-muted-foreground mt-2 text-sm">Abra o link enviado para o seu e-mail ou solicite um novo.</p>
          <Link to="/esqueci-senha">
            <Button className="mt-6">Solicitar novo link</Button>
          </Link>
        </div>
      ) : feito ? (
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-semibold mt-4">Senha redefinida</h1>
          <p className="text-muted-foreground mt-2 text-sm">Você já pode entrar com a nova senha.</p>
          <Link to="/login">
            <Button className="mt-6">Ir para login</Button>
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Redefinir senha</h1>
          <p className="text-muted-foreground mt-2 text-sm">Escolha uma nova senha segura para sua conta.</p>
          <form onSubmit={enviar} className="mt-8 space-y-4">
            <Field label="Nova senha" hint="Mínimo 6 caracteres.">
              {(id) => <Input id={id} type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />}
            </Field>
            <Field label="Confirmar nova senha">
              {(id) => <Input id={id} type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" />}
            </Field>
            <Button type="submit" loading={carregando} className="w-full">
              Redefinir senha
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
