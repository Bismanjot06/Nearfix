// Demo adapter — stores reports and history in localStorage with realistic Ludhiana & Amritsar data.
// Exposes the exact same function signatures as the Supabase adapter.

import { generateReportCode } from '../lib/utils.js'
import { calculatePriority } from '../lib/priority.js'
import {
  SERVICE_AREA_MESSAGE,
  getCityForLocation,
  isLocationInServiceArea,
} from '../lib/constants.js'

const STORAGE_KEY = 'nearfix_demo_reports_v2'
const HISTORY_STORAGE_KEY = 'nearfix_demo_history_v2'

// Seed reports for Ludhiana and Amritsar
const SEED_REPORTS = [
  // ── LUDHIANA REPORTS ──
  {
    id: '11111111-0000-0000-0000-000000000001',
    report_code: 'NF-2610-LDH01',
    description: 'Deep crater on Ferozepur Road near Bharat Nagar Chowk causing traffic jams and vehicle damage.',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    latitude: 30.9026,
    longitude: 75.8360,
    address: 'Ferozepur Road, Bharat Nagar Chowk, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'high',
    traffic_level: 'high',
    near_sensitive_location: 'Civil Lines Bus Stand',
    priority: 'high',
    priority_score: 7,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Civil Lines Bus Stand" (+2)',
      'Traffic level: High (+2)',
      'Open for 2 days (+0)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'submitted',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_at: null,
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    report_code: 'NF-2610-LDH02',
    description: 'Pothole right outside Sacred Heart School gate, dangerous for school buses and cyclists.',
    photo_url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600',
    latitude: 30.8878,
    longitude: 75.8078,
    address: 'BRS Nagar near Sacred Heart School, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'high',
    traffic_level: 'medium',
    near_sensitive_location: 'Sacred Heart Senior Secondary School',
    priority: 'high',
    priority_score: 6,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Sacred Heart Senior Secondary School" (+2)',
      'Traffic level: Medium (+1)',
      'Open for 5 days (+0)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'verified',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    report_code: 'NF-2610-LDH03',
    description: 'Long depression with loose gravel near Model Town Gol Market intersection.',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
    latitude: 30.8845,
    longitude: 75.8412,
    address: 'Model Town Gol Market, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'medium',
    traffic_level: 'medium',
    near_sensitive_location: 'Model Town Market',
    priority: 'medium',
    priority_score: 5,
    priority_reasons: [
      'Reported severity: Medium (+2)',
      'Near sensitive location: "Model Town Market" (+2)',
      'Traffic level: Medium (+1)',
      'Open for 9 days (over 7 days: +1)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'assigned',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    report_code: 'NF-2610-LDH04',
    description: 'Cracked asphalt patch on Gill Road near Canal Bridge.',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    latitude: 30.8710,
    longitude: 75.8600,
    address: 'Gill Road near Canal Bridge, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'medium',
    traffic_level: 'high',
    near_sensitive_location: null,
    priority: 'high',
    priority_score: 6,
    priority_reasons: [
      'Reported severity: Medium (+2)',
      'No sensitive location recorded (+0)',
      'Traffic level: High (+2)',
      'Open for 16 days (over 14 days: +2)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'in_progress',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    report_code: 'NF-2610-LDH05',
    description: 'Pothole on Clock Tower road was completely refilled with hot mix asphalt.',
    photo_url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600',
    latitude: 30.9125,
    longitude: 75.8542,
    address: 'Old GT Road near Clock Tower, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'high',
    traffic_level: 'high',
    near_sensitive_location: 'Railway Station',
    priority: 'high',
    priority_score: 7,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Railway Station" (+2)',
      'Traffic level: High (+2)',
      'Report is repaired (age bonus inactive)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'repaired',
    repair_photo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
    closure_note: 'Filled with cold asphalt bitumen mix, roller-compacted and tested.',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    resolved_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000006',
    report_code: 'NF-2610-LDH06',
    description: 'Private parking gravel reported as municipal pothole.',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
    latitude: 30.9050,
    longitude: 75.8300,
    address: 'Ghumar Mandi Market lane, Ludhiana',
    city: 'Ludhiana',
    reported_severity: 'low',
    traffic_level: null,
    near_sensitive_location: null,
    priority: 'low',
    priority_score: 1,
    priority_reasons: [
      'Reported severity: Low (+1)',
      'No sensitive location recorded (+0)',
      'Traffic data not available, not counted (+0)',
      'Report is rejected (age bonus inactive)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'rejected',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: 'Location belongs to private commercial complex parking; not maintained by Municipal Corporation.',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    verified_at: null,
    resolved_at: null,
  },

  // ── AMRITSAR REPORTS ──
  {
    id: '11111111-0000-0000-0000-000000000007',
    report_code: 'NF-2610-ASR01',
    description: 'Dangerous pothole on Mall Road near Company Bagh entrance.',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    latitude: 31.6395,
    longitude: 74.8732,
    address: 'Mall Road, near Company Bagh, Amritsar',
    city: 'Amritsar',
    reported_severity: 'high',
    traffic_level: 'high',
    near_sensitive_location: 'Company Bagh Public Park',
    priority: 'high',
    priority_score: 7,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Company Bagh Public Park" (+2)',
      'Traffic level: High (+2)',
      'Open for 3 days (+0)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'submitted',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_at: null,
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000008',
    report_code: 'NF-2610-ASR02',
    description: 'Pothole on GT Road outside Amritsar Junction Railway Station causing auto-rickshaws to swerve.',
    photo_url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600',
    latitude: 31.6335,
    longitude: 74.8655,
    address: 'GT Road, outside Railway Station, Amritsar',
    city: 'Amritsar',
    reported_severity: 'high',
    traffic_level: 'high',
    near_sensitive_location: 'Railway Station',
    priority: 'high',
    priority_score: 7,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Railway Station" (+2)',
      'Traffic level: High (+2)',
      'Open for 6 days (+0)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'verified',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000009',
    report_code: 'NF-2610-ASR03',
    description: 'Sunken road section on Majitha Road near Guru Nanak Dev Hospital ambulance bay.',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
    latitude: 31.6560,
    longitude: 74.8850,
    address: 'Majitha Road near GND Hospital, Amritsar',
    city: 'Amritsar',
    reported_severity: 'high',
    traffic_level: 'high',
    near_sensitive_location: 'Guru Nanak Dev Hospital',
    priority: 'high',
    priority_score: 8,
    priority_reasons: [
      'Reported severity: High (+3)',
      'Near sensitive location: "Guru Nanak Dev Hospital" (+2)',
      'Traffic level: High (+2)',
      'Open for 10 days (over 7 days: +1)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'assigned',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000010',
    report_code: 'NF-2610-ASR04',
    description: 'Pothole on Ranjit Avenue B-Block main road undergoing asphalt leveling.',
    photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    latitude: 31.6520,
    longitude: 74.8560,
    address: 'Ranjit Avenue B-Block, Amritsar',
    city: 'Amritsar',
    reported_severity: 'medium',
    traffic_level: 'medium',
    near_sensitive_location: null,
    priority: 'medium',
    priority_score: 4,
    priority_reasons: [
      'Reported severity: Medium (+2)',
      'No sensitive location recorded (+0)',
      'Traffic level: Medium (+1)',
      'Open for 8 days (over 7 days: +1)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'in_progress',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    resolved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000011',
    report_code: 'NF-2610-ASR05',
    description: 'Pothole on Circular Road near Hall Gate successfully repaired.',
    photo_url: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=600',
    latitude: 31.6310,
    longitude: 74.8780,
    address: 'Circular Road, near Hall Gate, Amritsar',
    city: 'Amritsar',
    reported_severity: 'medium',
    traffic_level: 'high',
    near_sensitive_location: 'Hall Gate Market',
    priority: 'high',
    priority_score: 6,
    priority_reasons: [
      'Reported severity: Medium (+2)',
      'Near sensitive location: "Hall Gate Market" (+2)',
      'Traffic level: High (+2)',
      'Report is repaired (age bonus inactive)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'repaired',
    repair_photo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600',
    closure_note: 'Base gravel layered and asphalt hot mix pressed flat. Road fully reopened.',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    resolved_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000012',
    report_code: 'NF-2610-ASR06',
    description: 'Reported pothole is actually a planned storm water drain trench under active construction.',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
    latitude: 31.6410,
    longitude: 74.8770,
    address: 'Lawrence Road, Amritsar',
    city: 'Amritsar',
    reported_severity: 'low',
    traffic_level: 'medium',
    near_sensitive_location: null,
    priority: 'low',
    priority_score: 2,
    priority_reasons: [
      'Reported severity: Low (+1)',
      'No sensitive location recorded (+0)',
      'Traffic level: Medium (+1)',
      'Report is rejected (age bonus inactive)'
    ],
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'rejected',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: 'Approved Smart City drainage pipe trench project. Temporary barricades installed.',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    verified_at: null,
    resolved_at: null,
  },
]

function generateInitialHistory(reports) {
  const map = {}
  reports.forEach((r) => {
    const list = [
      {
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: null,
        new_status: 'submitted',
        changed_by: null,
        note: 'Report submitted by citizen',
        created_at: r.created_at,
      },
    ]

    if (r.status === 'verified' || r.status === 'assigned' || r.status === 'in_progress' || r.status === 'repaired') {
      list.push({
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: 'submitted',
        new_status: 'verified',
        changed_by: 'demo-authority-id',
        note: 'Pothole inspected and verified by municipal officer',
        created_at: r.verified_at || r.updated_at,
      })
    }
    if (r.status === 'assigned' || r.status === 'in_progress' || r.status === 'repaired') {
      list.push({
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: 'verified',
        new_status: 'assigned',
        changed_by: 'demo-authority-id',
        note: 'Assigned to Municipal Ward Road Repair Crew',
        created_at: new Date(new Date(r.verified_at || r.created_at).getTime() + 86400000).toISOString(),
      })
    }
    if (r.status === 'in_progress' || r.status === 'repaired') {
      list.push({
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: 'assigned',
        new_status: 'in_progress',
        changed_by: 'demo-authority-id',
        note: 'Asphalt cold mix and compaction roller deployed on site',
        created_at: new Date(new Date(r.verified_at || r.created_at).getTime() + 86400000 * 2).toISOString(),
      })
    }
    if (r.status === 'repaired') {
      list.push({
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: 'in_progress',
        new_status: 'repaired',
        changed_by: 'demo-authority-id',
        note: r.closure_note || 'Pothole repaired and verified',
        created_at: r.resolved_at || r.updated_at,
      })
    }
    if (r.status === 'rejected') {
      list.push({
        id: crypto.randomUUID(),
        report_id: r.id,
        old_status: 'submitted',
        new_status: 'rejected',
        changed_by: 'demo-authority-id',
        note: r.rejection_reason || 'Report rejected by authority',
        created_at: r.updated_at,
      })
    }
    map[r.id] = list
  })
  return map
}

function loadReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const ids = new Set(parsed.map((r) => r.id))
      const missingSeeds = SEED_REPORTS.filter((s) => !ids.has(s.id))
      return [...parsed, ...missingSeeds]
    }
  } catch {
    // fallback
  }
  return [...SEED_REPORTS]
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch {
    // ignore
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  const initial = generateInitialHistory(SEED_REPORTS)
  saveHistory(initial)
  return initial
}

function saveHistory(historyMap) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyMap))
  } catch {
    // ignore
  }
}

