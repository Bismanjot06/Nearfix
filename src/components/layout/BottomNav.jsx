import { NavLink } from 'react-router-dom'
import { Home, Map, PlusCircle, Search } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/report', label: 'Report', icon: PlusCircle, highlight: true },
  { to: '/track', label: 'Track', icon: Search },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-line safe-area-inset-bottom lg:hidden transition-colors">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-[60px] transition-colors ${
                highlight
                  ? isActive
                    ? 'text-brand-blue dark:text-blue-400 font-bold'
                    : 'text-brand-blue opacity-90'
                  : isActive
                  ? 'text-brand-blue dark:text-blue-400 font-bold'
                  : 'text-gray-500 dark:text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {highlight ? (
                  <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center shadow-md -mt-4 ring-4 ring-surface">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? 'text-brand-blue dark:text-blue-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }`}
                  />
                )}
                <span className={`text-[10px] font-medium ${highlight ? 'mt-1' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
