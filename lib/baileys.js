'use strict'

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  proto
} = require('@whiskeysockets/baileys')

const pino            = require('pino')
const readline        = require('readline')
const path            = require('path')
const config          = require('../config')
const { loadPlugins, handleMessage } = require('./handler')

// Suppress log noise dari Baileys
const logger = pino({ level: 'silent' })

// ================================================================
// READLINE HELPER — membaca input dari console
// ================================================================
function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ================================================================
// KONEKSI WHATSAPP
// ================================================================
async function connectWhatsApp() {
  const sessionPath = path.resolve(config.sessionPath)

  // Load auth state dari folder session
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  // Ambil versi Baileys terbaru
  const { version } = await fetchLatestBaileysVersion()
  console.log(`[BAILEYS] Menggunakan versi WhatsApp Web: ${version.join('.')}`)

  // Buat socket koneksi
  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    browser: ['WaBot', 'Chrome', '126.0.0'],
    printQRInTerminal: false, // Kita pakai Pairing Code, bukan QR
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async () => {
      return { conversation: '' }
    }
  })

  // ============================================================
  // PAIRING CODE LOGIN
  // ============================================================
  if (!state.creds.registered) {
    // Delay kecil agar socket siap
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n╔══════════════════════════════════╗')
    console.log('║      WHATSAPP PAIRING CODE        ║')
    console.log('╚══════════════════════════════════╝\n')

    let phoneNumber = await question('Masukkan nomor WhatsApp kamu (contoh: 628xxxxxxxxxx): ')

    // Bersihkan: hapus +, spasi, tanda hubung
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

    if (!phoneNumber || phoneNumber.length < 10) {
      console.error('[BAILEYS] ❌ Nomor tidak valid. Jalankan ulang bot.')
      process.exit(1)
    }

    try {
      const code = await sock.requestPairingCode(phoneNumber)
      const formatted = code.match(/.{1,4}/g).join('-') // Format: XXXX-XXXX

      console.log('\n╔══════════════════════════════════╗')
      console.log(`║   PAIRING CODE: ${formatted.padEnd(17)}║`)
      console.log('╚══════════════════════════════════╝')
      console.log('\nCara menggunakan kode:')
      console.log('  1. Buka WhatsApp di HP kamu')
      console.log('  2. Ketuk ⋮ → Perangkat Tertaut')
      console.log('  3. Ketuk "Tautkan Perangkat"')
      console.log('  4. Pilih "Tautkan dengan nomor telepon"')
      console.log(`  5. Masukkan kode: ${formatted}\n`)
    } catch (err) {
      console.error('[BAILEYS] Gagal generate pairing code:', err.message)
      process.exit(1)
    }
  }

  // ============================================================
  // EVENT: PERUBAHAN KONEKSI
  // ============================================================
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const reason     = DisconnectReason[statusCode] || 'Unknown'

      console.log(`[BAILEYS] Koneksi terputus — Alasan: ${reason} (${statusCode})`)

      // Reconnect otomatis kecuali jika logout paksa
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('[BAILEYS] Mencoba reconnect dalam 5 detik...')
        setTimeout(() => connectWhatsApp(), 5000)
      } else {
        console.log('[BAILEYS] Sesi logout. Hapus folder /session dan jalankan ulang.')
        process.exit(1)
      }

    } else if (connection === 'open') {
      console.log('\n╔══════════════════════════════════╗')
      console.log('║    ✅  BOT TERHUBUNG KE WA!       ║')
      console.log('╚══════════════════════════════════╝\n')

      // Load semua plugin setelah koneksi berhasil
      loadPlugins()

      // Restart timer promosi jika sebelumnya aktif (misal setelah reconnect)
      try {
        const { startPromoTimer } = require('../plugins/setpromositime')
        const db = require('./database')
        if (db.get('antipromosi') && db.get('promosiGroupJid')) {
          console.log('[BAILEYS] Memulai ulang timer promosi...')
          startPromoTimer(sock)
        }
      } catch (e) {
        // Plugin belum dimuat, abaikan
      }
    } else if (connection === 'connecting') {
      console.log('[BAILEYS] Sedang menghubungkan ke WhatsApp...')
    }
  })

  // ============================================================
  // EVENT: SIMPAN CREDENTIALS
  // ============================================================
  sock.ev.on('creds.update', saveCreds)

  // ============================================================
  // EVENT: PESAN MASUK
  // ============================================================
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      // Abaikan broadcast / status
      if (isJidBroadcast(msg.key.remoteJid)) continue
      if (msg.key.remoteJid === 'status@broadcast') continue

      await handleMessage(sock, msg)
    }
  })

  return sock
}

module.exports = { connectWhatsApp }
