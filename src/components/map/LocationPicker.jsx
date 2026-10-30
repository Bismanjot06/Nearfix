import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_LAT, DEFAULT_LNG, SERVICE_AREAS } from '../../lib/constants.js'

// Custom draggable pin marker using NearFix Blue
function createPinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 32px;
      height: 32px;
      background: rgb(var(--brand-blue));
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

// Controller that ensures the Leaflet map pans and animates to coordinates
// ROOT CAUSE FIX: In React-Leaflet, MapContainer `center` is an initial prop only.
// This controller dynamically calls `map.flyTo` whenever new coordinates arrive.
function MapController({ location, center, zoom, bounds }) {
  const map = useMap()

  useEffect(() => {
    if (bounds) map.setMaxBounds(bounds)
  }, [bounds, map])

  useEffect(() => {
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 1.0,
      })
      map.invalidateSize()
    }
  }, [location?.lat, location?.lng, map])

  useEffect(() => {
    if (!location && center && center[0] && center[1]) {
      map.setView(center, zoom || 14)
      map.invalidateSize()
    }
  }, [center, zoom, location, map])

  return null
}

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null)

  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  // Sync marker position when location changes externally (e.g. from GPS or preset buttons)
  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng([position.lat, position.lng])
    }
  }, [position?.lat, position?.lng])

  if (!position) return null

  return (
    <Marker
      draggable
      position={[position.lat, position.lng]}
      icon={createPinIcon()}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current
          if (marker) {
            const { lat, lng } = marker.getLatLng()
            onPositionChange({ lat, lng })
          }
        },
      }}
    />
  )
}

export function LocationPicker({
  location,
  onLocationChange,
  centerPreset = null,
  isServiceAreaValid = true,
}) {
  const initialCenter = centerPreset || (location ? [location.lat, location.lng] : [DEFAULT_LAT, DEFAULT_LNG])

  // Keep panning inside the two service areas. When a GPS fix lands outside
  // (allowed by the dev flag), temporarily include that point so the pin is
  // still visible instead of being clamped off-screen.
  const mapBounds = useMemo(() => {
    const [[south, west], [north, east]] = SERVICE_AREAS.unionBounds
    if (!location || isServiceAreaValid) return SERVICE_AREAS.unionBounds
    const pad = 0.05
    return [
      [Math.min(south, location.lat - pad), Math.min(west, location.lng - pad)],
      [Math.max(north, location.lat + pad), Math.max(east, location.lng + pad)],
    ]
  }, [location?.lat, location?.lng, isServiceAreaValid])

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-navy-700 shadow-sm transition-colors">
      <div className={`px-3 py-2 text-xs font-medium flex items-center justify-between border-b ${
        !isServiceAreaValid && location
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/50'
          : 'bg-navy-50 dark:bg-navy-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-navy-800'
      }`}>
        <span>
          {location
            ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} — drag pin to adjust spot`
            : '👇 Tap on the map to place the pothole pin'}
        </span>
      </div>

      <MapContainer
        center={initialCenter}
        zoom={14}
        maxBounds={mapBounds}
        maxBoundsViscosity={1.0}
        minZoom={9}
        style={{ height: '240px', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={location} onPositionChange={onLocationChange} />
        <MapController location={location} center={centerPreset} zoom={14} bounds={mapBounds} />
      </MapContainer>
    </div>
  )
}