function addHistoryEntry(reportId, entry) {
  const allHistory = loadHistory()
  const list = allHistory[reportId] || []
  const newEntry = {
    id: crypto.randomUUID(),
    report_id: reportId,
    created_at: new Date().toISOString(),
    ...entry,
  }
  allHistory[reportId] = [...list, newEntry]
  saveHistory(allHistory)
  return newEntry
}

// ── Public Service Functions (mirror Supabase API) ──

export async function getReports(filters = {}) {
  let reports = loadReports()

  // Recalculate dynamic age score if priority not overridden and report still open
  reports = reports.map((r) => {
    if (!r.priority_overridden && r.status !== 'repaired' && r.status !== 'rejected') {
      const calculated = calculatePriority({
        reported_severity: r.reported_severity,
        near_sensitive_location: r.near_sensitive_location,
        traffic_level: r.traffic_level,
        created_at: r.created_at,
        status: r.status,
      })
      return {
        ...r,
        priority: calculated.priority,
        priority_score: calculated.score,
        priority_reasons: calculated.reasons,
      }
    }
    return r
  })

  // City filter
  if (filters.city && filters.city !== 'all') {
    reports = reports.filter((r) => r.city?.toLowerCase() === filters.city.toLowerCase())
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    reports = reports.filter((r) => r.status === filters.status)
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    reports = reports.filter((r) => r.priority === filters.priority)
  }

  // Search filter (by code or description or address)
  if (filters.search?.trim()) {
    const query = filters.search.trim().toLowerCase()
    reports = reports.filter(
      (r) =>
        r.report_code.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        (r.address && r.address.toLowerCase().includes(query))
    )
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = Date.now()
    const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 0
    if (days > 0) {
      const cutoff = now - days * 86400000
      reports = reports.filter((r) => new Date(r.created_at).getTime() >= cutoff)
    }
  }

  // Sort newest first
  reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return { data: reports, count: reports.length, error: null }
}

