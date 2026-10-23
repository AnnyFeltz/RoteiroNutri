// Componentes de interface reutilizáveis (estilos em src/estilos/componentes.css).
import { useEffect, useId } from 'react'
import { Loader2, X } from 'lucide-react'
import { iniciais } from '../lib/format'
import { cn } from '../lib/hooks'

const VARIANTES_BOTAO = {
  default: '',
  outline: 'btn-contorno',
  ghost: 'btn-fantasma',
  destructive: 'btn-perigo',
  link: 'btn-link',
}

const TAMANHOS_BOTAO = { default: '', sm: 'btn-sm', lg: 'btn-lg', icon: 'btn-icone' }

export function Button({ variant = 'default', size = 'default', className, loading, children, disabled, type = 'button', ...props }) {
  return (
    <button type={type} className={cn('btn', VARIANTES_BOTAO[variant], TAMANHOS_BOTAO[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="girando" />}
      {children}
    </button>
  )
}

export function Input({ className, erro, ...props }) {
  return <input className={cn('campo', erro && 'campo-com-erro', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('campo', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn('campo', className)} {...props}>
      {children}
    </select>
  )
}

/** Rótulo + controle + ajuda/erro, com o htmlFor ligado automaticamente. */
export function Field({ label, hint, erro, className, children }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="rotulo">
        {label}
      </label>
      {typeof children === 'function' ? children(id) : children}
      {erro ? <p className="erro-campo">{erro}</p> : hint ? <p className="dica">{hint}</p> : null}
    </div>
  )
}

export function Card({ className, ...props }) {
  return <div className={cn('card', className)} {...props} />
}

const VARIANTES_SELO = {
  default: '',
  outline: 'selo-contorno',
  secondary: 'selo-secundario',
  muted: 'selo-suave',
  terracota: 'selo-terracota',
  primaria: 'selo-primaria',
  folha: 'selo-folha',
}

export function Badge({ variant = 'default', className, ...props }) {
  return <span className={cn('selo', VARIANTES_SELO[variant], className)} {...props} />
}

export function Avatar({ nome, cor, tamanho }) {
  return (
    <span className={cn('avatar', tamanho && `avatar-${tamanho}`)} style={{ background: cor || 'var(--primaria)' }}>
      {iniciais(nome)}
    </span>
  )
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="carregando">
      <Loader2 className="girando" /> {texto}
    </div>
  )
}

export function ErroCarregamento({ erro, onTentar }) {
  return (
    <Card className="card-vazio">
      <p className="texto-medio" style={{ color: 'var(--texto)' }}>
        Não foi possível carregar os dados.
      </p>
      <p className="texto-pequeno">{erro?.message}</p>
      {onTentar && (
        <Button variant="outline" style={{ marginTop: 16 }} onClick={onTentar}>
          Tentar novamente
        </Button>
      )}
    </Card>
  )
}

export function Modal({ open, onClose, title, description, children, footer, largo }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-fundo" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className={cn('modal', largo && 'modal-largo')} onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-fechar" aria-label="Fechar">
          <X />
        </button>
        {title && <h2 className="modal-titulo">{title}</h2>}
        {description && <p className="modal-descricao">{description}</p>}
        {children && <div className={title ? 'modal-corpo' : ''}>{children}</div>}
        {footer && <div className="modal-rodape">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmText = 'Confirmar', destructive, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    />
  )
}

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="abas">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)} className={cn('aba', value === t.value && 'aba-ativa')}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Grupo de botões de filtro (ex: ativos / inativos / todos). */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmentado">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('segmento', value === o.value && 'segmento-ativo')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('interruptor', checked && 'interruptor-ligado')}
    />
  )
}

export function Stat({ label, value, sub, large }) {
  return (
    <div className={cn('indicador', large && 'indicador-grande')}>
      <p className="indicador-rotulo">{label}</p>
      <p className="indicador-valor">{value}</p>
      {sub && <p className="indicador-sub">{sub}</p>}
    </div>
  )
}

export function Barra({ pct, cor }) {
  return (
    <div className="barra">
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: cor }} />
    </div>
  )
}
