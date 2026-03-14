'use strict'

const db    = require('../lib/database')
const { state } = require('../lib/handler')

// ================================================================
//  PLUGIN: ANTIPROMOSI
//  Command: .antipromosi on | .antipromosi off
//
//  Mengaktifkan atau mematikan fitur promosi otomatis.
//  Ketika AKTIF (on), bot akan mengirim promosi secara berkala
//  sesuai timer yang diatur di .setpromositime
// ================================================================

module.exports = {
  command: '.antipromosi',

  async handler(sock, msg, { from, args }) {
    const sub = (args[0] || '').toLowerCase()

    if (!['on', 'off'].includes(sub)) {
      const current = db.get('antipromosi')
      return sock.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━━━━╮
┃ *ANTIPROMOSI*
╰━━━━━━━━━━━━━━━━━━╯

Status saat ini: *${current ? '✅ AKTIF' : '❌ NONAKTIF'}*

Cara pakai:
• *.antipromosi on*  → Aktifkan promosi otomatis
• *.antipromosi off* → Matikan promosi otomatis`
      }, { quoted: msg })
    }

    if (sub === 'on') {
      db.set('antipromosi', true)

      // Simpan JID grup ini sebagai target promosi
      db.set('promosiGroupJid', from)
      state.promoGroupJid = from

      // Cek apakah ada list promosi
      const list = db.get('promosiList') || []
      if (list.length === 0) {
        return sock.sendMessage(from, {
          text: `✅ Promosi otomatis *DIAKTIFKAN* di grup ini!\n\n⚠️ Belum ada teks promosi.\nTambahkan dulu dengan: *.setpromosi add [teks]*`
        }, { quoted: msg })
      }

      const label = db.get('promosiIntervalLabel') || '1 jam'

      await sock.sendMessage(from, {
        text: `✅ Promosi otomatis *DIAKTIFKAN!*\n\n📍 Grup: ${from}\n⏰ Interval: setiap *${label}*\n📋 Total promosi: *${list.length} pesan*\n\nBot akan otomatis mengirim promosi sesuai jadwal.`
      }, { quoted: msg })

    } else {
      db.set('antipromosi', false)

      // Stop timer jika aktif
      if (state.promoTimer) {
        clearInterval(state.promoTimer)
        state.promoTimer = null
        console.log('[ANTIPROMOSI] Timer promosi dihentikan.')
      }

      await sock.sendMessage(from, {
        text: `❌ Promosi otomatis *DINONAKTIFKAN.*\n\nBot tidak akan mengirim promosi otomatis.`
      }, { quoted: msg })
    }
  }
}
