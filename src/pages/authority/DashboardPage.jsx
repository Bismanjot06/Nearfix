import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  Info,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { StatusBadge } from '../../components/ui/StatusBadge.jsx'
import { PriorityBadge } from '../../components/ui/PriorityBadge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { EmptyState, ErrorState } from '../../components/ui/EmptyState.jsx'
import { getAuthorityReports, getDashboardStats } from '../../services/reports.js'
import { STATUSES, PRIORITIES } from '../../lib/constants.js'
import { formatDate, getAgeDays } from '../../lib/utils.js'

export default function DashboardPage() {
  const navigate = useNavigate()

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    highPriority: 0,
    inProgress: 0,
    repaired: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Reports table state
  const [reports, setReports] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [expandedReasons, setExpandedReasons] = useState({})

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    const { data } = await getDashboardStats()
    if (data) setStats(data)
    setStatsLoading(false)
  }, [])

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, count, totalPages: pages, error: err } = await getAuthorityReports({
      page,
      limit: 20,
      search,
      status: statusFilter,
      priority: priorityFilter,
      dateRange,
      city: cityFilter,
    })

    if (err) {
      setError(err.message || 'Failed to fetch reports.')
    } else {
      setReports(data || [])
      setTotalCount(count || 0)
      setTotalPages(pages || 1)
    }
    setLoading(false)
  }, [page, search, statusFilter, priorityFilter, dateRange, cityFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  function toggleReasons(id, e) {
    e.stopPropagation()
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleFilterSubmit(e) {
    e.preventDefault()
    setPage(1)
    fetchReports()
  }

  function resetFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setDateRange('all')
    setCityFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Authority Console</h1>
          <p className="text-sm text-ink-muted">
            Municipal roadway inspection, status dispatch & resolution tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchStats()
              fetchReports()
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── STATS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total */}
        <Card className="!p-4 bg-surface border border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total</span>
            <div className="w-7 h-7 rounded-lg bg-surface-muted text-ink flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-ink">
            {statsLoading ? '–' : stats.total}
          </p>
          <span className="text-[11px] text-ink-muted">All registered reports</span>
        </Card>

        {/* Pending Verification (Submitted) */}
        <Card
          className="!p-4 bg-surface border border-red-100 dark:border-red-900/50 hover:border-red-200 dark:hover:border-red-800 cursor-pointer"
          onClick={() => {
            setStatusFilter('submitted')
            setPage(1)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            {statsLoading ? '–' : stats.submitted}
          </p>
          <span className="text-[11px] text-ink-muted">Needs inspection</span>
        </Card>

        {/* High Priority */}
        <Card
          className="!p-4 bg-surface border border-amber-100 dark:border-amber-900/50 hover:border-amber-200 dark:hover:border-amber-800 cursor-pointer"
          onClick={() => {
            setPriorityFilter('high')
            setPage(1)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">High Risk</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {statsLoading ? '–' : stats.highPriority}
          </p>
          <span className="text-[11px] text-ink-muted">Excludes closed/repaired</span>
        </Card>

        {/* In Progress */}
        <Card
          className="!p-4 bg-surface border border-blue-100 dark:border-blue-900/50 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer"
          onClick={() => {
            setStatusFilter('in_progress')
            setPage(1)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active Work</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {statsLoading ? '–' : stats.inProgress}
          </p>
          <span className="text-[11px] text-ink-muted">Repairs underway</span>
        </Card>

        {/* Repaired */}
        <Card
          className="!p-4 bg-surface border border-green-100 dark:border-green-900/50 hover:border-green-200 dark:hover:border-green-800 cursor-pointer col-span-2 sm:col-span-1"
          onClick={() => {
            setStatusFilter('repaired')
            setPage(1)
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Repaired</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">
            {statsLoading ? '–' : stats.repaired}
          </p>
          <span className="text-[11px] text-ink-muted">Fixed & verified</span>
        </Card>
      </div>

      {/* ── CITY TOGGLE PILLS (LUDHIANA / AMRITSAR) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <span className="text-xs font-bold text-ink flex items-center gap-1.5 mr-1">
          <MapPin className="h-3.5 w-3.5 text-brand-teal" />
          City:
        </span>
        <button
          onClick={() => {
            setCityFilter('all')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            cityFilter === 'all'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-surface text-ink-muted border border-line hover:bg-surface-muted'
          }`}
        >
          All Punjab Cities
        </button>
        <button
          onClick={() => {
            setCityFilter('ludhiana')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            cityFilter === 'ludhiana'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'bg-surface text-ink-muted border border-line hover:bg-surface-muted'
          }`}
        >
          📍 Ludhiana (MC)
        </button>
        <button
          onClick={() => {
            setCityFilter('amritsar')
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            cityFilter === 'amritsar'
              ? 'bg-brand-blue text-white shadow-sm'
              : 'bg-surface text-ink-muted border border-line hover:bg-surface-muted'
          }`}
        >
          📍 Amritsar (MCA)
        </button>
      </div>

      {/* ── FILTERS BAR ── */}
      <Card className="!p-4">
        <form onSubmit={handleFilterSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, location, road…"
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-xl bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
            >
              <option value="all">All Statuses</option>
              {Object.values(STATUSES).map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs border border-line rounded-xl bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue font-medium"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-ink-muted font-medium">
              Showing <strong className="text-ink">{reports.length}</strong> of{' '}
              <strong className="text-ink">{totalCount}</strong> reports
            </span>
            {(search || statusFilter !== 'all' || priorityFilter !== 'all' || dateRange !== 'all' || cityFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-brand-blue hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* ── REPORTS LIST (DESKTOP TABLE & MOBILE CARDS) ── */}
      {error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-3xl shadow-card">
          <Spinner size="lg" />
          <p className="text-xs text-ink-muted mt-3 font-medium">Loading reports queue…</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports match your filters"
          message="Try adjusting your status, city or priority filters to view more reports."
          action={resetFilters}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-surface rounded-3xl shadow-card overflow-hidden border border-line">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-900 text-white text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Report Code</th>
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Description & Location</th>
                  <th className="py-3.5 px-4">Rule Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reported</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {reports.map((report) => {
                  const age = getAgeDays(report.created_at)
                  const isOverridden = report.priority_overridden
                  const isExpanded = expandedReasons[report.id]

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-surface-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/authority/reports/${report.id}`)}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-blue whitespace-nowrap">
                        {report.report_code}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3.5 px-4">
                        <img
                          src={report.photo_url}
                          alt="Pothole"
                          className="h-12 w-12 object-cover rounded-xl bg-surface-muted border border-line"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/48?text=📷'
                          }}
                        />
                      </td>

                      {/* Description & Location */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-ink line-clamp-1 mb-0.5">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                          <MapPin className="h-3 w-3 flex-shrink-0 text-brand-teal" />
                          <span className="truncate">{report.address || `${report.city || 'Punjab'}, India`}</span>
                        </div>
                      </td>

                      {/* Rule-Based Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5">
                            <PriorityBadge priority={report.priority} isOverridden={isOverridden} />
                            <button
                              type="button"
                              onClick={(e) => toggleReasons(report.id, e)}
                              className="text-ink-muted hover:text-ink transition-colors"
                              title="Show rule-based calculation breakdown"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {isOverridden && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              (Authority Overridden)
                            </span>
                          )}
                          {isExpanded && report.priority_reasons && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 p-2 bg-surface-muted rounded-lg text-[10px] text-ink max-w-xs border border-line shadow-sm space-y-0.5"
                            >
                              <p className="font-bold text-ink">
                                Rule-based Score: {report.priority_score ?? '–'}
                              </p>
                              {report.priority_reasons.map((r, i) => (
                                <p key={i} className="text-ink-muted">• {r}</p>
                              ))}
                              {isOverridden && (
                                <p className="text-amber-700 font-semibold pt-1">
                                  Override reason: {report.override_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={report.status} />
                      </td>

                      {/* Reported date & Age */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-ink-muted">
                        <div className="font-medium text-ink">{formatDate(report.created_at)}</div>
                        <div className="text-[11px] text-ink-muted">
                          {age === 0 ? 'Today' : `${age} day${age === 1 ? '' : 's'} ago`}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/authority/reports/${report.id}`)
                          }}
                        >
                          Review →
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {reports.map((report) => {
              const age = getAgeDays(report.created_at)
              const isOverridden = report.priority_overridden
              const isExpanded = expandedReasons[report.id]

              return (
                <Card
                  key={report.id}
                  className="!p-4 hover:shadow-card-hover transition cursor-pointer"
                  onClick={() => navigate(`/authority/reports/${report.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={report.photo_url}
                      alt="Pothole"
                      className="h-16 w-16 object-cover rounded-xl bg-surface-muted border border-line flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64?text=📷'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-bold text-brand-blue">
                          {report.report_code}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-xs font-semibold text-ink line-clamp-2 mb-1">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted mb-2">
                        <MapPin className="h-3 w-3 text-brand-teal flex-shrink-0" />
                        <span className="truncate">{report.address || `${report.city || 'Punjab'}, India`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={report.priority} isOverridden={isOverridden} />
                      <button
                        type="button"
                        onClick={(e) => toggleReasons(report.id, e)}
                        className="text-ink-muted hover:text-ink p-0.5"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right text-[11px] text-ink-muted font-medium">
                      {age === 0 ? 'Today' : `${age}d ago`}
                    </div>
                  </div>

                  {isExpanded && report.priority_reasons && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 p-2.5 bg-surface-muted rounded-xl text-[11px] text-ink border border-line space-y-1"
                    >
                      <p className="font-bold text-ink">
                        Rule Score: {report.priority_score ?? '–'}
                      </p>
                      {report.priority_reasons.map((r, i) => (
                        <p key={i} className="text-ink-muted">• {r}</p>
                      ))}
                      {isOverridden && (
                        <p className="text-amber-700 font-semibold pt-0.5">
                          Override: {report.override_reason}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-ink-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
