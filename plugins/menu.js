'use strict'

const config    = require('../config')
const { getRuntime } = require('../lib/runtime')

// ================================================================
//  PLUGIN: MENU
//  Command: .menu
// ================================================================

module.exports = {
  command: '.menu',

  async handler(sock, msg, { from, pushName }) {
    const runtime = getRuntime()

    const now  = new Date()
    const hour = now.getHours()

    // Salam berdasarkan waktu
    let salam = 'Selamat Malam'
    if (hour >= 5  && hour < 12) salam = 'Selamat Pagi'
    else if (hour >= 12 && hour < 15) salam = 'Selamat Siang'
    else if (hour >= 15 && hour < 18) salam = 'Selamat Sore'

    // ═══════════════════════════════════════
    //  TEKS MENU
    // ═══════════════════════════════════════
    const menuText = `
╭━━━━━━━━━━━━━━━━━━━━╮
┃  *${config.botName}* — v${config.botVersion}  
┃  Owner: *${config.ownerName}*
┃  Runtime: *${runtime}*
╰━━━━━━━━━━━━━━━━━━━━╯

${salam}, *${pushName}* 👋
Selamat datang di *${config.botName}*!

━━━━━━━━━━━━━━━━━━━━━━
  *📋 MENU UTAMA*
━━━━━━━━━━━━━━━━━━━━━━

╭─── 🛒 *TOKO & PROMOSI*
│ *.store*       → Lihat produk
│ *.setpromosi*  → Kelola promosi
│ *.setpromositime* → Atur jadwal promo
│ *.antipromosi* → Toggle promo otomatis
╰────────────────────

╭─── 🤖 *AI CHAT*
│ Kirim pesan biasa tanpa command
│ untuk chat dengan AI!
╰────────────────────

╭─── ℹ️ *INFO*
│ *.menu* → Tampilkan menu ini
╰────────────────────

━━━━━━━━━━━━━━━━━━━━━━
_Prefix: *${config.prefix}*_
_Powered by Baileys + AI_
`.trim()

    // ═══════════════════════════════════════
    //  KIRIM GAMBAR + CAPTION MENU
    // ═══════════════════════════════════════
    try {
      await sock.sendMessage(from, {
        image: { url: config.menuImage },
        caption: menuText,
        jpegThumbnail: null
      }, { quoted: msg })
    } catch {
      // Fallback: kirim teks saja jika gambar gagal
      await sock.sendMessage(from, { text: menuText }, { quoted: msg })
    }
  }
  }
