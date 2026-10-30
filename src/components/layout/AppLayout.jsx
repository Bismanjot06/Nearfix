import { Link } from 'react-router-dom'
import { BottomNav } from './BottomNav.jsx'
import { Sidebar } from './Sidebar.jsx'
import { ThemeToggle } from '../ui/ThemeToggle.jsx'
import { isDemoMode } from '../../services/reports.js'

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-page text-ink flex flex-col transition-colors duration-200">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:ml-64 flex-1 flex flex-col">
        {/* Mobile top header with logo and ThemeToggle */}
        <header className="lg:hidden bg-surface border-b border-line px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-teal rounded-lg flex items-center justify-center">
              <span className="text-xs font-black text-white">NF</span>
            </div>
            <div>
              <span className="text-sm font-black tracking-tight leading-none block text-ink">
                NearFix
              </span>
              <span className="text-[10px] text-ink-muted font-medium">
                Punjab Civic Tech
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Demo mode banner (mobile only) */}
        {isDemoMode && (
          <div className="lg:hidden bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 text-center">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              ⚡ Demo Mode — data stored locally in browser
            </span>
          </div>
        )}

        <main className="max-w-3xl mx-auto px-4 pt-4 pb-20 lg:pb-8 lg:pt-8 w-full flex-1">
          {children}
        </main>

        {/* Mobile footer with unobtrusive authority link */}
        <footer className="lg:hidden text-center py-4 pb-24 text-[11px] text-ink-muted">
          <Link
            to="/authority/login"
            className="text-ink-muted hover:text-ink transition underline underline-offset-2"
          >
            Authority Portal Login
          </Link>
        </footer>
      </div>

      <BottomNav />
    </div>
  )
}
