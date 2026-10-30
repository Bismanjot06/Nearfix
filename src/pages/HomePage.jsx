import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { ReportCard } from '../components/reports/ReportCard.jsx'
import { ReportCardSkeleton } from '../components/ui/Spinner.jsx'
import { ErrorState, EmptyState } from '../components/ui/EmptyState.jsx'
import { useReports } from '../hooks/useReports.js'
import { ReportMap } from '../components/map/ReportMap.jsx'
import { SERVICE_AREAS } from '../lib/constants.js'

export default function HomePage() {
  const navigate = useNavigate()
  // Default city is Ludhiana
  const [selectedCity, setSelectedCity] = useState('ludhiana')
  const { reports, loading, error, openCount, repairedCount, refetch } = useReports()

  // Filter reports strictly to the selected city (Ludhiana | Amritsar)
  const currentCityArea = SERVICE_AREAS[selectedCity] || SERVICE_AREAS.ludhiana
  const filteredReports = reports.filter(
    (r) => r.city?.toLowerCase() === currentCityArea.name.toLowerCase()
  )

  // Top 5 recent reports for this city
  const recentReports = filteredReports.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER ── */}
      <div className="bg-navy-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-card border border-navy-800">
        {/* Decorative blur shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-teal/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-blue/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-brand-teal rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-base font-black text-white">NF</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">NearFix</h1>
              <p className="text-xs text-brand-teal font-bold uppercase tracking-wider mt-0.5">
                Civic Pothole Reporting Platform
              </p>
            </div>
          </div>
          <p className="text-white/80 text-sm mb-6 max-w-md leading-relaxed">
            Fast, transparent road defect tracking for <strong className="text-white">Ludhiana</strong> and <strong className="text-white">Amritsar</strong>. Citizens report, municipal authorities inspect, prioritize, and publish repair proof.
          </p>
          <Button
            variant="teal"
            size="lg"
            className="w-full sm:w-auto font-black shadow-md"
            onClick={() => navigate('/report')}
          >
            <PlusCircle className="h-5 w-5" />
            Report a Pothole Now
          </Button>
        </div>
      </div>

      {/* ── METRIC STATS CARDS ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Open Reports */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-red-50 dark:border-navy-700 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/60 rounded-2xl flex items-center justify-center flex-shrink-0 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-navy-900 dark:text-white">
              {loading ? '–' : openCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Open Reports
            </p>
          </div>
        </div>

        {/* Repaired Reports */}
        <div className="bg-white dark:bg-navy-800 rounded-3xl shadow-card p-5 border border-green-50 dark:border-navy-700 flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-950/60 rounded-2xl flex items-center justify-center flex-shrink-0 text-green-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-navy-900 dark:text-white">
              {loading ? '–' : repairedCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Repaired & Closed
            </p>
          </div>
        </div>
      </div>

      {/* ── CITY MAP PREVIEW WITH SIMPLE CITY SWITCHER (LUDHIANA | AMRITSAR) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-navy-900 dark:text-white">Live Road Defect Map</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Showing active reports in <strong className="text-navy-900 dark:text-slate-200">{currentCityArea.name}</strong>
            </p>
          </div>

          {/* Simple City Switcher: Ludhiana | Amritsar (Default: Ludhiana) */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-navy-900 p-1 rounded-2xl border border-gray-200 dark:border-navy-700">
            <button
              type="button"
              onClick={() => setSelectedCity('ludhiana')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'ludhiana'
                  ? 'bg-white dark:bg-brand-blue text-navy-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              📍 Ludhiana
            </button>
            <button
              type="button"
              onClick={() => setSelectedCity('amritsar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCity === 'amritsar'
                  ? 'bg-white dark:bg-brand-blue text-navy-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              📍 Amritsar
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-navy-700 shadow-card h-56 relative">
          <ReportMap
            reports={filteredReports}
            height="100%"
            compact
            customCenter={currentCityArea.center}
            customZoom={currentCityArea.zoom}
          />
        </div>

        <div className="text-right">
          <button
            onClick={() => navigate('/map')}
            className="text-xs text-brand-blue dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            Open Full Interactive Map →
          </button>
        </div>
      </div>

      {/* ── RECENT REPORTS FOR THIS CITY ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-navy-900 dark:text-white">
            Recent {currentCityArea.name} Reports
          </h2>
          {filteredReports.length > 5 && (
            <button
              onClick={() => navigate('/map')}
              className="text-xs text-brand-blue dark:text-blue-400 font-bold hover:underline"
            >
              View all ({filteredReports.length}) →
            </button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <EmptyState
            title={`No reports in ${currentCityArea.name} yet`}
            message="Be the first citizen in your ward to report a road defect."
            action={() => navigate('/report')}
            actionLabel="Report a Pothole"
          />
        ) : (
          <div className="space-y-3">
            {recentReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
