import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  UserCheck,
  RotateCcw,
  Camera,
  Upload,
  AlertTriangle,
  Info,
  ShieldAlert,
  Send,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { StatusBadge } from '../../components/ui/StatusBadge.jsx'
import { PriorityBadge } from '../../components/ui/PriorityBadge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/EmptyState.jsx'
import {
  getReportById,
  getReportHistory,
  updateReportStatus,
  updateReportAuthorityFields,
  setPriorityOverride,
  uploadRepairPhoto,
} from '../../services/reports.js'
import {
  STATUSES,
  PRIORITIES,
  DEFAULT_MARKER_COLOR,
  TRAFFIC_LEVELS,
  SENSITIVE_LOCATIONS,
  ALLOWED_TRANSITIONS,
} from '../../lib/constants.js'
import { formatDate, getAgeDays, compressImage } from '../../lib/utils.js'
import { calculatePriority } from '../../lib/priority.js'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Create pin icon for leaflet
function createPinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

export default function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', text: '' }

  // Authority editable fields
  const [trafficLevel, setTrafficLevel] = useState('')
  const [sensitiveLocation, setSensitiveLocation] = useState('')
  const [savingFields, setSavingFields] = useState(false)

  // Override priority state
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overridePriorityValue, setOverridePriorityValue] = useState('high')
  const [overrideReason, setOverrideReason] = useState('')

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Repair completion state
  const [closureNote, setClosureNote] = useState('')
  const [repairPhotoFile, setRepairPhotoFile] = useState(null)
  const [repairPhotoPreview, setRepairPhotoPreview] = useState('')
  const [uploadingRepairPhoto, setUploadingRepairPhoto] = useState(false)
  const repairFileInputRef = useRef(null)

  // Fetch report and history
  const loadReportData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rep, error: repErr } = await getReportById(id)
    if (repErr || !rep) {
      setError(repErr?.message || 'Report not found.')
      setLoading(false)
      return
    }

    setReport(rep)
    setTrafficLevel(rep.traffic_level || '')
    setSensitiveLocation(rep.near_sensitive_location || '')

    const { data: hist } = await getReportHistory(id)
    setHistory(hist || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadReportData()
  }, [loadReportData])

  function showMessage(type, text) {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Handle saving authority fields
  async function handleSaveAuthorityFields(e) {
    e.preventDefault()
    setSavingFields(true)
    const { data, error: err } = await updateReportAuthorityFields({
      reportId: report.id,
      trafficLevel: trafficLevel || null,
      nearSensitiveLocation: sensitiveLocation.trim() || null,
    })

    if (err) {
      showMessage('error', err.message || 'Failed to update fields.')
    } else {
      setReport(data)
      showMessage('success', 'Authority verification fields updated.')
      const { data: hist } = await getReportHistory(id)
      setHistory(hist || [])
    }
    setSavingFields(false)
  }

  // Handle priority override
  async function handleApplyOverride(e) {
    e.preventDefault()
    if (!overrideReason.trim()) {
      showMessage('error', 'An override reason is required.')
      return
    }
    setActionLoading(true)
    const { data, error: err } = await setPriorityOverride({
      reportId: report.id,
      priority: overridePriorityValue,
      overrideReason: overrideReason.trim(),
      reset: false,
    })

    if (err) {
      showMessage('error', err.message || 'Failed to set priority override.')
    } else {
      setReport(data)
      setShowOverrideModal(false)
      setOverrideReason('')
      showMessage('success', `Priority manually overridden to ${overridePriorityValue}.`)
      const { data: hist } = await getReportHistory(id)
      setHistory(hist || [])
    }
    setActionLoading(false)
  }

  // Handle reset to calculated priority
  async function handleResetPriority() {
    setActionLoading(true)
    const { data, error: err } = await setPriorityOverride({
      reportId: report.id,
      reset: true,
    })

    if (err) {
      showMessage('error', err.message || 'Failed to reset priority.')
    } else {
      setReport(data)
      showMessage('success', 'Priority reset to rule-based calculation.')
      const { data: hist } = await getReportHistory(id)
      setHistory(hist || [])
    }
    setActionLoading(false)
  }

  // Status transition handler
  async function handleTransition(newStatus, additionalParams = {}) {
    setActionLoading(true)
    const { data, error: err } = await updateReportStatus({
      reportId: report.id,
      newStatus,
      ...additionalParams,
    })

    if (err) {
      showMessage('error', err.message || `Failed to change status to ${newStatus}`)
    } else {
      setReport(data)
      setShowRejectModal(false)
      showMessage('success', `Status updated to ${STATUSES[newStatus]?.label || newStatus}`)
      const { data: hist } = await getReportHistory(id)
      setHistory(hist || [])
    }
    setActionLoading(false)
  }

  // Handle repair photo selection
  async function handleRepairPhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingRepairPhoto(true)
    try {
      const compressed = await compressImage(file)
      const preview = URL.createObjectURL(compressed)
      setRepairPhotoFile(compressed)
      setRepairPhotoPreview(preview)
    } catch {
      setRepairPhotoFile(file)
      setRepairPhotoPreview(URL.createObjectURL(file))
    }
    setUploadingRepairPhoto(false)
    e.target.value = ''
  }

  // Submit complete repair
  async function handleCompleteRepair(e) {
    e.preventDefault()
    setActionLoading(true)
    let repairPhotoUrl = null

    if (repairPhotoFile) {
      const { url, error: uploadErr } = await uploadRepairPhoto(repairPhotoFile)
      if (uploadErr) {
        showMessage('error', 'Repair photo upload failed: ' + uploadErr.message)
        setActionLoading(false)
        return
      }
      repairPhotoUrl = url
    }

    await handleTransition('repaired', {
      closureNote: closureNote.trim() || null,
      repairPhotoUrl,
    })
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spinner size="lg" />
        <p className="text-xs text-ink-muted mt-4 font-medium">Loading report dossier…</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <ErrorState
        message={error || 'Report not found.'}
        onRetry={loadReportData}
      />
    )
  }

  const age = getAgeDays(report.created_at)
  const markerColor = STATUSES[report.status]?.markerColor || DEFAULT_MARKER_COLOR
  const isOverridden = report.priority_overridden
  const allowedTransitions = ALLOWED_TRANSITIONS[report.status] || []

  return (
    <div className="space-y-6">
      {/* ── TOP BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/authority')}
            className="w-9 h-9 rounded-xl bg-surface shadow-card flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black font-mono text-ink">
                {report.report_code}
              </h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-ink-muted">
              Submitted {formatDate(report.created_at)} ({age} day{age === 1 ? '' : 's'} ago)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/track/${report.report_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface border border-line text-ink hover:bg-surface-muted transition"
          >
            <span>Public Tracking View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* ── FEEDBACK ALERT ── */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900/50'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/50'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Visuals, Description & Location */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos Card */}
          <Card className="!p-4 space-y-4">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
              Photographic Evidence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Citizen Photo */}
              <div>
                <span className="text-[11px] font-bold text-ink-muted block mb-1.5">
                  Citizen Submission Photo
                </span>
                <div className="rounded-2xl overflow-hidden border border-line bg-surface-muted aspect-video relative">
                  <img
                    src={report.photo_url}
                    alt="Citizen Pothole Report"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x250?text=No+Photo'
                    }}
                  />
                </div>
              </div>

              {/* Repair Photo if completed */}
              <div>
                <span className="text-[11px] font-bold text-ink-muted block mb-1.5">
                  Repair Completion Photo
                </span>
                {report.repair_photo_url ? (
                  <div className="rounded-2xl overflow-hidden border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/40 aspect-video relative">
                    <img
                      src={report.repair_photo_url}
                      alt="Repaired Pothole Proof"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-green-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      Verified Fixed ✓
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-line aspect-video flex flex-col items-center justify-center text-center p-4 bg-surface-muted">
                    <Camera className="h-6 w-6 text-ink-muted mb-1" />
                    <span className="text-xs text-ink-muted font-medium">
                      No repair photo attached yet
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-line">
              <span className="text-[11px] font-bold text-ink-muted block mb-1">
                Citizen Description
              </span>
              <p className="text-sm text-ink font-medium leading-relaxed bg-surface-muted p-3 rounded-xl border border-line">
                {report.description}
              </p>
            </div>

            {/* Rejection / Closure Notes if present */}
            {report.rejection_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 text-xs">
                <span className="font-bold text-red-800 dark:text-red-300 block mb-0.5">Rejection Notice:</span>
                <p className="text-red-700 dark:text-red-300">{report.rejection_reason}</p>
              </div>
            )}
            {report.closure_note && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-900/50 text-xs">
                <span className="font-bold text-green-800 dark:text-green-200 block mb-0.5">Repair Closure Note:</span>
                <p className="text-green-700 dark:text-green-300">{report.closure_note}</p>
              </div>
            )}
          </Card>

          {/* Location & Map Card */}
          <Card className="!p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
                Geographic Location
              </h2>
              <span className="text-xs font-mono text-ink-muted">
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-ink font-semibold bg-surface-muted p-2.5 rounded-xl border border-line">
              <MapPin className="h-4 w-4 text-brand-teal flex-shrink-0" />
              <span>{report.address || `${report.city || 'Punjab'}, India`}</span>
            </div>

            {/* Mini Leaflet Map */}
            <div className="rounded-2xl overflow-hidden border border-line h-64 relative z-0">
              <MapContainer
                center={[report.latitude, report.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[report.latitude, report.longitude]}
                  icon={createPinIcon(markerColor)}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>{report.report_code}</strong>
                      <p>{report.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </Card>

          {/* Complete Audit History Timeline */}
          <Card className="!p-4 space-y-4">
            <h2 className="text-xs font-bold text-ink uppercase tracking-wider">
              Audit & Transition History
            </h2>
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-xs text-ink-muted">No history records logged yet.</p>
              ) : (
                history.map((h, idx) => (
                  <div key={h.id || idx} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-navy-100 text-ink flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      {idx < history.length - 1 && (
                        <div className="w-0.5 h-full bg-line my-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-ink">
                          {h.old_status
                            ? `${STATUSES[h.old_status]?.label || h.old_status} → ${
                                STATUSES[h.new_status]?.label || h.new_status
                              }`
                            : `Initial: ${STATUSES[h.new_status]?.label || h.new_status}`}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formatDate(h.created_at)}
                        </span>
                      </div>
                      <p className="text-ink-muted bg-surface-muted p-2 rounded-lg border border-line">
                        {h.note || 'No additional note'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Priority Rules, Authority Assessment & Workflow Actions */}
        <div className="space-y-6">
          {/* Rule-Based Priority Panel */}
          <Card className="!p-5 bg-navy-900 text-white space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest block">
                  Automated Calculation
                </span>
                <h3 className="text-base font-black text-white">Rule-Based Priority</h3>
              </div>
              <PriorityBadge priority={report.priority} isOverridden={isOverridden} />
            </div>

            {isOverridden ? (
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Overridden by Authority
                </div>
                <p className="text-xs text-amber-200">
                  Reason: &ldquo;{report.override_reason}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={handleResetPriority}
                  disabled={actionLoading}
                  className="mt-2 text-[11px] font-bold text-white bg-surface/10 hover:bg-surface/20 px-2.5 py-1 rounded-lg transition"
                >
                  Reset to Rule Calculation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-white/70">Calculated Score</span>
                  <span className="text-xl font-mono font-black text-brand-teal">
                    {report.priority_score ?? '–'}
                  </span>
                </div>
                <div className="text-[11px] text-white/80 space-y-1 bg-surface/5 p-3 rounded-xl border border-white/10">
                  {report.priority_reasons?.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-brand-teal">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="teal"
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => setShowOverrideModal(true)}
            >
              <Sliders className="h-3.5 w-3.5" />
              Manual Priority Override
            </Button>
          </Card>

          {/* Authority Verified Fields Form */}
          <Card className="!p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                Verification Parameters
              </span>
              <h3 className="text-sm font-black text-ink">
                Manually Entered by Authority
              </h3>
            </div>

            <form onSubmit={handleSaveAuthorityFields} className="space-y-3">
              {/* Traffic level */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Traffic Level
                </label>
                <select
                  value={trafficLevel}
                  onChange={(e) => setTrafficLevel(e.target.value)}
                  className="w-full text-xs border border-line rounded-xl px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                >
                  <option value="">– Not Assessed –</option>
                  {TRAFFIC_LEVELS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sensitive location */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Near Sensitive Location
                </label>
                <input
                  type="text"
                  list="sensitive-locations-list"
                  value={sensitiveLocation}
                  onChange={(e) => setSensitiveLocation(e.target.value)}
                  placeholder="e.g. DMC Hospital, Sacred Heart School"
                  className="w-full text-xs border border-line rounded-xl px-3 py-2 bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <datalist id="sensitive-locations-list">
                  {SENSITIVE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
                <p className="text-[10px] text-ink-muted mt-1">
                  Adds +2 points to rule priority score if set.
                </p>
              </div>

              {/* Reporter-submitted severity (read-only for authority inspection) */}
              <div className="bg-surface-muted p-2.5 rounded-xl border border-line text-xs">
                <span className="text-ink-muted font-medium">Citizen Reported Severity: </span>
                <strong className="text-ink capitalize">
                  {report.reported_severity || 'Medium'}
                </strong>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="w-full font-bold"
                loading={savingFields}
                disabled={savingFields}
              >
                Save Authority Fields
              </Button>
            </form>
          </Card>

          {/* Workflow Status Actions */}
          <Card className="!p-5 space-y-4 border-2 border-brand-blue/20">
            <div>
              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider block">
                Workflow Actions
              </span>
              <h3 className="text-sm font-black text-ink">
                Current Status: {STATUSES[report.status]?.label}
              </h3>
            </div>

            {/* Transition: Submitted -> Verified or Rejected */}
            {report.status === 'submitted' && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full text-xs"
                  onClick={() => handleTransition('verified')}
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  <UserCheck className="h-4 w-4" />
                  Verify Pothole Report
                </Button>

                <Button
                  variant="danger"
                  className="w-full text-xs"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Report
                </Button>
              </div>
            )}

            {/* Transition: Verified -> Assigned */}
            {report.status === 'verified' && (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted">
                  Report verified. Ready to dispatch repair crew and equipment.
                </p>
                <Button
                  variant="primary"
                  className="w-full text-xs"
                  onClick={() => handleTransition('assigned')}
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  <Wrench className="h-4 w-4" />
                  Assign Maintenance Crew
                </Button>
              </div>
            )}

            {/* Transition: Assigned -> In Progress */}
            {report.status === 'assigned' && (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted">
                  Crew assigned. Mark active when roadwork begins on site.
                </p>
                <Button
                  variant="primary"
                  className="w-full text-xs"
                  onClick={() => handleTransition('in_progress')}
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  <Wrench className="h-4 w-4" />
                  Start Work (In Progress)
                </Button>
              </div>
            )}

            {/* Transition: In Progress -> Repaired */}
            {report.status === 'in_progress' && (
              <form onSubmit={handleCompleteRepair} className="space-y-3">
                <p className="text-xs text-ink-muted font-medium">
                  Roadwork complete? Attach photographic proof & closing note to resolve.
                </p>

                {/* Repair Photo Upload */}
                <div>
                  <input
                    ref={repairFileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleRepairPhotoSelect}
                  />

                  {repairPhotoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-green-200 dark:border-green-900/50">
                      <img
                        src={repairPhotoPreview}
                        alt="Repair preview"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRepairPhotoFile(null)
                          setRepairPhotoPreview('')
                        }}
                        className="absolute top-2 right-2 bg-surface rounded-full p-1 text-ink shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => repairFileInputRef.current?.click()}
                      loading={uploadingRepairPhoto}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Add Repair Proof Photo
                    </Button>
                  )}
                </div>

                {/* Closure note */}
                <textarea
                  value={closureNote}
                  onChange={(e) => setClosureNote(e.target.value)}
                  placeholder="Closure note: e.g. Hot mix asphalt applied & roller compacted."
                  rows={2}
                  className="w-full text-xs border border-line rounded-xl p-2.5 bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />

                <Button
                  type="submit"
                  variant="teal"
                  className="w-full text-xs font-bold"
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Repaired & Close
                </Button>
              </form>
            )}

            {/* Reopen if rejected */}
            {report.status === 'rejected' && (
              <div className="space-y-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  This report was previously rejected. Authority can reopen if new evidence is provided.
                </p>
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => handleTransition('submitted')}
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reopen Report
                </Button>
              </div>
            )}

            {/* Repaired state info */}
            {report.status === 'repaired' && (
              <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl border border-green-200 dark:border-green-900/50 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-green-800 dark:text-green-200">
                  Pothole Successfully Repaired
                </p>
                <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">
                  Closed on {formatDate(report.resolved_at || report.updated_at)}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── PRIORITY OVERRIDE MODAL ── */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-ink">
              Override Report Priority
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Authority overrides bypass automated rule scoring. A documented rationale is required for the public audit trail.
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Target Priority Level
                </label>
                <select
                  value={overridePriorityValue}
                  onChange={(e) => setOverridePriorityValue(e.target.value)}
                  className="w-full text-xs border border-line rounded-xl p-2.5 bg-surface font-bold"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Official Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Scheduled VIP motorcade route; immediate patch required."
                  rows={3}
                  className="w-full text-xs border border-line rounded-xl p-2.5 bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowOverrideModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  Save Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REJECT REPORT MODAL ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Reject Pothole Report
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Please enter the official rejection reason. This will be visible to the citizen on their tracking page.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!rejectionReason.trim()) {
                  showMessage('error', 'Rejection reason is required.')
                  return
                }
                handleTransition('rejected', { rejectionReason: rejectionReason.trim() })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Duplicate report, private parking lot, or under active Smart City construction trench."
                  rows={3}
                  className="w-full text-xs border border-line rounded-xl p-2.5 bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
