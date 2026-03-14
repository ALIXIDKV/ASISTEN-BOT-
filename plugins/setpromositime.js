'use strict'

const db          = require('../lib/database')
const { state }   = require('../lib/handler')

// ================================================================
//  PLUGIN: SETPROMOSITIME
//  Command: .setpromositime [angka] [jam|menit|detik]
//
//  Mengatur interval promosi otomatis dan langsung menjalankan
//  timer berputar (round-robin) untuk mengirim pesan promosi.
// ================================================================

// ────────────────────────────────────────────────────────────────
//  FUNGSI: Parse interval dari teks user
//  Input:  "1 jam" / "10 menit" / "30 detik"
//  Output: { ms: number, label: string } atau null
// ────────────────────────────────────────────────────────────────
function parseInterval(args) {
  const angka = parseFloat(args[0])
  const satuan = (args[1] || '').toLowerCase()

  if (isNaN(angka) || angka <= 0) return null

  let ms    = 0
  let label = ''

  if (['jam', 'hour', 'h'].includes(satuan)) {
    ms    = angka * 3600 * 1000
    label = `${angka} jam`
  } else if (['menit', 'minute', 'min', 'm'].includes(satuan)) {
    ms    = angka * 60 * 1000
    label = `${angka} menit`
  } else if (['detik', 'second', 'sec', 's'].includes(satuan)) {
    ms    = angka * 1000
    label = `${angka} detik`
  } else {
    return null
  }

  // Minimal 10 detik untuk menghindari spam
  if (ms < 10000) return null

  return { ms, label }
}

// ────────────────────────────────────────────────────────────────
//  FUNGSI GLOBAL: Mulai / Restart timer promosi
//  Dipanggil saat bot connect dan saat command dijalankan.
// ────────────────────────────────────────────────────────────────
function startPromoTimer(sock) {
  // Hentikan timer lama jika ada
  if (state.promoTimer) {
    clearInterval(state.promoTimer)
    state.promoTimer = null
  }

  const isAktif   = db.get('antipromosi')
  const interval  = db.get('promosiInterval') || 3600000
  const groupJid  = db.get('promosiGroupJid')
  const list      = db.get('promosiList') || []

  if (!isAktif || !groupJid || list.length === 0) return

  // Index round-robin untuk giliran pesan
  let index = 0

  state.promoTimer = setInterval(async () => {
    try {
      // Refresh data dari DB setiap tick (nilai bisa berubah)
      const aktif       = db.get('antipromosi')
      const promoList   = db.get('promosiList') || []
      const targetJid   = db.get('promosiGroupJid')

      if (!aktif || promoList.length === 0 || !targetJid) return

      const teks = promoList[index % promoList.length]
      index++

      const sockRef = state.sock || sock
      if (!sockRef) return

      await sockRef.sendMessage(targetJid, { text: teks })
      console.log(`[PROMO] Promosi #${index} dikirim ke ${targetJid}`)
    } catch (err) {
      console.error('[PROMO] Gagal kirim promosi:', err.message)
    }
  }, interval)

  console.log(`[PROMO] Timer promosi aktif — interval: ${db.get('promosiIntervalLabel')}`)
}

// Export startPromoTimer agar bisa dipanggil dari luar (misal di baileys.js)
module.exports = {
  command: '.setpromositime',
  startPromoTimer,

  async handler(sock, msg, { from, args }) {
    // ────────────────────────────────────────
    //  TANPA ARGUMEN → tampilkan status & bantuan
    // ────────────────────────────────────────
    if (args.length === 0) {
      const isAktif = db.get('antipromosi')
      const label   = db.get('promosiIntervalLabel') || '1 jam'
      const list    = db.get('promosiList') || []

      return sock.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ *SETPROMOSITIME*
╰━━━━━━━━━━━━━━━━━━━━━━╯

⏰ Interval saat ini: *${label}*
📋 Total promosi: *${list.length} pesan*
📡 Status: *${isAktif ? '✅ AKTIF' : '❌ NONAKTIF'}*

*Cara pakai:*
_.setpromositime [angka] [satuan]_

*Satuan yang tersedia:*
• *jam*    → contoh: .setpromositime 1 jam
• *menit*  → contoh: .setpromositime 30 menit
• *detik*  → contoh: .setpromositime 30 detik
⚠️ Minimal 10 detik`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  PARSE INTERVAL
    // ────────────────────────────────────────
    const parsed = parseInterval(args)

    if (!parsed) {
      return sock.sendMessage(from, {
        text: `❌ Format tidak valid!\n\nContoh yang benar:\n• *.setpromositime 1 jam*\n• *.setpromositime 30 menit*\n• *.setpromositime 30 detik*\n\n⚠️ Minimal 10 detik.`
      }, { quoted: msg })
    }

    // Simpan ke DB
    db.set('promosiInterval', parsed.ms)
    db.set('promosiIntervalLabel', parsed.label)
    db.set('promosiGroupJid', from) // Simpan grup sumber command
    state.promoGroupJid = from

    const isAktif = db.get('antipromosi')
    const list    = db.get('promosiList') || []

    // Restart timer dengan interval baru
    startPromoTimer(sock)

    let info = `✅ Interval promosi diatur ke: *${parsed.label}*\n📍 Target grup: grup ini\n\n`

    if (!isAktif) {
      info += `⚠️ Promosi otomatis saat ini *NONAKTIF*.\nAktifkan dengan: *.antipromosi on*`
    } else if (list.length === 0) {
      info += `⚠️ Belum ada teks promosi.\nTambahkan dengan: *.setpromosi add [teks]*`
    } else {
      info += `🚀 Bot akan mengirim *${list.length} promosi* setiap *${parsed.label}*!`
    }

    await sock.sendMessage(from, { text: info }, { quoted: msg })
  }
}