export async function getAuthorityReports(filters = {}) {
  const { page = 1, limit = 20, ...restFilters } = filters
  const { data: all, count, error } = await getReports(restFilters)
  if (error) return { data: [], count: 0, error }

  const start = (page - 1) * limit
  const paginated = all.slice(start, start + limit)

  return { data: paginated, count, totalPages: Math.ceil(count / limit), error: null }
}

export async function getReportByCode(code) {
  const reports = loadReports()
  const normalized = code.trim().toUpperCase()
  const report = reports.find((r) => r.report_code === normalized) || null
  return { data: report, error: null }
}

export async function getReportById(id) {
  const reports = loadReports()
  const report = reports.find((r) => r.id === id) || null
  return { data: report, error: null }
}

export async function getReportHistory(reportId) {
  const historyMap = loadHistory()
  const list = historyMap[reportId] || []
  list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return { data: list, error: null }
}

export async function getDashboardStats() {
  const reports = loadReports()

  const total = reports.length
  const submitted = reports.filter((r) => r.status === 'submitted').length
  const highPriority = reports.filter(
    (r) => r.priority === 'high' && r.status !== 'repaired' && r.status !== 'rejected'
  ).length
  const inProgress = reports.filter((r) => r.status === 'in_progress').length
  const repaired = reports.filter((r) => r.status === 'repaired').length

  return {
    data: {
      total,
      submitted,
      highPriority,
      inProgress,
      repaired,
    },
    error: null,
  }
}

