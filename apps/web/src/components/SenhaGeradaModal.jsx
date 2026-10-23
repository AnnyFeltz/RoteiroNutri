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
            <Copy className="h-4 w-4" /> Copiar
          </Button>
          <Button onClick={onClose}>Pronto</Button>
        </>
      }
    >
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{dados.email}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Senha:</span>{' '}
          <code className="px-2 py-0.5 rounded bg-background border border-border font-mono">{dados.senha}</code>
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Por segurança, esta senha não poderá ser exibida novamente.</p>
    </Modal>
  )
}
