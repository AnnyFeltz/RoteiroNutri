import { Link } from 'react-router-dom'
import { ArrowRight, Stethoscope, Smartphone, ChartLine, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-sand">
      <header className="px-6 md:px-12 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Logo className="h-10 w-auto" />
        <nav className="flex items-center gap-3">
          <a href="#paciente" className="hidden sm:block text-sm font-medium text-foreground/70 hover:text-foreground px-3 py-2">
            Sou paciente
          </a>
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/cadastro">
            <Button>Cadastrar</Button>
          </Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-leaf-deep mb-6">
            <Leaf className="h-3.5 w-3.5" /> Plataforma completa para nutricionistas
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] text-balance">
            A rotina do seu <span className="text-terracotta">consultório</span>, organizada com leveza.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl text-balance">
            Cadastre pacientes, monte planos alimentares personalizados com base na tabela TACO e acompanhe a evolução em um só
            lugar — no consultório ou no bolso do seu paciente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/cadastro">
              <Button size="lg">
                Começar gratuitamente <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Entrar como nutricionista
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-leaf" /> Senhas criptografadas
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta" /> TACO integrada
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-leaf rounded-3xl opacity-10 blur-2xl" />
          <div className="relative grid grid-cols-2 gap-4">
            <Recurso icon={<Stethoscope className="h-8 w-8 text-primary mb-3" />} titulo="Dashboard Web" texto="Para o nutricionista. Pacientes, anamnese, agenda e planos." />
            <Recurso className="mt-8" icon={<Smartphone className="h-8 w-8 text-terracotta mb-3" />} titulo="App Mobile" texto="Para o paciente. Plano do dia, substituições e evolução." />
            <Recurso icon={<ChartLine className="h-8 w-8 text-leaf mb-3" />} titulo="Evolução" texto="Gráficos de peso, composição corporal e adesão ao plano." />
            <Recurso className="mt-8" icon={<Leaf className="h-8 w-8 text-primary mb-3" />} titulo="TACO" texto="596 alimentos brasileiros com macronutrientes por 100g." />
          </div>
        </div>
      </section>

      <section className="bg-cream border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid md:grid-cols-3 gap-6">
          {[
            { kpi: '596', label: 'Alimentos da tabela TACO' },
            { kpi: '1', label: 'Plano ativo por paciente, com histórico de versões' },
            { kpi: '0', label: 'Conflitos de horário na agenda' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl p-6 border border-border">
              <p className="text-4xl font-display font-semibold text-primary">{s.kpi}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="paciente" className="max-w-7xl mx-auto px-6 md:px-12 py-14">
        <div className="bg-card rounded-2xl border border-border p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="h-14 w-14 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
            <Smartphone className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">É paciente?</h2>
            <p className="text-muted-foreground mt-1">
              O acompanhamento do paciente é feito pelo <strong>app Roteiro Nutri</strong> no celular. Entre com o e-mail e a senha que
              seu nutricionista enviou para você.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 md:px-12 py-8 text-sm text-muted-foreground flex justify-between">
        <span>© Roteiro Nutri</span>
        <span>Feito com 💚 para nutricionistas</span>
      </footer>
    </div>
  )
}

function Recurso({ icon, titulo, texto, className = '' }) {
  return (
    <div className={`bg-card rounded-2xl p-5 shadow-soft border border-border ${className}`}>
      {icon}
      <h3 className="font-display font-semibold">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-1">{texto}</p>
    </div>
  )
}
