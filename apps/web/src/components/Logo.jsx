import logoSrc from '../assets/logo-roteiro-nutri.png'

export function Logo({ className = 'h-10 w-auto', variant = 'default' }) {
  const claro = variant === 'light'
  return (
    <span className={`inline-flex items-center justify-center rounded-xl overflow-hidden ${claro ? 'bg-white/95 p-1.5 shadow-sm' : ''}`}>
      <img src={logoSrc} alt="Roteiro Nutri" className={`${className} object-contain block`} />
    </span>
  )
}
