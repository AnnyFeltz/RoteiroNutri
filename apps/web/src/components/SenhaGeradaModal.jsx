import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Modal } from './ui'

/** Mostra (uma única vez) a senha gerada para o paciente. */
export function SenhaGeradaModal({ dados, onClose, titulo = 'Acesso do paciente criado' }) {
  if (!dados) return null
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`E-mail: ${dados.email}\nSenha: ${dados.senha}`)
      toast.success('Credenciais copiadas')
    } catch {
      toast.error('Não foi possível copiar')
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={titulo}
      description={
        dados.emailEnviado
          ? 'As credenciais também foram enviadas para o e-mail do paciente.'
          : 'O envio de e-mail não está configurado no servidor: entregue estas credenciais ao paciente.'
      }
      footer={
        <>
          <Button variant="outline" onClick={copiar}>
            <Copy /> Copiar
          </Button>
          <Button onClick={onClose}>Pronto</Button>
        </>
      }
    >
      <div className="credenciais pilha-sm">
        <p>
          <span className="texto-suave">E-mail:</span> <span className="texto-medio">{dados.email}</span>
        </p>
        <p>
          <span className="texto-suave">Senha:</span> <code className="codigo">{dados.senha}</code>
        </p>
      </div>
      <p className="dica" style={{ marginTop: 12 }}>
        Por segurança, esta senha não poderá ser exibida novamente.
      </p>
    </Modal>
  )
}
