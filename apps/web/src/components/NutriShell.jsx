import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Apple, Database, TrendingUp, FileText, Settings, LogOut, Search, Menu, X,
} from 'lucide-react'
import { Logo } from './Logo'
import { Avatar, Carregando, Input } from './ui'
import { useAuth } from '../lib/auth'
import { useAtualizacoesTempoReal } from '../lib/socket'
import { cn } from '../lib/hooks'

const NAV = [
  { to: '/nutri', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/nutri/pacientes', label: 'Pacientes', icon: Users },
  { to: '/nutri/agenda', label: 'Agenda', icon: ClipboardList },
  { to: '/nutri/planos', label: 'Planos Alimentares', icon: Apple },
  { to: '/nutri/taco', label: 'Alimentos (TACO)', icon: Database },
  { to: '/nutri/evolucao', label: 'Evolução', icon: TrendingUp },
  { to: '/nutri/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/nutri/configuracoes', label: 'Configurações', icon: Settings },
]

export function NutriShell() {
  const { token, nutricionista, carregando, sair } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  useAtualizacoesTempoReal(token)

  // fecha o menu lateral (mobile) ao trocar de página
  useEffect(() => setAberto(false), [pathname])

  if (!token) return <Navigate to="/login" replace state={{ de: pathname }} />
  if (carregando || !nutricionista) return <Carregando />

  const buscar = (e) => {
    e.preventDefault()
    nav(`/nutri/pacientes?busca=${encodeURIComponent(busca.trim())}`)
  }

  const conteudoLateral = (
    <>
      <div className="lateral-topo">
        <Logo altura={36} variant="light" />
        <button className="lateral-fechar" onClick={() => setAberto(false)} aria-label="Fechar menu">
          <X size={20} />
        </button>
      </div>
      <nav className="lateral-menu">
        {NAV.map((item) => {
          const ativo = item.exact ? pathname === item.to : pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className={cn('lateral-item', ativo && 'lateral-item-ativo')}>
              <Icon />
              <span className="cortar">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="lateral-rodape">
        <div className="lateral-usuario">
          <Avatar nome={nutricionista.nome} cor="var(--terracota)" foto={nutricionista.foto} tamanho="sm" />
          <div className="expandir">
            <p className="texto-medio cortar">{nutricionista.nome}</p>
            <p className="lateral-crn">{nutricionista.crn}</p>
          </div>
          <button
            onClick={() => {
              sair()
              nav('/')
            }}
            className="lateral-sair"
            title="Sair"
          >
            <LogOut />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="shell">
      <aside className="shell-lateral">{conteudoLateral}</aside>

      {aberto && (
        <div className="shell-gaveta">
          <div className="shell-gaveta-fundo" onClick={() => setAberto(false)} />
          <aside className="shell-lateral">{conteudoLateral}</aside>
        </div>
      )}

      <main className="shell-principal">
        <header className="shell-topo">
          <button className="shell-menu" onClick={() => setAberto(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div className="shell-logo-mobile">
            <Logo altura={28} />
          </div>
          <form onSubmit={buscar} className="shell-busca busca">
            <Search />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar paciente..." />
          </form>
        </header>
        <div className="shell-conteudo">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
