import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { redefinirSenhaSchema } from '@RoteiroNutri/shared'
import { AuthLayout } from '../components/AuthLayout'
import { Button, Field, Input } from '../components/ui'
import { api } from '../lib/api'
import { validar } from '../lib/validacao'

// RF03 - Redefinir senha com o token recebido por e-mail
export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const nav = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erros, setErros] = useState({})
  const [feito, setFeito] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    const dados = validar(redefinirSenhaSchema, { token, novaSenha: senha }, setErros)
    if (!dados) return
    if (senha !== confirmar) {
      setErros({ confirmar: 'As senhas não conferem' })
      return toast.error('As senhas não conferem')
    }
    setCarregando(true)
    try {
      await api('/auth/redefinir-senha', { method: 'POST', body: dados })
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
        <div className="auth-sucesso">
          <h1>Link inválido</h1>
          <p className="subtitulo-pagina">Abra o link enviado para o seu e-mail ou solicite um novo.</p>
          <Link to="/esqueci-senha">
            <Button style={{ marginTop: 24 }}>Solicitar novo link</Button>
          </Link>
        </div>
      ) : feito ? (
        <div className="auth-sucesso">
          <CheckCircle2 />
          <h1>Senha redefinida</h1>
          <p className="subtitulo-pagina">Você já pode entrar com a nova senha.</p>
          <Link to="/login">
            <Button style={{ marginTop: 24 }}>Ir para login</Button>
          </Link>
        </div>
      ) : (
        <>
          <h1>Redefinir senha</h1>
          <p className="subtitulo-pagina">Escolha uma nova senha segura para sua conta.</p>
          <form onSubmit={enviar} noValidate>
            <Field label="Nova senha" hint="Mínimo 6 caracteres." erro={erros.novaSenha}>
              {(id) => <Input id={id} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" erro={erros.novaSenha} />}
            </Field>
            <Field label="Confirmar nova senha" erro={erros.confirmar}>
              {(id) => <Input id={id} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" erro={erros.confirmar} />}
            </Field>
            <Button type="submit" loading={carregando} className="btn-bloco">
              Redefinir senha
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
