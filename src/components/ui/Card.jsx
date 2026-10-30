export function Card({ children, className = '', onClick, ...props }) {
  const interactiveClass = onClick
    ? 'cursor-pointer hover:shadow-card-hover transition-all duration-200'
    : ''
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-line text-ink rounded-2xl shadow-card p-4 transition-colors ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
