import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Users, ClipboardList, Apple, Database, TrendingUp, FileText, Settings, LogOut, Bell, Search, Menu, X,
} from 'lucide-react'
import { Logo } from './Logo'
import { Avatar, Carregando, Input } from './ui'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useNotificacoesTempoReal } from '../lib/socket'

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

  useNotificacoesTempoReal(token, nutricionista?.preferencias?.avisosTempoReal !== false)

  const { data: contagem } = useQuery({
    queryKey: ['notificacoes', 'contagem'],
    queryFn: () => api('/notificacoes/contagem'),
    enabled: !!nutricionista,
    refetchInterval: 60_000,
  })

  // fecha o menu lateral (mobile) ao trocar de página
  useEffect(() => setAberto(false), [pathname])

  if (!token) return <Navigate to="/login" replace state={{ de: pathname }} />
  if (carregando || !nutricionista) return <Carregando />

  const naoLidas = contagem?.total || 0

  const buscar = (e) => {
    e.preventDefault()
    nav(`/nutri/pacientes?busca=${encodeURIComponent(busca.trim())}`)
  }

  const conteudoLateral = (
    <>
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
        <Logo className="h-9 w-auto" variant="light" />
        <button className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => setAberto(false)} aria-label="Fechar menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const ativo = item.exact ? pathname === item.to : pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                ativo
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar nome={nutricionista.nome} cor="var(--terracotta)" className="h-9 w-9 ring-2 ring-sidebar-primary/40" textClassName="text-xs" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{nutricionista.nome}</p>
            <p className="text-xs text-sidebar-foreground/60">{nutricionista.crn}</p>
          </div>
          <button
            onClick={() => {
              sair()
              nav('/')
            }}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0 sticky top-0 h-screen">{conteudoLateral}</aside>

      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setAberto(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85%] bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl">
            {conteudoLateral}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted" onClick={() => setAberto(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo className="h-7 w-auto" />
            </div>
            <form onSubmit={buscar} className="hidden sm:block flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar paciente..." className="pl-9 rounded-full" />
            </form>
            <div className="flex-1 sm:hidden" />
            <Link to="/nutri/notificacoes" className="relative p-2 rounded-full hover:bg-muted shrink-0" aria-label="Notificações">
              <Bell className="h-5 w-5 text-foreground/70" />
              {naoLidas > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-terracotta-foreground text-[10px] font-semibold flex items-center justify-center">
                  {naoLidas}
                </span>
              )}
            </Link>
          </div>
        </header>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
