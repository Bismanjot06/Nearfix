import { useState, useEffect, useCallback } from 'react'
import { getReports } from '../services/reports.js'

export function useReports(filters = {}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getReports(filters)
    if (err) {
      setError(err.message || 'Failed to load reports.')
    } else {
      setReports(data || [])
    }
    setLoading(false)
  }, [filters.city, filters.status, filters.priority, filters.search])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Refetch when browser tab/window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchReports()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchReports])

  // Open reports = submitted, verified, assigned, in_progress
  const openCount = reports.filter((r) =>
    ['submitted', 'verified', 'assigned', 'in_progress'].includes(r.status)
  ).length

  // Repaired count
  const repairedCount = reports.filter((r) => r.status === 'repaired').length

  return {
    reports,
    loading,
    error,
    openCount,
    repairedCount,
    resolvedCount: repairedCount, // backward compatibility
    refetch: fetchReports,
  }
}
