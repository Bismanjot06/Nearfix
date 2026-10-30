import { AlertCircle } from 'lucide-react'
import { Button } from './Button.jsx'

export function EmptyState({ title = 'Nothing here yet', message = '', action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center mb-4 transition-colors">
        <AlertCircle className="h-8 w-8 text-ink-muted" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
      {message && <p className="text-sm text-ink-muted mb-6 max-w-xs">{message}</p>}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950/60 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/50">
        <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-ink mb-2">Oops!</h3>
      <p className="text-sm text-ink-muted mb-6 max-w-xs">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  )
}
