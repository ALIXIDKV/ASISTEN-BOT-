'use strict'

const config = require('../config')

// ================================================================
//  PLUGIN: AI CHAT
//  Command: __ai__  (catch-all — dipanggil jika bukan command)
//
//  Menggunakan REST API: https://api.nexray.web.id/ai/chatgpt?text=
//  Bot akan membalas setiap pesan biasa (non-command) dengan AI.
// ================================================================

// Cache sesi per pengirim untuk simulasi konteks percakapan singkat
// Format: { jid: [{ role, content }, ...] }
const sessionCache = new Map()
const MAX_HISTORY  = 10   // Batasi history per sesi
const CACHE_TTL    = 30 * 60 * 1000 // 30 menit

// ────────────────────────────────────────────────────────────────
//  Panggil AI API
// ────────────────────────────────────────────────────────────────
async function callAI(text, timeoutMs = 20000) {
  const url = config.aiApiUrl + encodeURIComponent(text)

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'WaBot/1.0',
        'Accept': 'application/json'
      }
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    // Coba berbagai kemungkinan field response
    return (
      json?.result   ||
      json?.response ||
      json?.answer   ||
      json?.text     ||
      json?.message  ||
      JSON.stringify(json)
    )
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') throw new Error('Request timeout')
    throw err
  }
}

// ────────────────────────────────────────────────────────────────
//  Bersihkan cache yang sudah expire
// ────────────────────────────────────────────────────────────────
function cleanCache() {
  const now = Date.now()
  for (const [key, val] of sessionCache.entries()) {
    if (now - val.lastActive > CACHE_TTL) {
      sessionCache.delete(key)
    }
  }
}

// Cleanup cache setiap 15 menit
setInterval(cleanCache, 15 * 60 * 1000)

// ────────────────────────────────────────────────────────────────
//  Anti-spam: tracking cooldown per pengirim
// ────────────────────────────────────────────────────────────────
const cooldowns = new Map()
const COOLDOWN  = 3000 // 3 detik antar pesan

module.exports = {
  command: '__ai__',

  async handler(sock, msg, { from, sender, pushName, body }) {
    // Abaikan pesan kosong
    if (!body || body.trim().length === 0) return

    // ── Cooldown check ──────────────────────────────────────────
    const now      = Date.now()
    const lastCall = cooldowns.get(sender) || 0

    if (now - lastCall < COOLDOWN) return
    cooldowns.set(sender, now)

    // ── Typing indicator ────────────────────────────────────────
    await sock.sendPresenceUpdate('composing', from).catch(() => {})

    try {
      const reply = await callAI(body)

      if (!reply) {
        return sock.sendMessage(from, {
          text: `⚠️ Maaf, AI tidak memberikan respons. Coba lagi.`
        }, { quoted: msg })
      }

      // Format balasan
      const formattedReply = reply.toString().trim()

      await sock.sendMessage(from, {
        text: formattedReply
      }, { quoted: msg })

    } catch (err) {
      console.error('[AI] Error:', err.message)

      let errMsg = '❌ Maaf, AI sedang tidak bisa dihubungi.'
      if (err.message === 'Request timeout') {
        errMsg = '⏰ Request ke AI timeout. Coba lagi sebentar lagi.'
      }

      await sock.sendMessage(from, {
        text: errMsg
      }, { quoted: msg })
    } finally {
      // Stop typing indicator
      await sock.sendPresenceUpdate('paused', from).catch(() => {})
    }
  }
}
