// Core constants for NearFix

// ============================================================
// Service Areas (Single Source of Truth: Ludhiana & Amritsar)
// Roughly 25 km bounding box around each center
// ============================================================
export const SERVICE_AREAS = {
  ludhiana: {
    id: 'ludhiana',
    name: 'Ludhiana',
    state: 'Punjab',
    center: [30.9010, 75.8573],
    lat: 30.9010,
    lng: 75.8573,
    zoom: 13,
    // ~25km box: lat ±0.23°, lng ±0.27°
    bounds: [
      [30.6710, 75.5873], // South-West
      [31.1310, 76.1273], // North-East
    ],
    tagline: 'Municipal Corporation Ludhiana',
  },
  amritsar: {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    center: [31.6340, 74.8723],
    lat: 31.6340,
    lng: 74.8723,
    zoom: 13,
    // ~25km box: lat ±0.23°, lng ±0.27°
    bounds: [
      [31.4040, 74.6023], // South-West
      [31.8640, 75.1423], // North-East
    ],
    tagline: 'Municipal Corporation Amritsar',
  },
  // Tight enclosing rectangle of both city boxes (the union of two boxes
  // is not a rectangle, so Leaflet maxBounds uses this envelope).
  unionBounds: [
    [30.6710, 74.6023], // South-West
    [31.8640, 76.1273], // North-East
  ],
}

export const CITIES = {
  ludhiana: SERVICE_AREAS.ludhiana,
  amritsar: SERVICE_AREAS.amritsar,
}
export const DEFAULT_CITY = SERVICE_AREAS.ludhiana
export const DEFAULT_LAT = DEFAULT_CITY.lat
export const DEFAULT_LNG = DEFAULT_CITY.lng
export const SERVICE_AREA_MESSAGE =
  'NearFix currently covers Ludhiana and Amritsar only.'

/**
 * Validates if coordinates fall inside Ludhiana or Amritsar service area.
 * Returns 'Ludhiana' | 'Amritsar' | null
 */
export function getCityForLocation(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null

  // Check Ludhiana bounds
  const [lSw, lNe] = SERVICE_AREAS.ludhiana.bounds
  if (lat >= lSw[0] && lat <= lNe[0] && lng >= lSw[1] && lng <= lNe[1]) {
    return 'Ludhiana'
  }

  // Check Amritsar bounds
  const [aSw, aNe] = SERVICE_AREAS.amritsar.bounds
  if (lat >= aSw[0] && lat <= aNe[0] && lng >= aSw[1] && lng <= aNe[1]) {
    return 'Amritsar'
  }

  return null
}

/**
 * Checks if location is within service area, with dev-only bypass
 */
export function isLocationInServiceArea(lat, lng) {
  // Dev-only flag to allow any location during testing
  if (import.meta.env.VITE_ALLOW_ANY_LOCATION === 'true') {
    return true
  }
  return getCityForLocation(lat, lng) !== null
}

// ============================================================
// Status definitions & Shared Marker Colors
// Rule: Red is NEVER used for status markers. Red is reserved
// only for high-priority badges.
// Markers: submitted = Blue, verified = Teal, assigned/in_progress = Amber,
// repaired = Green, rejected = Grey. Fallback = neutral grey.
// ============================================================
export const STATUSES = {
  submitted: {
    value: 'submitted',
    label: 'Submitted',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    markerColor: '#2563EB', // Blue
    order: 1,
    description: 'Report received and logged',
  },
  verified: {
    value: 'verified',
    label: 'Verified',
    badgeClass: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    markerColor: '#14B8A6', // Teal
    order: 2,
    description: 'Pothole verified by local municipal authority',
  },
  assigned: {
    value: 'assigned',
    label: 'Assigned',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    markerColor: '#F59E0B', // Amber
    order: 3,
    description: 'Maintenance team and equipment assigned',
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    markerColor: '#F59E0B', // Amber
    order: 4,
    description: 'Repair work actively underway',
  },
  repaired: {
    value: 'repaired',
    label: 'Repaired',
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
    markerColor: '#22C55E', // Green
    order: 5,
    description: 'Pothole fixed and verified',
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    markerColor: '#6B7280', // Grey
    order: 6,
    description: 'Report rejected by authority',
  },
}

export const DEFAULT_MARKER_COLOR = '#6B7280' // Neutral grey fallback

export const STATUS_LIST = Object.values(STATUSES).sort((a, b) => a.order - b.order)

// Marker colours are derived from status only. Assigned and in-progress share
// amber, so the map legend groups them into one row.
export const MAP_STATUS_LEGEND = [
  { key: 'submitted', label: STATUSES.submitted.label, color: STATUSES.submitted.markerColor },
  { key: 'verified', label: STATUSES.verified.label, color: STATUSES.verified.markerColor },
  {
    key: 'in_progress',
    label: 'Assigned / In Progress',
    color: STATUSES.in_progress.markerColor,
  },
  { key: 'repaired', label: STATUSES.repaired.label, color: STATUSES.repaired.markerColor },
  { key: 'rejected', label: STATUSES.rejected.label, color: STATUSES.rejected.markerColor },
]

// Allowed status transitions (enforced in both DB trigger and UI)
export const ALLOWED_TRANSITIONS = {
  submitted: ['verified', 'rejected'],
  verified: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['repaired'],
  rejected: ['submitted'], // Reopen
  repaired: [],
}

// Stepper workflow for Citizen tracking
export const CITIZEN_STATUS_STEPS = [
  { key: 'submitted', label: 'Report Submitted', description: 'Your report has been received and queued.' },
  { key: 'verified', label: 'Verified', description: 'Municipal team has inspected and verified the pothole.' },
  { key: 'assigned', label: 'Assigned to Crew', description: 'Repair crew has been dispatched.' },
  { key: 'in_progress', label: 'Repair in Progress', description: 'Asphalt & roadwork in progress.' },
  { key: 'repaired', label: 'Repaired & Closed', description: 'Pothole fixed and verified with photographic proof.' },
]

export const PRIORITIES = {
  low: {
    value: 'low',
    label: 'Low',
    badgeClass: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
    color: '#22C55E',
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    color: '#F59E0B',
  },
  high: {
    value: 'high',
    label: 'High',
    badgeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
    color: '#EF4444', // Red reserved only for high priority
  },
}

export const SEVERITIES = [
  { value: 'low', label: 'Low', description: 'Minor bump / surface cracking' },
  { value: 'medium', label: 'Medium', description: 'Noticeable dip / slows traffic' },
  { value: 'high', label: 'High', description: 'Deep crater / severe hazard' },
]

export const TRAFFIC_LEVELS = [
  { value: 'low', label: 'Low Traffic' },
  { value: 'medium', label: 'Medium Traffic' },
  { value: 'high', label: 'High Traffic / Arterial' },
]

export const SENSITIVE_LOCATIONS = [
  'School / College',
  'Hospital / Clinic',
  'Bus Stand',
  'Railway Station',
  'Market / Commercial Area',
  'Religious Place',
  'Pedestrian Crossing',
  'Other Sensitive Area',
]

// Priority calculation weights
export const PRIORITY_WEIGHTS = {
  severity: {
    low: 1,
    medium: 2,
    high: 3,
  },
  sensitiveLocation: 2,
  trafficLevel: {
    low: 0,
    medium: 1,
    high: 2,
  },
  age: {
    over7Days: 1,
    over14Days: 2,
  },
  thresholds: {
    high: 6,
    medium: 3,
  },
}
