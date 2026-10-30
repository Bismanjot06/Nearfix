import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Crosshair, Send, CheckCircle2, Copy, ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { PhotoUploader } from '../components/reports/PhotoUploader.jsx'
import { LocationPicker } from '../components/map/LocationPicker.jsx'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { createReport, uploadPhoto } from '../services/reports.js'
import { copyToClipboard } from '../lib/utils.js'
import {
  SEVERITIES,
  SERVICE_AREAS,
  SERVICE_AREA_MESSAGE,
  getCityForLocation,
  isLocationInServiceArea,
} from '../lib/constants.js'

const MAX_CHARS = 280

export default function ReportPage() {
  const navigate = useNavigate()
  const {
    location,
    error: geoError,
    loading: geoLoading,
    requestLocation,
    setLocation,
    setError: setGeoError,
  } = useGeolocation()

  // Form state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successReport, setSuccessReport] = useState(null)
  const [copied, setCopied] = useState(false)

  // Service area validation state
  const detectedCity = location ? getCityForLocation(location.lat, location.lng) : null
  const isWithinServiceArea = location ? isLocationInServiceArea(location.lat, location.lng) : true

  function handlePhotoSelect(file, preview) {
    setPhotoFile(file)
    setPhotoPreview(preview)
    setFormError('')
  }

  function handlePhotoClear() {
    setPhotoFile(null)
    setPhotoPreview('')
  }

  // Quick pin preset handler
  function selectCityPreset(cityKey) {
    const city = SERVICE_AREAS[cityKey]
    if (city) {
      setLocation({ lat: city.lat, lng: city.lng })
      setGeoError(null)
      setFormError('')
    }
  }

  function handleGpsClick() {
    setFormError('')
    requestLocation((coords) => {
      // Pin placed at GPS coordinates
      if (!isLocationInServiceArea(coords.lat, coords.lng)) {
        setFormError(`${SERVICE_AREA_MESSAGE} Your GPS pin is still shown on the map, but reporting here is blocked.`)
      } else {
        setFormError('')
      }
    })
  }

  function handleLocationChange(newCoords) {
    setLocation(newCoords)
    if (!isLocationInServiceArea(newCoords.lat, newCoords.lng)) {
      setFormError(SERVICE_AREA_MESSAGE)
    } else {
      setFormError('')
    }
  }

  function validate() {
    if (!photoFile) return 'Please add a photo of the pothole.'
    if (!location) return 'Please set the location on the map or use GPS.'
    if (!isLocationInServiceArea(location.lat, location.lng)) {
      return SERVICE_AREA_MESSAGE
    }
    if (!description.trim()) return 'Please add a short description.'
    if (description.trim().length > MAX_CHARS) {
      return `Description must be under ${MAX_CHARS} characters.`
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setFormError(err)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      // 1. Upload photo (client-side compressed)
      const { url: photoUrl, error: uploadErr } = await uploadPhoto(photoFile)
      if (uploadErr) throw new Error('Photo upload failed: ' + uploadErr.message)

      // 2. Create report with detected city
      const { data, error: createErr } = await createReport({
        description: description.trim(),
        photo_url: photoUrl,
        latitude: location.lat,
        longitude: location.lng,
        city: detectedCity,
        reported_severity: severity,
      })
      if (createErr) throw new Error('Report creation failed: ' + createErr.message)

      setSuccessReport(data)
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(successReport.report_code)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (successReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-950/60 rounded-full flex items-center justify-center mb-5 shadow-sm border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-black text-navy-900 dark:text-white mb-2">Report Submitted!</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
          Thank you for reporting. Your submission has been logged for municipal road inspection in {successReport.city || 'Punjab'}.
        </p>

        <div className="bg-navy-900 dark:bg-navy-950 rounded-3xl p-6 w-full max-w-xs mb-6 shadow-xl border border-navy-800">
          <p className="text-xs text-white/50 mb-1 uppercase tracking-widest font-semibold">
            Unique Report ID
          </p>
          <p className="text-3xl font-black text-white font-mono tracking-wider mb-3">
            {successReport.report_code}
          </p>
          <Button
            variant="teal"
            size="sm"
            className="w-full font-bold"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied to Clipboard!' : 'Copy Report ID'}
          </Button>
        </div>

        <div className="flex gap-3 w-full max-w-xs flex-col sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => navigate(`/track/${successReport.report_code}`)}
          >
            Track Live Progress
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setSuccessReport(null)
              setPhotoFile(null)
              setPhotoPreview('')
              setDescription('')
              setSeverity('medium')
              setLocation(null)
              setFormError('')
            }}
          >
            Report Another
          </Button>
        </div>
      </div>
    )
  }

  // ── Report Form ─────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-xl bg-white dark:bg-navy-800 shadow-card flex items-center justify-center text-gray-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white transition-colors border border-gray-100 dark:border-navy-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-navy-900 dark:text-white">Report a Pothole</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Dedicated service area: Ludhiana & Amritsar
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo Upload */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-gray-100 dark:border-navy-700 transition-colors">
          <label className="block text-sm font-bold text-navy-900 dark:text-white mb-3">
            Photo of Pothole <span className="text-red-500">*</span>
          </label>
          <PhotoUploader
            onPhotoSelect={handlePhotoSelect}
            preview={photoPreview}
            onClear={handlePhotoClear}
          />
        </div>

        {/* Severity Selector */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-gray-100 dark:border-navy-700 transition-colors">
          <label className="block text-sm font-bold text-navy-900 dark:text-white mb-1">
            Pothole Severity <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Estimate road damage to assist repair prioritization
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  severity === s.value
                    ? 'border-brand-blue bg-blue-50/80 dark:bg-blue-950/60 text-brand-blue dark:text-blue-300 shadow-sm ring-2 ring-brand-blue/20 font-bold'
                    : 'border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900/40 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-navy-700/50'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wider">{s.label}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1 mt-0.5">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Location Picker with GPS & Service Area Enforcement */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-gray-100 dark:border-navy-700 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <label className="block text-sm font-bold text-navy-900 dark:text-white">
                Location <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Use GPS or drag the pin to the pothole spot
              </p>
            </div>

            {/* Quick city presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-400">Quick Pin:</span>
              <button
                type="button"
                onClick={() => selectCityPreset('ludhiana')}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-navy-50 dark:bg-navy-900 text-navy-900 dark:text-white hover:bg-navy-100 dark:hover:bg-navy-700 transition"
              >
                📍 Ludhiana
              </button>
              <button
                type="button"
                onClick={() => selectCityPreset('amritsar')}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-navy-50 dark:bg-navy-900 text-navy-900 dark:text-white hover:bg-navy-100 dark:hover:bg-navy-700 transition"
              >
                📍 Amritsar
              </button>
            </div>
          </div>

          {/* GPS Locate Button */}
          <div className="mb-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGpsClick}
              loading={geoLoading}
              disabled={geoLoading}
              className="w-full sm:w-auto"
            >
              <Crosshair className="h-4 w-4" />
              {geoLoading ? 'Acquiring GPS Fix…' : 'Use My Current Location'}
            </Button>
          </div>

          {/* GPS error feedback */}
          {geoError && (
            <div className="mb-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{geoError}</p>
            </div>
          )}

          {/* Service Area Bounding Box Warning if outside */}
          {location && !isWithinServiceArea && (
            <div className="mb-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800 dark:text-red-300">
                  Location Outside Service Area
                </p>
                <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                  {SERVICE_AREA_MESSAGE} Please reposition the pin inside one of these cities.
                </p>
              </div>
            </div>
          )}

          <LocationPicker
            location={location}
            onLocationChange={handleLocationChange}
            isServiceAreaValid={isWithinServiceArea}
          />

          {location && (
            <div className="mt-2.5 flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800">
              <div className="flex items-center gap-1.5 font-semibold text-navy-900 dark:text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-brand-teal flex-shrink-0" />
                <span>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              </div>
              <span className={`text-[11px] font-bold ${
                isWithinServiceArea ? 'text-brand-teal' : 'text-red-500'
              }`}>
                {detectedCity ? `City: ${detectedCity} ✓` : 'Outside Ludhiana / Amritsar'}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-gray-100 dark:border-navy-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-navy-900 dark:text-white">
              Short Description <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs font-medium ${
                description.length > MAX_CHARS
                  ? 'text-red-500 font-bold'
                  : 'text-gray-400 dark:text-slate-500'
              }`}
            >
              {description.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe road name, landmark, nearby hospital or school, and any hazard…"
            rows={4}
            maxLength={MAX_CHARS + 20}
            className="w-full text-sm border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900/60 text-navy-900 dark:text-white rounded-2xl px-3.5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition placeholder-gray-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Form Validation Error message */}
        {formError && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{formError}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="xl"
          className="w-full font-bold shadow-md"
          loading={submitting}
          disabled={submitting || (location && !isWithinServiceArea)}
        >
          <Send className="h-5 w-5" />
          {submitting ? 'Submitting to Municipal Portal…' : 'Submit Pothole Report'}
        </Button>
      </form>
    </div>
  )
}