export async function uploadPhoto(file) {
  const url = URL.createObjectURL(file)
  return { url, error: null }
}

export async function uploadRepairPhoto(file) {
  const url = URL.createObjectURL(file)
  return { url, error: null }
}

export async function createReport(reportData) {
  if (!isLocationInServiceArea(reportData.latitude, reportData.longitude)) {
    return { data: null, error: { message: SERVICE_AREA_MESSAGE } }
  }

  const reports = loadReports()

  const severity = reportData.reported_severity || 'medium'
  const calculated = calculatePriority({
    reported_severity: severity,
    near_sensitive_location: null,
    traffic_level: null,
    created_at: new Date().toISOString(),
    status: 'submitted',
  })

  // Detect city from coordinates using bounding boxes
  const city =
    reportData.city ||
    getCityForLocation(reportData.latitude, reportData.longitude) ||
    null

  const newReport = {
    id: crypto.randomUUID(),
    report_code: generateReportCode(),
    description: reportData.description,
    photo_url: reportData.photo_url,
    latitude: reportData.latitude,
    longitude: reportData.longitude,
    address: reportData.address || (city ? `${city}, Punjab` : null),
    city,
    reported_severity: severity,
    traffic_level: null,
    near_sensitive_location: null,
    priority: calculated.priority,
    priority_score: calculated.score,
    priority_reasons: calculated.reasons,
    priority_overridden: false,
    override_reason: null,
    overridden_by: null,
    status: 'submitted',
    repair_photo_url: null,
    closure_note: null,
    rejection_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    verified_at: null,
    resolved_at: null,
  }

  const updatedReports = [newReport, ...reports]
  saveReports(updatedReports)

  // Write initial history row
  addHistoryEntry(newReport.id, {
    old_status: null,
    new_status: 'submitted',
    changed_by: null,
    note: 'Report submitted by citizen',
  })

  return { data: newReport, error: null }
}

