import { useNavigate } from 'react-router-dom'
import { MapPin, Clock } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { StatusBadge } from '../ui/StatusBadge.jsx'
import { PriorityBadge } from '../ui/PriorityBadge.jsx'
import { formatDate } from '../../lib/utils.js'

export function ReportCard({ report }) {
  const navigate = useNavigate()

  return (
    <Card
      className="flex gap-3.5 !p-3.5 hover:shadow-card-hover transition-all cursor-pointer border border-line"
      onClick={() => navigate(`/track/${report.report_code}`)}
    >
      {/* Photo thumbnail */}
      <div className="flex-shrink-0">
        <img
          src={report.photo_url}
          alt="Pothole"
          className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-2xl bg-surface-muted border border-line"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80/e5e7eb/9ca3af?text=📷'
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-brand-blue">
              {report.report_code}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-ink font-semibold line-clamp-2 leading-snug mb-1">
            {report.description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-ink-muted flex-wrap pt-1 border-t border-line">
          <div className="flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="h-3 w-3 flex-shrink-0 text-brand-teal" />
            <span className="truncate">{report.address || `${report.city || 'Punjab'}, India`}</span>
          </div>
          <span className="text-line-strong">·</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 flex-shrink-0 text-ink-muted" />
            <span>{formatDate(report.created_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
