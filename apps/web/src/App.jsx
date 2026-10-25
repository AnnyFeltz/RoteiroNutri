import { Link, Route, Routes } from 'react-router-dom'
import { NutriShell } from './components/NutriShell'
import { Button } from './components/ui'
import Landing from './pages/Landing'
import BaixarApp from './pages/BaixarApp'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import PacienteDetalhe from './pages/PacienteDetalhe'
import Ficha from './pages/Ficha'
import PlanoEditor from './pages/PlanoEditor'
import PlanoVisualizar from './pages/PlanoVisualizar'
import Planos from './pages/Planos'
import Agenda from './pages/Agenda'
import AgendaDia from './pages/AgendaDia'
import Taco from './pages/Taco'
import Evolucao from './pages/Evolucao'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Notificacoes from './pages/Notificacoes'

// A versão web é exclusiva do NUTRICIONISTA. O paciente usa o app mobile (apps/mobile).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/paciente" element={<BaixarApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      <Route path="/nutri" element={<NutriShell />}>
        <Route index element={<Dashboard />} />
        <Route path="pacientes" element={<Pacientes />} />
        <Route path="pacientes/:id" element={<PacienteDetalhe />} />
        <Route path="pacientes/:id/ficha" element={<Ficha />} />
        <Route path="pacientes/:id/plano/novo" element={<PlanoEditor />} />
        <Route path="pacientes/:id/plano/:planoId/editar" element={<PlanoEditor />} />
        <Route path="pacientes/:id/plano/:planoId" element={<PlanoVisualizar />} />
        <Route path="planos" element={<Planos />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="agenda/:data" element={<AgendaDia />} />
        <Route path="taco" element={<Taco />} />
        <Route path="evolucao" element={<Evolucao />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="notificacoes" element={<Notificacoes />} />
      </Route>

      <Route path="*" element={<NaoEncontrado />} />
    </Routes>
  )
}

function NaoEncontrado() {
  return (
    <div className="nao-encontrado">
      <div>
        <h1>404</h1>
        <h2>Página não encontrada</h2>
        <p>A página que você procura não existe ou foi movida.</p>
        <Link to="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </div>
  )
}
