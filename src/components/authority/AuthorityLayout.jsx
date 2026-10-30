import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, ExternalLink, LogOut, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { isDemoMode } from '../../services/reports.js'
import { ThemeToggle } from '../ui/ThemeToggle.jsx'

export function AuthorityLayout({ children }) {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/authority/login')
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col lg:flex-row transition-colors duration-200">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-navy-900 text-white fixed left-0 top-0 bottom-0 z-40 border-r border-navy-800">
        {/* Brand & ThemeToggle */}
        <div className="px-6 pt-6 pb-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center">
                <span className="text-sm font-black text-white">NF</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white">NearFix</span>
            </div>
            <ThemeToggle variant="subtle" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-brand-blue/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            Authority Portal
          </div>
          {isDemoMode && (
            <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl px-2.5 py-1">
              <p className="text-[11px] text-amber-300 font-medium">⚡ Demo Mode Active</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          <NavLink
            to="/authority"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>

          <NavLink
            to="/map"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <Map className="h-4 w-4" />
              Live City Map
            </div>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </NavLink>

          <a
            href="/"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <User className="h-4 w-4" />
              Citizen App
            </div>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </nav>

        {/* User profile & Sign out */}
        <div className="p-4 border-t border-white/10 bg-navy-950/40">
          <div className="mb-3">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'Municipal Officer'}
            </p>
            <p className="text-[11px] text-white/50 truncate font-mono">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold bg-brand-teal/20 text-brand-teal px-2 py-0.5 rounded-md uppercase">
              {role || 'Authority'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <header className="lg:hidden bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-teal rounded-lg flex items-center justify-center">
            <span className="text-xs font-black text-white">NF</span>
          </div>
          <div>
            <span className="text-sm font-black tracking-tight leading-none block">NearFix</span>
            <span className="text-[10px] text-brand-teal font-bold uppercase tracking-wider block">Authority</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="subtle" />
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line lg:hidden flex justify-around items-center h-16 safe-area-inset-bottom">
        <NavLink
          to="/authority"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-xs font-medium py-1 px-4 ${
              isActive ? 'text-brand-blue dark:text-blue-400 font-bold' : 'text-ink-muted'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/map"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium py-1 px-4 text-ink-muted"
        >
          <Map className="h-5 w-5" />
          <span>City Map</span>
        </NavLink>
        <a
          href="/"
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium py-1 px-4 text-ink-muted"
        >
          <User className="h-5 w-5" />
          <span>Citizen App</span>
        </a>
      </nav>
    </div>
  )
}
