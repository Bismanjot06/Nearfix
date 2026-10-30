import { STATUSES } from '../../lib/constants.js'

export function StatusBadge({ status, className = '' }) {
  const conf = STATUSES[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.badgeClass} ${className}`}
    >
      {conf.label}
    </span>
  )
}
