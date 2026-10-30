// Data access layer — unified facade over Supabase and demo adapter.
// UI components import ONLY from this file; they never know which adapter is active.

import { supabase, isDemoMode } from '../lib/supabase.js'
import { generateReportCode, compressImage } from '../lib/utils.js'
import { calculatePriority } from '../lib/priority.js'
import { getCityForLocation, isLocationInServiceArea, SERVICE_AREA_MESSAGE } from '../lib/constants.js'
import * as demo from './demoData.js'

export { isDemoMode }

// ---- Photo uploads ------------------------------------------------

export async function uploadPhoto(file) {
  if (isDemoMode) return demo.uploadPhoto(file)

  const compressed = await compressImage(file)
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

  const { data, error } = await supabase.storage
    .from('report-photos')
    .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) return { url: null, error }

  const { data: publicData } = supabase.storage
    .from('report-photos')
    .getPublicUrl(data.path)

  return { url: publicData.publicUrl, error: null }
}

export async function uploadRepairPhoto(file) {
  if (isDemoMode) return demo.uploadRepairPhoto(file)

  const compressed = await compressImage(file)
  const fileName = `repair-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

  const { data, error } = await supabase.storage
    .from('repair-photos')
    .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) return { url: null, error }

  const { data: publicData } = supabase.storage
    .from('repair-photos')
    .getPublicUrl(data.path)

  return { url: publicData.publicUrl, error: null }
}

// ---- Create report -----------------------------------------------

export async function createReport(reportData) {
  if (!isLocationInServiceArea(reportData.latitude, reportData.longitude)) {
    return { data: null, error: { message: SERVICE_AREA_MESSAGE } }
  }

  if (isDemoMode) return demo.createReport(reportData)

  const report_code = generateReportCode()
  const severity = reportData.reported_severity || 'medium'
  const calculated = calculatePriority({
    reported_severity: severity,
    near_sensitive_location: null,
    traffic_level: null,
    created_at: new Date().toISOString(),
    status: 'submitted',
  })

  const detectedCity =
    reportData.city ||
    getCityForLocation(reportData.latitude, reportData.longitude) ||
    null

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_code,
      description: reportData.description,
      photo_url: reportData.photo_url,
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      address: reportData.address || (detectedCity ? `${detectedCity}, Punjab` : null),
      city: detectedCity,
      reported_severity: severity,
      priority: calculated.priority,
      priority_score: calculated.score,
      priority_reasons: calculated.reasons,
      status: 'submitted',
    })
    .select()
    .single()

  return { data, error }
}

// ---- Fetch all reports (with optional filters) ---------------------

export async function getReports(filters = {}) {
  if (isDemoMode) return demo.getReports(filters)

  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  if (filters.city && filters.city !== 'all') {
    query = query.ilike('city', filters.city)
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim()
    query = query.or(`report_code.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`)
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = Date.now()
    const days = filters.dateRange === '7d' ? 7 : filters.dateRange === '30d' ? 30 : 0
    if (days > 0) {
      const cutoff = new Date(now - days * 86400000).toISOString()
      query = query.gte('created_at', cutoff)
    }
  }

  const { data, count, error } = await query
  return { data: data || [], count: count || 0, error }
}

// ---- Authority paginated reports ---------------------------------

export async function getAuthorityReports(filters = {}) {
  if (isDemoMode) return demo.getAuthorityReports(filters)

  const { page = 1, limit = 20, ...restFilters } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (restFilters.status && restFilters.status !== 'all') {
    query = query.eq('status', restFilters.status)
  }

  if (restFilters.priority && restFilters.priority !== 'all') {
    query = query.eq('priority', restFilters.priority)
  }

  if (restFilters.city && restFilters.city !== 'all') {
    query = query.ilike('city', restFilters.city)
  }

  if (restFilters.search?.trim()) {
    const q = restFilters.search.trim()
    query = query.or(`report_code.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`)
  }

  if (restFilters.dateRange && restFilters.dateRange !== 'all') {
    const now = Date.now()
    const days = restFilters.dateRange === '7d' ? 7 : restFilters.dateRange === '30d' ? 30 : 0
    if (days > 0) {
      const cutoff = new Date(now - days * 86400000).toISOString()
      query = query.gte('created_at', cutoff)
    }
  }

  const { data, count, error } = await query
  const totalPages = Math.ceil((count || 0) / limit)

  return { data: data || [], count: count || 0, totalPages, error }
}

// ---- Fetch single report by code --------------------------------

export async function getReportByCode(code) {
  if (isDemoMode) return demo.getReportByCode(code)

  const normalized = code.trim().toUpperCase()

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_code', normalized)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }

  return { data, error }
}

// ---- Fetch single report by UUID --------------------------------

export async function getReportById(id) {
  if (isDemoMode) return demo.getReportById(id)

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }

  return { data, error }
}

// ---- Fetch report history ----------------------------------------

export async function getReportHistory(reportId) {
  if (isDemoMode) return demo.getReportHistory(reportId)

  const { data, error } = await supabase
    .from('report_history')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })

  return { data: data || [], error }
}

// ---- Authority Dashboard Stats -----------------------------------

export async function getDashboardStats() {
  if (isDemoMode) return demo.getDashboardStats()

  // Run aggregate queries
  try {
    const [totalRes, submittedRes, highRes, inProgressRes, repairedRes] = await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('priority', 'high').not('status', 'in', '("repaired","rejected")'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'repaired'),
    ])

    return {
      data: {
        total: totalRes.count || 0,
        submitted: submittedRes.count || 0,
        highPriority: highRes.count || 0,
        inProgress: inProgressRes.count || 0,
        repaired: repairedRes.count || 0,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err }
  }
}

// ---- Update status (with transition validation) ------------------

export async function updateReportStatus({
  reportId,
  newStatus,
  note = null,
  closureNote = null,
  repairPhotoUrl = null,
  rejectionReason = null,
}) {
  if (isDemoMode) {
    return demo.updateReportStatus({
      reportId,
      newStatus,
      note,
      closureNote,
      repairPhotoUrl,
      rejectionReason,
    })
  }

  const updates = { status: newStatus }
  if (newStatus === 'verified') updates.verified_at = new Date().toISOString()
  if (newStatus === 'repaired') {
    updates.resolved_at = new Date().toISOString()
    if (closureNote) updates.closure_note = closureNote
    if (repairPhotoUrl) updates.repair_photo_url = repairPhotoUrl
  }
  if (newStatus === 'rejected') {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  return { data, error }
}

// ---- Update authority editable fields & recalculate priority -----

export async function updateReportAuthorityFields({
  reportId,
  trafficLevel,
  nearSensitiveLocation,
}) {
  if (isDemoMode) {
    return demo.updateReportAuthorityFields({
      reportId,
      trafficLevel,
      nearSensitiveLocation,
    })
  }

  // Fetch current report to verify override status and existing fields
  const { data: current, error: fetchErr } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (fetchErr) return { data: null, error: fetchErr }

  const updates = {
    traffic_level: trafficLevel || null,
    near_sensitive_location: nearSensitiveLocation || null,
  }

  // Recalculate priority if not manually overridden
  if (!current.priority_overridden) {
    const calc = calculatePriority({
      reported_severity: current.reported_severity,
      near_sensitive_location: updates.near_sensitive_location,
      traffic_level: updates.traffic_level,
      created_at: current.created_at,
      status: current.status,
    })
    updates.priority = calc.priority
    updates.priority_score = calc.score
    updates.priority_reasons = calc.reasons
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  return { data, error }
}

// ---- Set manual priority override or reset -----------------------

export async function setPriorityOverride({
  reportId,
  priority,
  overrideReason,
  reset = false,
}) {
  if (isDemoMode) {
    return demo.setPriorityOverride({
      reportId,
      priority,
      overrideReason,
      reset,
    })
  }

  const { data: current, error: fetchErr } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (fetchErr) return { data: null, error: fetchErr }

  let updates = {}

  if (reset) {
    const calc = calculatePriority({
      reported_severity: current.reported_severity,
      near_sensitive_location: current.near_sensitive_location,
      traffic_level: current.traffic_level,
      created_at: current.created_at,
      status: current.status,
    })
    updates = {
      priority_overridden: false,
      override_reason: null,
      overridden_by: null,
      priority: calc.priority,
      priority_score: calc.score,
      priority_reasons: calc.reasons,
    }
  } else {
    const userRes = await supabase.auth.getUser()
    const userId = userRes.data?.user?.id || null

    updates = {
      priority_overridden: true,
      priority,
      override_reason: overrideReason.trim(),
      overridden_by: userId,
    }
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  return { data, error }
}
