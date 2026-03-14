'use strict'

const db = require('../lib/database')

// ================================================================
//  PLUGIN: STORE
//  Command: .store
//
//  Menampilkan daftar produk dan info pembayaran.
//  Owner bisa mengelola produk via: .store add / remove / list
// ================================================================

// ────────────────────────────────────────────────────────────────
//  Format satu produk menjadi teks
// ────────────────────────────────────────────────────────────────
function formatProduk(p, index) {
  return `
╭─ *[${index + 1}] ${p.nama}*
│  💰 Harga   : *${p.harga}*
│  💙 DANA    : *${p.dana}*
│  💚 GoPay   : *${p.gopay}*
│  🟡 QRIS    : *${p.qris}*
╰──────────────────────`
}

module.exports = {
  command: '.store',

  async handler(sock, msg, { from, args, pushName }) {
    const sub = (args[0] || '').toLowerCase()

    // ════════════════════════════════════════
    //  TAMPIL SEMUA PRODUK (default)
    // ════════════════════════════════════════
    if (!sub || sub === 'list') {
      const storeData = db.get('store') || { products: [] }
      const products  = storeData.products || []

      if (products.length === 0) {
        return sock.sendMessage(from, {
          text: `🏪 *TOKO KOSONG*\n\nBelum ada produk yang ditambahkan.\n\nOwner dapat menambahkan produk dengan:\n*.store add*`
        }, { quoted: msg })
      }

      const header = `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃    🏪 *TOKO KAMI*
╰━━━━━━━━━━━━━━━━━━━━━━╯

Halo *${pushName}*! 👋
Berikut produk yang tersedia:\n`

      const productList = products.map(formatProduk).join('\n')

      const footer = `

━━━━━━━━━━━━━━━━━━━━━━
💳 *METODE PEMBAYARAN*
━━━━━━━━━━━━━━━━━━━━━━
💙 DANA
💚 GoPay
🟡 QRIS

Cara order:
1. Pilih produk yang diinginkan
2. Transfer ke metode bayar pilihan kamu
3. Kirim bukti transfer ke owner
4. Produk akan segera diproses ✅

_Hubungi owner untuk informasi lebih lanjut._`

      // Coba kirim sebagai list message interaktif
      try {
        // Format sections untuk list message
        const sections = products.map((p, i) => ({
          title: `${p.nama} — ${p.harga}`,
          rows: [
            {
              title: `💙 Bayar via DANA`,
              rowId: `bayar_dana_${p.id}`,
              description: `No. DANA: ${p.dana}`
            },
            {
              title: `💚 Bayar via GoPay`,
              rowId: `bayar_gopay_${p.id}`,
              description: `No. GoPay: ${p.gopay}`
            },
            {
              title: `🟡 Bayar via QRIS`,
              rowId: `bayar_qris_${p.id}`,
              description: p.qris
            }
          ]
        }))

        await sock.sendMessage(from, {
          listMessage: {
            title: '🏪 Toko Kami',
            text: `${header}${productList}`,
            footerText: 'Pilih produk & metode pembayaran',
            buttonText: '🛒 Lihat Pilihan Pembayaran',
            sections
          }
        })
      } catch {
        // Fallback: kirim sebagai teks biasa
        await sock.sendMessage(from, {
          text: header + productList + footer
        }, { quoted: msg })
      }

      return
    }

    // ════════════════════════════════════════
    //  TAMBAH PRODUK — .store add
    //  Format: .store add | nama | harga | dana | gopay | qris
    // ════════════════════════════════════════
    if (sub === 'add') {
      const rawText = args.slice(1).join(' ')
      const parts   = rawText.split('|').map(s => s.trim())

      if (parts.length < 5) {
        return sock.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━━━━━━━━╮
┃  ➕ *TAMBAH PRODUK*
╰━━━━━━━━━━━━━━━━━━━━━━╯

Format:
*.store add | nama | harga | no_dana | no_gopay | qris*

Contoh:
_.store add | Produk A | Rp 50.000 | 081234 | 081234 | Hubungi owner_`
        }, { quoted: msg })
      }

      const [nama, harga, dana, gopay, qris] = parts

      const storeData = db.get('store') || { products: [] }
      const products  = storeData.products || []

      const newId = products.length > 0
        ? Math.max(...products.map(p => p.id)) + 1
        : 1

      products.push({ id: newId, nama, harga, dana, gopay, qris })
      db.update('store', { products })

      return sock.sendMessage(from, {
        text: `✅ Produk berhasil ditambahkan!\n\n📦 *${nama}*\n💰 ${harga}\n💙 DANA: ${dana}\n💚 GoPay: ${gopay}\n🟡 QRIS: ${qris}\n\nTotal produk: *${products.length}*`
      }, { quoted: msg })
    }

    // ════════════════════════════════════════
    //  HAPUS PRODUK — .store hapus [id]
    // ════════════════════════════════════════
    if (sub === 'hapus') {
      const id        = parseInt(args[1])
      const storeData = db.get('store') || { products: [] }
      const products  = storeData.products || []

      const idx = products.findIndex(p => p.id === id)

      if (isNaN(id) || idx === -1) {
        const ids = products.map(p => `[${p.id}] ${p.nama}`).join('\n') || '(kosong)'
        return sock.sendMessage(from, {
          text: `❌ Produk dengan ID *${id}* tidak ditemukan.\n\nDaftar ID produk:\n${ids}\n\nContoh: *.store hapus 1*`
        }, { quoted: msg })
      }

      const dihapus = products.splice(idx, 1)[0]
      db.update('store', { products })

      return sock.sendMessage(from, {
        text: `✅ Produk *${dihapus.nama}* berhasil dihapus!\n\nSisa produk: *${products.length}*`
      }, { quoted: msg })
    }

    // ════════════════════════════════════════
    //  SUB TIDAK DIKENAL
    // ════════════════════════════════════════
    return sock.sendMessage(from, {
      text: `❓ Sub-perintah tidak dikenal: *${sub}*\n\nPerintah tersedia:\n• *.store* — Tampil semua produk\n• *.store add* — Tambah produk\n• *.store hapus [id]* — Hapus produk`
    }, { quoted: msg })
  }
}
