import { useState } from 'react'
import { MapPin, Layers } from 'lucide-react'
import { useReports } from '../hooks/useReports.js'
import { ReportMap } from '../components/map/ReportMap.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { ErrorState } from '../components/ui/EmptyState.jsx'
import { MAP_STATUS_LEGEND, SERVICE_AREAS } from '../lib/constants.js'

export default function MapPage() {
  const { reports, loading, error, openCount, repairedCount, refetch } = useReports()
  // Default to Ludhiana
  const [selectedCity, setSelectedCity] = useState('ludhiana')

  if (error) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  // Filter reports to selected city
  const currentCityArea = SERVICE_AREAS[selectedCity] || SERVICE_AREAS.ludhiana
  const filteredReports = reports.filter(
    (r) => r.city?.toLowerCase() === currentCityArea.name.toLowerCase()
  )

  const cityOpenCount = filteredReports.filter((r) =>
    ['submitted', 'verified', 'assigned', 'in_progress'].includes(r.status)
  ).length
  const cityRepairedCount = filteredReports.filter((r) => r.status === 'repaired').length

  return (
    <div className="space-y-4">
      {/* Header & Simple City Switcher: Ludhiana | Amritsar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Interactive City Map
          </h1>
          <p className="text-xs text-ink-muted">
            {loading
              ? 'Loading active reports…'
              : `${filteredReports.length} reports in ${currentCityArea.name} — ${cityOpenCount} open, ${cityRepairedCount} repaired`}
          </p>
        </div>

        {/* City Switcher (Ludhiana | Amritsar) */}
        <div className="inline-flex items-center self-start sm:self-auto bg-surface p-1 rounded-2xl border border-line shadow-sm">
          <button
            type="button"
            onClick={() => setSelectedCity('ludhiana')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'ludhiana'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            📍 Ludhiana
          </button>
          <button
            type="button"
            onClick={() => setSelectedCity('amritsar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCity === 'amritsar'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            📍 Amritsar
          </button>
        </div>
      </div>

      {/* Small Map Legend (Works in light and dark themes) */}
      <div className="bg-surface p-3 rounded-2xl border border-line shadow-sm flex flex-wrap items-center gap-x-4 gap-y-2 transition-colors">
        <span className="text-[11px] font-black uppercase tracking-wider text-ink mr-1 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-brand-teal" />
          Status Legend:
        </span>
        {MAP_STATUS_LEGEND.map((st) => (
          <div key={st.key} className="flex items-center gap-1.5 text-xs text-ink font-medium">
            <div
              className="w-3 h-3 rounded-full border border-surface shadow-sm flex-shrink-0"
              style={{ backgroundColor: st.color }}
            />
            <span>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Leaflet Map with Pan Bounds Restricted */}
      <div
        className="rounded-3xl overflow-hidden border border-line shadow-card relative"
        style={{ height: 'calc(100vh - 270px)', minHeight: '440px' }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <Spinner size="lg" />
          </div>
        )}
        <ReportMap
          reports={filteredReports}
          height="100%"
          customCenter={currentCityArea.center}
          customZoom={currentCityArea.zoom}
        />
      </div>
    </div>
  )
}
