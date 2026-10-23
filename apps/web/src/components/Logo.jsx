import logoSrc from '../assets/logo-roteiro-nutri.png'

export function Logo({ altura = 40, variant = 'default' }) {
  return (
    <span className={`logo ${variant === 'light' ? 'logo-clara' : ''}`}>
      <img src={logoSrc} alt="Roteiro Nutri" style={{ height: altura }} />
    </span>
  )
}
