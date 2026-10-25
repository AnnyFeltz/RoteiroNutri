import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Mail } from 'lucide-react'
import { solicitarRecuperacaoSenhaSchema } from '@RoteiroNutri/shared'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { api } from '../lib/api'
import { validar } from '../lib/validacao'

// RF03 / RN09 - Recuperação de senha do nutricionista por e-mail
export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erros, setErros] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    const dados = validar(solicitarRecuperacaoSenhaSchema, { email }, setErros)
    if (!dados) return
    setCarregando(true)
    try {
      await api('/auth/recuperar-senha', { method: 'POST', body: dados })
      setEnviado(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout voltar="/login" textoVoltar="Voltar ao login">
      {enviado ? (
        <div className="auth-sucesso">
          <CheckCircle2 />
          <h1>Confira seu e-mail</h1>
          <p className="subtitulo-pagina">
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link para redefinir a senha. O link vale por 1 hora.
          </p>
          <Link to="/login">
            <Button variant="outline" style={{ marginTop: 24 }}>
              Voltar ao login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <h1>Recuperar senha</h1>
          <p className="subtitulo-pagina">Enviaremos um link seguro para o e-mail cadastrado.</p>
          <form onSubmit={enviar} noValidate>
            <Field label="E-mail" erro={erros.email}>
              {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} erro={erros.email} />}
            </Field>
            <Button type="submit" loading={carregando} className="btn-bloco">
              <Mail /> Enviar link
            </Button>
            <p className="centro texto-pequeno texto-suave">Paciente? Peça uma nova senha pelo app — seu nutricionista aprova o pedido.</p>
            <p className="centro">
              <Link to="/login" className="link">
                Voltar ao login
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
