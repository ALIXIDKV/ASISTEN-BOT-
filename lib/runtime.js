'use strict'

// Waktu saat bot pertama kali dijalankan
const startTime = Date.now()

/**
 * Menghitung dan mengembalikan string runtime bot.
 * Contoh: "2 Jam 13 Menit" atau "5 Menit 30 Detik"
 * @returns {string}
 */
function getRuntime() {
  const ms      = Date.now() - startTime
  const totalSec = Math.floor(ms / 1000)
  const days     = Math.floor(totalSec / 86400)
  const hours    = Math.floor((totalSec % 86400) / 3600)
  const minutes  = Math.floor((totalSec % 3600) / 60)
  const seconds  = totalSec % 60

  const parts = []

  if (days > 0)    parts.push(`${days} Hari`)
  if (hours > 0)   parts.push(`${hours} Jam`)
  if (minutes > 0) parts.push(`${minutes} Menit`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} Detik`)

  return parts.join(' ')
}

/**
 * Mengembalikan timestamp saat bot mulai berjalan.
 * @returns {number}
 */
function getStartTime() {
  return startTime
}

module.exports = { getRuntime, getStartTime }
