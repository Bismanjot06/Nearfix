import { PRIORITIES } from '../../lib/constants.js'

export function PriorityBadge({ priority, isOverridden = false, className = '' }) {
  const conf = PRIORITIES[priority] || {
    label: priority || 'Unknown',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.badgeClass} ${className}`}
    >
      <span>{conf.label} Priority</span>
      {isOverridden && (
        <span
          title="Manually overridden by authority"
          className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
        />
      )}
    </span>
  )
}
