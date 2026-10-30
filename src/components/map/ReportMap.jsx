import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { StatusBadge } from '../ui/StatusBadge.jsx'
import { PriorityBadge } from '../ui/PriorityBadge.jsx'
import {
  STATUSES,
  DEFAULT_MARKER_COLOR,
  DEFAULT_LAT,
  DEFAULT_LNG,
  SERVICE_AREAS,
} from '../../lib/constants.js'

// Create colored marker icons strictly from STATUS using shared constants.
// ROOT CAUSE of the old "new report is red" bug: marker colour was looked up
// from PRIORITIES (with a red fallback) while new reports default to high
// priority, so every fresh submission rendered red. Marker colour now comes
// from STATUSES only; the fallback is a neutral grey. Red is reserved for
// high-priority badges and is never a status marker colour.
function createMarkerIcon(status) {
  const conf = STATUSES[status] || {}
  const color = conf.markerColor || DEFAULT_MARKER_COLOR

  return L.divIcon({
    className: '',
    html: `<div style="
      width: 26px;
      height: 26px;
      background: ${color};
      border: 2.5px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 7px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  })
}

function MapUpdater({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.0 })
      map.invalidateSize()
    }
  }, [center, zoom, map])
  return null
}

export function ReportMap({
  reports = [],
  height = '100%',
  compact = false,
  customCenter = null,
  customZoom = null,
}) {
  const navigate = useNavigate()

  let center = [DEFAULT_LAT, DEFAULT_LNG]
  if (customCenter) {
    center = customCenter
  } else if (reports.length > 0) {
    center = [
      reports.reduce((s, r) => s + r.latitude, 0) / reports.length,
      reports.reduce((s, r) => s + r.longitude, 0) / reports.length,
    ]
  }

  const zoom = customZoom || (compact ? 12 : 13)

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        maxBounds={SERVICE_AREAS.unionBounds}
        maxBoundsViscosity={1.0}
        minZoom={9}
        style={{ height, width: '100%' }}
        zoomControl={!compact}
        scrollWheelZoom={!compact}
        dragging={!compact}
        doubleClickZoom={!compact}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={customCenter || (reports.length > 0 ? center : null)} zoom={zoom} />
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createMarkerIcon(report.status)}
          >
            {!compact && (
              <Popup minWidth={240} maxWidth={280}>
                <div className="font-sans text-navy-900 dark:text-slate-100">
                  {report.photo_url && (
                    <img
                      src={report.photo_url}
                      alt="Pothole"
                      className="w-full h-28 object-cover rounded-xl mb-2 border border-gray-100 dark:border-navy-700"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-mono font-bold text-brand-blue dark:text-blue-400">
                      {report.report_code}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-xs font-medium mb-1.5 line-clamp-2 text-gray-800 dark:text-slate-200">
                    {report.description}
                  </p>
                  {report.address && (
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2 truncate">
                      📍 {report.address}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-navy-700">
                    <PriorityBadge priority={report.priority} />
                    <button
                      onClick={() => navigate(`/track/${report.report_code}`)}
                      className="text-xs text-brand-blue dark:text-blue-400 font-bold hover:underline"
                    >
                      Track Progress →
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
