// Button component with light and dark mode support
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-60 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-brand-blue text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-brand-blue shadow-sm',
    secondary:
      'bg-surface text-ink border border-line hover:bg-surface-muted active:bg-surface-raised focus:ring-line-strong shadow-sm',
    teal: 'bg-brand-teal text-white hover:bg-teal-600 active:bg-teal-700 focus:ring-brand-teal shadow-sm',
    ghost:
      'bg-transparent text-brand-blue hover:bg-blue-50 dark:hover:bg-surface-raised active:bg-blue-100 dark:active:bg-surface-muted focus:ring-brand-blue',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
