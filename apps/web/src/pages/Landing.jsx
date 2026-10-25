import { Link } from 'react-router-dom'
import { ArrowRight, Stethoscope, Smartphone, ChartLine, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-largura landing-topo">
        <Logo altura={40} />
        <nav className="linha">
          <Link to="/paciente" className="so-desktop texto-medio texto-suave">
            Sou paciente
          </Link>
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/cadastro">
            <Button>Cadastrar</Button>
          </Link>
        </nav>
      </header>

      <section className="landing-largura landing-heroi">
        <div>
          <div className="landing-chamada">
            <Leaf size={14} /> Plataforma completa para nutricionistas
          </div>
          <h1>
            A rotina do seu <span className="cor-terracota">consultório</span>, organizada com leveza.
          </h1>
          <p className="landing-texto">
            Cadastre pacientes, monte planos alimentares personalizados com base na tabela TACO e acompanhe a evolução em um só lugar — no
            consultório ou no bolso do seu paciente.
          </p>
          <div className="landing-botoes">
            <Link to="/cadastro">
              <Button size="lg">
                Começar gratuitamente <ArrowRight />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Entrar como nutricionista
              </Button>
            </Link>
          </div>
          <div className="landing-selos">
            <span>
              <ShieldCheck className="cor-folha" /> Senhas criptografadas
            </span>
            <span>
              <Sparkles className="cor-terracota" /> TACO integrada
            </span>
          </div>
        </div>

        <div className="landing-recursos">
          <div className="landing-recursos-grade">
            <Recurso icone={<Stethoscope className="cor-primaria" />} titulo="Dashboard Web" texto="Para o nutricionista. Pacientes, anamnese, agenda e planos." />
            <Recurso icone={<Smartphone className="cor-terracota" />} titulo="App Mobile" texto="Para o paciente. Plano do dia, substituições e evolução." />
            <Recurso icone={<ChartLine className="cor-folha" />} titulo="Evolução" texto="Gráficos de peso, composição corporal e adesão ao plano." />
            <Recurso icone={<Leaf className="cor-primaria" />} titulo="TACO" texto="597 alimentos brasileiros com macronutrientes por 100g." />
          </div>
        </div>
      </section>

      <section className="landing-faixa">
        <div className="landing-largura landing-numeros">
          {[
            { kpi: '597', label: 'Alimentos da tabela TACO' },
            { kpi: '1', label: 'Plano ativo por paciente, com histórico de versões' },
            { kpi: '0', label: 'Conflitos de horário na agenda' },
          ].map((s) => (
            <div key={s.label} className="landing-numero">
              <strong>{s.kpi}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="paciente" className="landing-largura landing-paciente">
        <div className="card">
          <div className="icone-caixa icone-caixa-terracota icone-grande">
            <Smartphone />
          </div>
          <div className="expandir">
            <h2>É paciente?</h2>
            <p className="texto-suave" style={{ marginTop: 4 }}>
              O acompanhamento do paciente é feito pelo <strong>app Roteiro Nutri</strong> no celular. Entre com o e-mail e a senha que seu
              nutricionista enviou para você.
            </p>
          </div>
          <Link to="/paciente">
            <Button variant="outline">
              Baixar o app <ArrowRight />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="landing-largura landing-rodape">
        <span>© Roteiro Nutri</span>
        <span>Feito com 💚 para nutricionistas</span>
      </footer>
    </div>
  )
}

function Recurso({ icone, titulo, texto }) {
  return (
    <div className="recurso">
      {icone}
      <h3>{titulo}</h3>
      <p>{texto}</p>
    </div>
  )
}
