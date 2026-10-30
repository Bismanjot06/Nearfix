import { PRIORITY_WEIGHTS } from './constants.js'

/**
 * Pure function to calculate priority score and human-readable reasons.
 *
 * @param {Object} params
 * @param {string} [params.reported_severity] - 'low' | 'medium' | 'high'
 * @param {string} [params.near_sensitive_location] - Text or null
 * @param {string} [params.traffic_level] - 'low' | 'medium' | 'high' or null
 * @param {string|Date} [params.created_at] - ISO string or Date
 * @param {string} [params.status] - 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'repaired' | 'rejected'
 * @returns {{ score: number, priority: 'low'|'medium'|'high', reasons: string[] }}
 */
export function calculatePriority({
  reported_severity = 'medium',
  near_sensitive_location = null,
  traffic_level = null,
  created_at = null,
  status = 'submitted',
}) {
  let score = 0
  const reasons = []

  // 1. Reported severity
  const severityKey = reported_severity?.toLowerCase() || 'medium'
  const severityPoints = PRIORITY_WEIGHTS.severity[severityKey] ?? 2
  score += severityPoints
  const severityLabel = severityKey.charAt(0).toUpperCase() + severityKey.slice(1)
  reasons.push(`Reported severity: ${severityLabel} (+${severityPoints})`)

  // 2. Near verified sensitive location (+2 if set)
  if (near_sensitive_location && near_sensitive_location.trim().length > 0) {
    score += PRIORITY_WEIGHTS.sensitiveLocation
    reasons.push(`Near sensitive location: "${near_sensitive_location.trim()}" (+${PRIORITY_WEIGHTS.sensitiveLocation})`)
  } else {
    reasons.push('No sensitive location recorded (+0)')
  }

  // 3. Traffic level (low +0, medium +1, high +2)
  if (traffic_level) {
    const trafficKey = traffic_level.toLowerCase()
    const trafficPoints = PRIORITY_WEIGHTS.trafficLevel[trafficKey] ?? 0
    score += trafficPoints
    const trafficLabel = trafficKey.charAt(0).toUpperCase() + trafficKey.slice(1)
    reasons.push(`Traffic level: ${trafficLabel} (+${trafficPoints})`)
  } else {
    reasons.push('Traffic data not available, not counted (+0)')
  }

  // 4. Age of open report (+1 if > 7 days, +2 if > 14 days)
  // Only applies if report is open (not repaired and not rejected)
  const isClosed = status === 'repaired' || status === 'rejected'
  if (!isClosed && created_at) {
    const createdTime = new Date(created_at).getTime()
    const nowTime = Date.now()
    const ageDays = Math.max(0, Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24)))

    if (ageDays > 14) {
      score += PRIORITY_WEIGHTS.age.over14Days
      reasons.push(`Open for ${ageDays} days (over 14 days: +${PRIORITY_WEIGHTS.age.over14Days})`)
    } else if (ageDays > 7) {
      score += PRIORITY_WEIGHTS.age.over7Days
      reasons.push(`Open for ${ageDays} days (over 7 days: +${PRIORITY_WEIGHTS.age.over7Days})`)
    } else {
      reasons.push(`Open for ${ageDays} day${ageDays === 1 ? '' : 's'} (+0)`)
    }
  } else if (isClosed) {
    reasons.push(`Report is ${status} (age bonus inactive)`)
  }

  // 5. Priority tier mapping: score >= 6 High, 3-5 Medium, else Low
  let priority = 'low'
  if (score >= PRIORITY_WEIGHTS.thresholds.high) {
    priority = 'high'
  } else if (score >= PRIORITY_WEIGHTS.thresholds.medium) {
    priority = 'medium'
  } else {
    priority = 'low'
  }

  return {
    score,
    priority,
    reasons,
  }
}
