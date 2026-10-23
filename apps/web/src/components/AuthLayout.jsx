import { Logo } from './Logo'

export function AuthLayout({ children, frase = '"Centralize sua rotina e foque no que importa: cuidar de cada paciente."' }) {
  return (
    <div className="min-h-screen bg-gradient-sand flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-leaf p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-terracotta/30 blur-3xl" />
        <div className="self-start">
          <Logo className="h-12 w-auto relative" variant="light" />
        </div>
        <div className="relative">
          <h2 className="text-4xl font-display font-semibold leading-tight text-balance">{frase}</h2>
          <p className="mt-4 text-primary-foreground/80">Plataforma completa de gestão nutricional.</p>
        </div>
        <div className="relative text-xs text-primary-foreground/70">© Roteiro Nutri</div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo className="h-10" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
