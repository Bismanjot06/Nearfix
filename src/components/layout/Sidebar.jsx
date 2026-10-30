import { NavLink, Link } from 'react-router-dom'
import { Home, Map, PlusCircle, Search, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle.jsx'
import { isDemoMode } from '../../services/reports.js'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/report', label: 'Report a Pothole', icon: PlusCircle },
  { to: '/track', label: 'Track Report', icon: Search },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-navy-900 text-white fixed left-0 top-0 bottom-0 z-40 border-r border-navy-800">
      {/* Brand & Theme Toggle */}
      <div className="px-6 pt-7 pb-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center">
              <span className="text-sm font-black text-white">NF</span>
            </div>
            <span className="text-xl font-black tracking-tight text-white">NearFix</span>
          </div>
          <ThemeToggle variant="subtle" />
        </div>
        <p className="text-xs text-white/50 mt-1">Civic Pothole Tracker · Punjab</p>
        {isDemoMode && (
          <div className="mt-3 bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-1.5">
            <p className="text-xs text-amber-300 font-medium">⚡ Demo Mode Active</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer with unobtrusive authority link */}
      <div className="px-6 py-4 border-t border-white/10 space-y-2">
        <Link
          to="/authority/login"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Authority login →</span>
        </Link>
        <p className="text-[11px] text-white/30">NearFix v1.0 · Punjab Civic Tech</p>
      </div>
    </aside>
  )
}
