// Utility helpers
import { STATUSES, PRIORITIES, CITIZEN_STATUS_STEPS, DEFAULT_LAT, DEFAULT_LNG } from './constants.js'

export { DEFAULT_LAT, DEFAULT_LNG }

/**
 * Generate a unique report code in format NF-YYMM-XXXXX
 * e.g. NF-2610-A7K2P
 */
export function generateReportCode() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `NF-${yy}${mm}-${suffix}`
}

/**
 * Format a date to a friendly string
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get age in days
 */
export function getAgeDays(dateStr) {
  if (!dateStr) return 0
  const created = new Date(dateStr).getTime()
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)))
}

/**
 * Compress an image file to roughly 1280px max dimension.
 * Returns a Blob.
 */
export async function compressImage(file, maxDim = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.src = url
  })
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Status display helpers derived from constants
 */
export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUSES).map(([k, v]) => [k, v.label])
)

export const STATUS_COLORS = Object.fromEntries(
  Object.entries(STATUSES).map(([k, v]) => [k, v.badgeClass])
)

export const PRIORITY_LABELS = Object.fromEntries(
  Object.entries(PRIORITIES).map(([k, v]) => [k, v.label])
)

export const PRIORITY_COLORS = Object.fromEntries(
  Object.entries(PRIORITIES).map(([k, v]) => [k, v.badgeClass])
)

export const STATUS_TIMELINE = CITIZEN_STATUS_STEPS
