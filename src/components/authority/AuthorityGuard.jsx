import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { Spinner } from '../ui/Spinner.jsx'
import { Button } from '../ui/Button.jsx'

export function AuthorityGuard({ children }) {
  const { session, user, isAuthority, loading, signOut, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="text-sm text-ink-muted mt-4 font-medium">Verifying authority credentials…</p>
      </div>
    )
  }

  // Not logged in
  if (!session || !user) {
    return <Navigate to="/authority/login" state={{ from: location }} replace />
  }

  // Logged in, but not an authority or admin
  if (!isAuthority) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-black text-ink mb-2">Access Denied</h2>
          <p className="text-sm text-ink-muted mb-2 leading-relaxed">
            Your account <span className="font-semibold text-ink">{user.email}</span> does not have municipal authority privileges (Current role: <span className="font-mono text-red-600 dark:text-red-400 font-bold">{role || 'citizen'}</span>).
          </p>
          <p className="text-xs text-ink-muted mb-6">
            If you are a designated municipal officer, please contact your database administrator to assign the <code className="bg-surface-muted px-1 py-0.5 rounded">authority</code> role.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => (window.location.href = '/')}>
              <ArrowLeft className="h-4 w-4" />
              Citizen App
            </Button>
            <Button variant="danger" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
