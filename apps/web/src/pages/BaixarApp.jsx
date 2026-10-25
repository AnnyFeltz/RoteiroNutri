import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Apple, CheckCircle2, Play, Smartphone } from 'lucide-react'
import { Logo } from '../components/Logo'

// Tela ilustrativa (de mentirinha): o paciente não usa a web, ele baixa o app no celular.
// Os botões das lojas e o QR code são apenas demonstrativos.
const VANTAGENS = [
  'Seu plano alimentar do dia, refeição por refeição',
  'Marque o que já comeu e troque por substitutos',
  'Registre seu peso e acompanhe sua evolução',
  'Veja suas próximas consultas',
]

export default function BaixarApp() {
  const emBreve = () => toast('O app ainda não está nas lojas. Peça o acesso ao seu nutricionista!')

  return (
    <div className="landing">
      <header className="landing-largura landing-topo">
        <Link to="/">
          <Logo altura={40} />
        </Link>
        <Link to="/" className="linha-sm texto-medio texto-suave">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </header>

      <section className="landing-largura baixar-app">
        <div>
          <div className="landing-chamada">
            <Smartphone size={14} /> Área do paciente
          </div>
          <h1>
            Seu plano alimentar <span className="cor-terracota">no bolso</span>.
          </h1>
          <p className="landing-texto">
            O acompanhamento do paciente é feito pelo <strong>app Roteiro Nutri</strong>. Baixe no seu celular e entre com o e-mail e a
            senha que seu nutricionista enviou para você.
          </p>

          <ul className="baixar-vantagens">
            {VANTAGENS.map((v) => (
              <li key={v}>
                <CheckCircle2 className="cor-folha" /> {v}
              </li>
            ))}
          </ul>

          <div className="baixar-lojas">
            <button type="button" className="botao-loja" onClick={emBreve}>
              <Apple />
              <span>
                <small>Baixar na</small>
                App Store
              </span>
            </button>
            <button type="button" className="botao-loja" onClick={emBreve}>
              <Play />
              <span>
                <small>Disponível no</small>
                Google Play
              </span>
            </button>
          </div>

          <div className="baixar-qr">
            <QrDecorativo />
            <p>
              <strong>Aponte a câmera do celular</strong>
              <br />
              para baixar o app
            </p>
          </div>
        </div>

        <div className="baixar-celular" aria-hidden="true">
          <div className="celular">
            <div className="celular-tela">
              <p className="celular-ola">Olá, Ana 👋</p>
              <p className="celular-titulo">Plano de hoje</p>
              <div className="celular-kcal">
                <strong>1.240</strong> / 1.800 kcal
                <div className="barra">
                  <span style={{ width: '69%' }} />
                </div>
              </div>
              {[
                ['Café da manhã', '07:00', true],
                ['Lanche', '10:00', true],
                ['Almoço', '12:30', false],
                ['Jantar', '19:30', false],
              ].map(([nome, hora, feita]) => (
                <div key={nome} className={`celular-refeicao${feita ? ' feita' : ''}`}>
                  <CheckCircle2 />
                  <span className="expandir">{nome}</span>
                  <small>{hora}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-largura landing-rodape">
        <span>© Roteiro Nutri</span>
        <span>
          É nutricionista? <Link to="/login" className="cor-primaria texto-medio">Entre aqui</Link>
        </span>
      </footer>
    </div>
  )
}

/** Desenho que lembra um QR code (não aponta para lugar nenhum). */
function QrDecorativo() {
  const n = 21
  const canto = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([cx, cy]) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7)
  const quadrados = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (canto(x, y)) continue
      if ((x * 7 + y * 13 + x * y) % 3 === 0) quadrados.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  }
  const olho = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="var(--card)" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="qr-decorativo" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="var(--card)" />
      <g fill="var(--texto)">
        {quadrados}
        {olho(0, 0)}
        {olho(n - 7, 0)}
        {olho(0, n - 7)}
      </g>
    </svg>
  )
}
