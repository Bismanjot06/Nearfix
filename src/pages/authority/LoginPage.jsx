import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Zap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'
import { isDemoMode } from '../../services/reports.js'

export default function LoginPage() {
  const { signIn, isAuthority, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/authority'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated as authority, redirect after render.
  useEffect(() => {
    if (session && isAuthority) {
      navigate(from, { replace: true })
    }
  }, [session, isAuthority, from, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')

    const { error: signInErr } = await signIn({ email, password })
    if (signInErr) {
      setError(signInErr.message || 'Invalid email or password.')
      setLoading(false)
    } else {
      setLoading(false)
      navigate(from, { replace: true })
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    setError('')
    await signIn({ email: 'officer@punjab.gov.in', password: 'demo' })
    setLoading(false)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Citizen Portal
        </Link>
        <span className="text-xs text-white/40">Official MC Portal</span>
      </div>

      <div className="bg-surface rounded-3xl shadow-card p-6 sm:p-8 w-full max-w-md relative z-10 border border-line">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-navy-900 text-brand-teal rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Authority Portal</h1>
          <p className="text-xs text-ink-muted mt-1">
            Municipal Corporation verification & road maintenance console
          </p>
        </div>

        {/* Demo Mode Notice & Quick Login */}
        {isDemoMode && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold mb-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              Demo Mode Active
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 mb-3">
              No Supabase credentials connected yet. You can sign in instantly with mock authority credentials to evaluate the workflow.
            </p>
            <Button
              type="button"
              variant="teal"
              size="sm"
              className="w-full font-bold"
              onClick={handleDemoLogin}
              loading={loading}
              disabled={loading}
            >
              ⚡ Quick Demo Login (Municipal Officer)
            </Button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-3 flex items-start gap-2 text-red-700 dark:text-red-300 text-xs font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Official Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@punjab.gov.in"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-line rounded-xl bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-line rounded-xl bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            loading={loading}
            disabled={loading}
          >
            Sign In to Console
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center">
          <p className="text-[11px] text-ink-muted">
            Public citizen reporting does not require an account.{' '}
            <Link to="/report" className="text-brand-blue hover:underline font-semibold">
              Report a Pothole
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
