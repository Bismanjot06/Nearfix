import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Camera,
  Check,
} from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { PriorityBadge } from '../components/ui/PriorityBadge.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { getReportByCode, getReportHistory } from '../services/reports.js'
import { formatDate } from '../lib/utils.js'
import { CITIZEN_STATUS_STEPS } from '../lib/constants.js'

function CitizenStatusStepper({ currentStatus }) {
  if (currentStatus === 'rejected') {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-center">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600 dark:text-red-400">
          <XCircle className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Report Status: Rejected</h4>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-sm mx-auto">
          The municipal authority inspected this submission and marked it as non-actionable or invalid.
        </p>
      </div>
    )
  }

  const steps = CITIZEN_STATUS_STEPS
  const currentIdx = steps.findIndex((s) => s.key === currentStatus)

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isFuture = idx > currentIdx

        return (
          <div key={step.key} className="flex gap-4">
            {/* Step Icon & connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-brand-blue border-brand-blue text-white ring-4 ring-brand-blue/20 shadow-sm'
                    : 'bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700 text-gray-300 dark:text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Circle className="h-3 w-3 fill-white" />
                ) : (
                  <span className="text-[11px] font-bold">{idx + 1}</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-0.5 h-10 my-0.5 ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-200 dark:bg-navy-700'
                  }`}
                />
              )}
            </div>

            {/* Step Label & Description */}
            <div className="pb-6 pt-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-bold leading-none ${
                    isFuture
                      ? 'text-gray-400 dark:text-slate-500'
                      : isCurrent
                      ? 'text-brand-blue dark:text-blue-400'
                      : 'text-navy-900 dark:text-white'
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="text-[10px] bg-brand-blue/10 dark:bg-blue-900/40 text-brand-blue dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 leading-snug ${isFuture ? 'text-gray-400 dark:text-slate-500' : 'text-gray-600 dark:text-slate-300'}`}>
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackPage() {
  const { reportId } = useParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(reportId || '')
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const performSearch = useCallback(async (code) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return

    setSearching(true)
    setNotFound(false)
    setReport(null)
    setHistory([])
    setFetchError('')

    const { data, error } = await getReportByCode(normalized)

    if (error) {
      setFetchError(error.message || 'Search failed. Please try again.')
    } else if (!data) {
      setNotFound(true)
    } else {
      setReport(data)
      // Fetch public history
      const { data: hist } = await getReportHistory(data.id)
      setHistory(hist || [])
    }
    setSearching(false)
  }, [])

  useEffect(() => {
    if (reportId) {
      performSearch(reportId)
    }
  }, [reportId, performSearch])

  // Refetch on page focus to see real-time status updates
  useEffect(() => {
    const handleFocus = () => {
      if (report?.report_code) {
        performSearch(report.report_code)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [report?.report_code, performSearch])

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/track/${query.trim().toUpperCase()}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
          Track a Report
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Enter your unique NearFix ID (e.g. NF-2610-LDH01)
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="NF-2610-XXXXX"
            className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 dark:border-navy-700 rounded-2xl bg-white dark:bg-navy-900 text-navy-900 dark:text-white shadow-card focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal placeholder:normal-case"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={searching}
          disabled={searching}
          className="font-bold shadow-sm"
        >
          Track
        </Button>
      </form>

      {/* Searching Spinner */}
      {searching && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3 font-medium">Looking up report status…</p>
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !searching && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{fetchError}</p>
        </div>
      )}

      {/* Not Found Screen */}
      {notFound && !searching && (
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-8 text-center max-w-md mx-auto border border-gray-100 dark:border-navy-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-navy-900 dark:text-white mb-1">Report Not Found</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
            No active or archived report matched <span className="font-mono font-bold text-navy-900 dark:text-white">{query}</span>.
            Please verify the characters or submit a new report.
          </p>
          <Button variant="primary" onClick={() => navigate('/report')}>
            Submit New Report
          </Button>
        </div>
      )}

      {/* Report Dossier Screen */}
      {report && !searching && (
        <div className="space-y-6">
          {/* Top Status Banner if Repaired or Rejected */}
          {report.status === 'repaired' && (
            <div className="bg-green-50 dark:bg-green-950/40 border-2 border-green-200 dark:border-green-800 rounded-3xl p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/60 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-green-900 dark:text-green-200">
                  Pothole Successfully Repaired!
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 leading-relaxed">
                  The municipal maintenance team has completed the repair work and verified the road surface.
                </p>
                {report.closure_note && (
                  <p className="mt-2 text-xs text-green-800 dark:text-green-200 bg-white/80 dark:bg-navy-900/80 p-2.5 rounded-xl border border-green-200/60 dark:border-green-800/60 font-medium">
                    &ldquo;{report.closure_note}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {report.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/50 rounded-3xl p-5 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-red-900 dark:text-red-200">Report Rejected</h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                  This report was reviewed by municipal officers and marked as rejected.
                </p>
                {report.rejection_reason && (
                  <div className="mt-2 text-xs text-red-800 dark:text-red-200 bg-white/80 dark:bg-navy-900/80 p-2.5 rounded-xl border border-red-200/60 dark:border-red-800/60">
                    <span className="font-bold">Official Reason: </span>
                    <span>{report.rejection_reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos: Before & After (if repaired) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Citizen Submitted Photo */}
            <div className="rounded-3xl overflow-hidden shadow-card border border-gray-100 dark:border-navy-700 bg-white dark:bg-navy-800">
              <div className="p-3 bg-navy-900 text-white text-xs font-bold flex items-center justify-between">
                <span>Citizen Reported Photo</span>
                <span className="text-[10px] text-white/60">Before</span>
              </div>
              <img
                src={report.photo_url}
                alt="Pothole Reported"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x200?text=No+Photo'
                }}
              />
            </div>

            {/* Repair Completion Photo if available */}
            {report.repair_photo_url ? (
              <div className="rounded-3xl overflow-hidden shadow-card border border-green-200 dark:border-green-800 bg-white dark:bg-navy-800">
                <div className="p-3 bg-green-600 text-white text-xs font-bold flex items-center justify-between">
                  <span>Municipal Repair Proof</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">After</span>
                </div>
                <img
                  src={report.repair_photo_url}
                  alt="Pothole Repaired"
                  className="w-full h-48 object-cover"
                />
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900/40 flex flex-col items-center justify-center p-6 text-center">
                <Camera className="h-8 w-8 text-gray-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">Repair Proof Pending</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
                  A completion photo will be published here once maintenance is finished.
                </p>
              </div>
            )}
          </div>

          {/* Details Card */}
          <Card className="!p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider block">
                  Report Dossier
                </span>
                <span className="text-xl font-black font-mono text-brand-blue dark:text-blue-400">
                  {report.report_code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
            </div>

            <p className="text-sm text-navy-900 dark:text-slate-100 font-medium leading-relaxed bg-gray-50 dark:bg-navy-900/60 p-4 rounded-2xl border border-gray-100 dark:border-navy-700">
              {report.description}
            </p>

            <div className="space-y-2 text-xs text-gray-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-teal flex-shrink-0" />
                <span className="font-medium">{report.address || `${report.city || 'Punjab'}, India`}</span>
                <span className="text-gray-300 dark:text-slate-600">·</span>
                <span className="font-mono text-gray-400 dark:text-slate-500">
                  {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span>Submitted on {formatDate(report.created_at)}</span>
              </div>

              {report.verified_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>Verified by municipal authority on {formatDate(report.verified_at)}</span>
                </div>
              )}

              {report.resolved_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Closed & repaired on {formatDate(report.resolved_at)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Progress Timeline Stepper */}
          <Card className="!p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-navy-900 dark:text-white">Resolution Progress</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Live lifecycle stages from field inspection to closure</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => performSearch(report.report_code)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>

            <CitizenStatusStepper currentStatus={report.status} />
          </Card>

          {/* Timestamped Public History */}
          {history.length > 0 && (
            <Card className="!p-6 space-y-4">
              <h3 className="text-base font-black text-navy-900 dark:text-white">Status Update Log</h3>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-gray-50 dark:bg-navy-900/60 rounded-2xl border border-gray-100 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs"
                  >
                    <div>
                      <span className="font-bold text-navy-900 dark:text-slate-200 block sm:inline mr-2">
                        {item.note || `Status changed to ${item.new_status}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Default Instruction Banner */}
      {!report && !searching && !notFound && !fetchError && (
        <div className="bg-blue-50 dark:bg-navy-900/60 border border-blue-200/70 dark:border-navy-700 rounded-3xl p-6 text-navy-900 dark:text-slate-100 transition-colors">
          <p className="text-sm font-bold text-brand-blue dark:text-blue-400 mb-1">
            💡 Real-time Municipal Tracking
          </p>
          <p className="text-xs text-blue-900/80 dark:text-slate-300 leading-relaxed">
            Every submitted pothole receives an automated tracking ID like{' '}
            <strong className="font-mono text-navy-900 dark:text-white">NF-2610-LDH01</strong>. Track inspections,
            crew dispatch, and photographic repair proof directly on this page.
          </p>
        </div>
      )}
    </div>
  )
}