export async function updateReportStatus({
  reportId,
  newStatus,
  note = null,
  closureNote = null,
  repairPhotoUrl = null,
  rejectionReason = null,
}) {
  const reports = loadReports()
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx === -1) return { data: null, error: { message: 'Report not found' } }

  const current = reports[idx]
  const oldStatus = current.status

  // Validate transitions
  const allowed = {
    submitted: ['verified', 'rejected'],
    verified: ['assigned'],
    assigned: ['in_progress'],
    in_progress: ['repaired'],
    rejected: ['submitted'],
  }[oldStatus] || []

  if (!allowed.includes(newStatus)) {
    return {
      data: null,
      error: { message: `Cannot change status from ${oldStatus} to ${newStatus}` },
    }
  }

  if (newStatus === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return { data: null, error: { message: 'Rejection reason is required' } }
  }

  const now = new Date().toISOString()
  const updated = {
    ...current,
    status: newStatus,
    updated_at: now,
  }

  if (newStatus === 'verified') updated.verified_at = now
  if (newStatus === 'repaired') {
    updated.resolved_at = now
    if (closureNote) updated.closure_note = closureNote
    if (repairPhotoUrl) updated.repair_photo_url = repairPhotoUrl
  }
  if (newStatus === 'rejected') {
    updated.rejection_reason = rejectionReason
  }

  reports[idx] = updated
  saveReports(reports)

  // Add history entry
  let historyNote = note
  if (!historyNote) {
    if (newStatus === 'rejected') historyNote = rejectionReason
    else if (newStatus === 'repaired') historyNote = closureNote || 'Pothole repaired and closed'
    else if (newStatus === 'submitted' && oldStatus === 'rejected') historyNote = 'Report reopened by authority'
    else historyNote = `Status updated to ${newStatus}`
  }

  addHistoryEntry(reportId, {
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: 'demo-authority-id',
    note: historyNote,
  })

  return { data: updated, error: null }
}

export async function updateReportAuthorityFields({
  reportId,
  trafficLevel,
  nearSensitiveLocation,
}) {
  const reports = loadReports()
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx === -1) return { data: null, error: { message: 'Report not found' } }

  const current = reports[idx]
  const updated = {
    ...current,
    traffic_level: trafficLevel || null,
    near_sensitive_location: nearSensitiveLocation || null,
    updated_at: new Date().toISOString(),
  }

  // Recalculate priority if not manually overridden
  if (!updated.priority_overridden) {
    const calc = calculatePriority({
      reported_severity: updated.reported_severity,
      near_sensitive_location: updated.near_sensitive_location,
      traffic_level: updated.traffic_level,
      created_at: updated.created_at,
      status: updated.status,
    })
    const prevPriority = updated.priority
    updated.priority = calc.priority
    updated.priority_score = calc.score
    updated.priority_reasons = calc.reasons

    if (prevPriority !== updated.priority) {
      addHistoryEntry(reportId, {
        old_status: updated.status,
        new_status: updated.status,
        changed_by: 'demo-authority-id',
        note: `Rule-based priority recalculated from ${prevPriority} to ${updated.priority}`,
      })
    }
  }

  reports[idx] = updated
  saveReports(reports)

  return { data: updated, error: null }
}

export async function setPriorityOverride({
  reportId,
  priority,
  overrideReason,
  reset = false,
}) {
  const reports = loadReports()
  const idx = reports.findIndex((r) => r.id === reportId)
  if (idx === -1) return { data: null, error: { message: 'Report not found' } }

  const current = reports[idx]
  const updated = { ...current, updated_at: new Date().toISOString() }

  if (reset) {
    // Reset to pure rule-based calculation
    const calc = calculatePriority({
      reported_severity: current.reported_severity,
      near_sensitive_location: current.near_sensitive_location,
      traffic_level: current.traffic_level,
      created_at: current.created_at,
      status: current.status,
    })
    updated.priority_overridden = false
    updated.override_reason = null
    updated.overridden_by = null
    updated.priority = calc.priority
    updated.priority_score = calc.score
    updated.priority_reasons = calc.reasons

    addHistoryEntry(reportId, {
      old_status: current.status,
      new_status: current.status,
      changed_by: 'demo-authority-id',
      note: `Priority reset to calculated value (${calc.priority})`,
    })
  } else {
    if (!overrideReason || !overrideReason.trim()) {
      return { data: null, error: { message: 'An override reason is required' } }
    }
    updated.priority_overridden = true
    updated.priority = priority
    updated.override_reason = overrideReason.trim()
    updated.overridden_by = 'demo-authority-id'

    addHistoryEntry(reportId, {
      old_status: current.status,
      new_status: current.status,
      changed_by: 'demo-authority-id',
      note: `Priority manually overridden to ${priority}: ${overrideReason.trim()}`,
    })
  }

  reports[idx] = updated
  saveReports(reports)

  return { data: updated, error: null }
}
