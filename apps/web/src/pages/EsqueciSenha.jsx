import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Mail } from 'lucide-react'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { api } from '../lib/api'

// RF03 / RN09 - Recuperação de senha do nutricionista por e-mail
export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      await api('/auth/recuperar-senha', { method: 'POST', body: { email } })
      setEnviado(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout>
      {enviado ? (
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-semibold mt-4">Confira seu e-mail</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link para redefinir a senha. O link vale por 1 hora.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-6">
              Voltar ao login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Recuperar senha</h1>
          <p className="text-muted-foreground mt-2 text-sm">Enviaremos um link seguro para o e-mail cadastrado.</p>
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <Field label="E-mail">{(id) => <Input id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
            <Button type="submit" loading={carregando} className="w-full">
              <Mail className="h-4 w-4" /> Enviar link
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Paciente? Peça uma nova senha pelo app — seu nutricionista aprova o pedido.
            </p>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
