import { useState, useCallback } from 'react'

/**
 * useGeolocation Hook
 *
 * ROOT CAUSE of the old "Use my current location does nothing" bug:
 * 1. The coordinates were only fed to Leaflet's initial `center`/marker props.
 *    `MapContainer` treats those as initial-only, so state changed but the map
 *    never panned and the marker never moved.
 * 2. No `enableHighAccuracy` option made desktop/Wi-Fi positioning stall, and
 *    `maximumAge` could return a stale cached fix.
 * 3. Error code 3 (TIMEOUT) was not surfaced, so the UI had no fallback message.
 *
 * The fix keeps geolocation state in this hook, feeds the same state to the
 * form and LocationPicker, and uses a `useMap()` controller (flyTo + setLatLng)
 * so Leaflet reacts to every new reading.
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback((onSuccess = null) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please pin location manually.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
          setLocation(coords)
          if (typeof onSuccess === 'function') {
            onSuccess(coords)
          }
          setLoading(false)
        },
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED: // code 1
              setError('Location permission denied. Please allow location access or select a location manually.')
              break
            case err.POSITION_UNAVAILABLE: // code 2
              setError('Location unavailable. GPS could not determine your coordinates. Please drag the pin on the map.')
              break
            case err.TIMEOUT: // code 3
              setError('Location request timed out. Please tap the map or use the city buttons to position the pin.')
              break
            default:
              setError(err.message || 'Could not determine location. Please pin manually on the map.')
              break
          }
          setLoading(false)
        },
        {
          enableHighAccuracy: true, // Required for GPS / high accuracy fix
          timeout: 10000, // 10s timeout
          maximumAge: 0, // Do not use cached location; fresh reading
        }
      )
    } catch {
      setError('Could not start location lookup. Please pin the location manually on the map.')
      setLoading(false)
    }
  }, [])

  return { location, error, loading, requestLocation, setLocation, setError }
}
