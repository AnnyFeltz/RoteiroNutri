import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './Logo'

/** voltar: rota do botão "Voltar" no topo do formulário (padrão: página inicial). */
export function AuthLayout({ children, voltar = '/', textoVoltar = 'Voltar ao início', frase = '"Centralize sua rotina e foque no que importa: cuidar de cada paciente."' }) {
  return (
    <div className="auth">
      <div className="auth-lado">
        <div className="auth-brilho" />
        <div style={{ position: 'relative' }}>
          <Logo altura={48} variant="light" />
        </div>
        <div className="auth-frase">
          <h2>{frase}</h2>
          <p>Plataforma completa de gestão nutricional.</p>
        </div>
        <div className="auth-copyright">© Roteiro Nutri</div>
      </div>
      <div className="auth-formulario">
        <Link to={voltar} className="auth-voltar">
          <ArrowLeft size={16} /> {textoVoltar}
        </Link>
        <div className="auth-caixa">
          <div className="auth-logo-mobile">
            <Logo altura={40} />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
