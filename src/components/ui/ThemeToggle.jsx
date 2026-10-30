import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '', variant = 'default' }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    function syncTheme() {
      try {
        const savedTheme = localStorage.getItem('nearfix_theme')
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const activeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
        setIsDark(activeDark)
        if (activeDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch {
        // ignore
      }
    }

    syncTheme()
    window.addEventListener('nearfix-theme-change', syncTheme)
    window.addEventListener('storage', syncTheme)
    return () => {
      window.removeEventListener('nearfix-theme-change', syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  function toggleTheme() {
    const nextDark = !isDark
    setIsDark(nextDark)
    try {
      if (nextDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('nearfix_theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('nearfix_theme', 'light')
      }
      window.dispatchEvent(new Event('nearfix-theme-change'))
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 ${
        variant === 'subtle'
          ? 'text-white/70 hover:text-white hover:bg-white/10'
          : 'bg-surface text-ink-muted border border-line hover:bg-surface-muted hover:text-ink'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-ink transition-transform hover:-rotate-12" />
      )}
    </button>
  )
}
