// Componentes de interface reutilizáveis (inspirados no visual shadcn/ui do protótipo).
import { useEffect, useId } from 'react'
import { Loader2, X } from 'lucide-react'
import { iniciais } from '../lib/format'
import { cn } from '../lib/hooks'

const VARIANTES_BOTAO = {
  default: 'bg-primary text-primary-foreground hover:bg-leaf-deep',
  outline: 'border border-border bg-card hover:bg-muted text-foreground',
  ghost: 'hover:bg-muted text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline px-0 h-auto',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
}

const TAMANHOS_BOTAO = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
}

export function Button({ variant = 'default', size = 'default', className, loading, children, disabled, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        VARIANTES_BOTAO[variant],
        variant !== 'link' && TAMANHOS_BOTAO[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

const campo =
  'w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring disabled:opacity-50'

export function Input({ className, ...props }) {
  return <input className={cn(campo, 'h-9 py-1', className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(campo, 'py-2 min-h-[80px]', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(campo, 'h-9 py-1 pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />
}

/** Label + controle + mensagem de ajuda, com o htmlFor ligado automaticamente. */
export function Field({ label, hint, className, children }) {
  const id = useId()
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5">{typeof children === 'function' ? children(id) : children}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border border-border bg-card text-card-foreground', className)} {...props} />
}

const VARIANTES_BADGE = {
  default: 'bg-primary/15 text-primary border-transparent',
  outline: 'border-border text-foreground',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  muted: 'bg-muted text-muted-foreground border-transparent',
}

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', VARIANTES_BADGE[variant], className)}
      {...props}
    />
  )
}

export function Avatar({ nome, cor, className, textClassName }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full text-white font-semibold', className || 'h-10 w-10', textClassName || 'text-sm')}
      style={{ background: cor || 'var(--primary)' }}
    >
      {iniciais(nome)}
    </span>
  )
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-primary', className)} />
}

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
      <Spinner /> {texto}
    </div>
  )
}

export function ErroCarregamento({ erro, onTentar }) {
  return (
    <Card className="p-10 text-center">
      <p className="font-medium">Não foi possível carregar os dados.</p>
      <p className="text-sm text-muted-foreground mt-1">{erro?.message}</p>
      {onTentar && (
        <Button variant="outline" className="mt-4" onClick={onTentar}>
          Tentar novamente
        </Button>
      )}
    </Card>
  )
}

export function Modal({ open, onClose, title, description, children, footer, className }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn('relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-card p-6 shadow-xl', className)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        {title && <h2 className="text-lg font-semibold pr-6">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
        <div className={title ? 'mt-4' : ''}>{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{footer}</div>}
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
    <div className="inline-flex flex-wrap h-auto items-center gap-1 rounded-lg border border-border bg-card p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition',
            value === t.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Grupo de botões de filtro (ex: ativos / inativos / todos). */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition',
            value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
          )}
        >
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
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

export function Stat({ label, value, sub, large }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('font-display font-semibold mt-1', large ? 'text-3xl' : 'text-2xl')}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
