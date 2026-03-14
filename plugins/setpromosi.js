'use strict'

const db = require('../lib/database')

// ================================================================
//  PLUGIN: SETPROMOSI
//  Command:
//    .setpromosi add [teks]   → Tambah pesan promosi
//    .setpromosi list         → Lihat semua promosi
//    .setpromosi reset        → Hapus semua promosi
//    .setpromosi hapus [nomor]→ Hapus satu promosi
// ================================================================

module.exports = {
  command: '.setpromosi',

  async handler(sock, msg, { from, args, argStr }) {
    const sub = (args[0] || '').toLowerCase()

    // ────────────────────────────────────────
    //  TANPA ARGUMEN → tampilkan bantuan
    // ────────────────────────────────────────
    if (!sub) {
      const list  = db.get('promosiList') || []
      const count = list.length

      return sock.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃ *SETPROMOSI*
╰━━━━━━━━━━━━━━━━━━━━╯

Total promosi tersimpan: *${count}*

*Perintah:*
• *.setpromosi add [teks]*    → Tambah promosi
• *.setpromosi list*          → Lihat semua
• *.setpromosi hapus [nomor]* → Hapus satu
• *.setpromosi reset*         → Hapus semua

_Contoh: .setpromosi add 🔥 Promo hari ini..._`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  ADD — tambah pesan promosi baru
    // ────────────────────────────────────────
    if (sub === 'add') {
      const teks = args.slice(1).join(' ').trim()

      if (!teks) {
        return sock.sendMessage(from, {
          text: `❌ Teks promosi tidak boleh kosong!\n\nContoh: *.setpromosi add 🔥 Promo spesial hari ini!*`
        }, { quoted: msg })
      }

      const list = db.get('promosiList') || []
      list.push(teks)
      db.set('promosiList', list)

      return sock.sendMessage(from, {
        text: `✅ Promosi berhasil ditambahkan!\n\n📋 Total promosi: *${list.length}*\n\n📝 Teks:\n${teks}`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  LIST — lihat semua promosi
    // ────────────────────────────────────────
    if (sub === 'list') {
      const list = db.get('promosiList') || []

      if (list.length === 0) {
        return sock.sendMessage(from, {
          text: `📋 Belum ada promosi tersimpan.\n\nTambahkan dengan: *.setpromosi add [teks]*`
        }, { quoted: msg })
      }

      const items = list.map((teks, i) => {
        const preview = teks.length > 80 ? teks.slice(0, 80) + '...' : teks
        return `*[${i + 1}]* ${preview}`
      }).join('\n\n')

      return sock.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━━━━━━╮
┃ *DAFTAR PROMOSI* (${list.length})
╰━━━━━━━━━━━━━━━━━━━━╯\n\n${items}`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  HAPUS — hapus satu promosi berdasarkan nomor
    // ────────────────────────────────────────
    if (sub === 'hapus') {
      const list  = db.get('promosiList') || []
      const nomor = parseInt(args[1])

      if (isNaN(nomor) || nomor < 1 || nomor > list.length) {
        return sock.sendMessage(from, {
          text: `❌ Nomor tidak valid. Gunakan nomor 1–${list.length}.\n\nContoh: *.setpromosi hapus 1*`
        }, { quoted: msg })
      }

      const dihapus = list.splice(nomor - 1, 1)[0]
      db.set('promosiList', list)

      const preview = dihapus.length > 60 ? dihapus.slice(0, 60) + '...' : dihapus

      return sock.sendMessage(from, {
        text: `✅ Promosi #${nomor} berhasil dihapus!\n\n📝 "${preview}"\n\n📋 Sisa promosi: *${list.length}*`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  RESET — hapus semua promosi
    // ────────────────────────────────────────
    if (sub === 'reset') {
      const list = db.get('promosiList') || []
      const jumlah = list.length

      db.set('promosiList', [])

      return sock.sendMessage(from, {
        text: `♻️ Semua promosi (*${jumlah} pesan*) berhasil dihapus!\n\nDaftar promosi sekarang kosong.`
      }, { quoted: msg })
    }

    // ────────────────────────────────────────
    //  SUB TIDAK DIKENAL
    // ────────────────────────────────────────
    return sock.sendMessage(from, {
      text: `❓ Sub-perintah tidak dikenal: *${sub}*\n\nPerintah yang tersedia: add, list, hapus, reset`
    }, { quoted: msg })
  }
}
