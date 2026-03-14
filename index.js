'use strict'

// ================================================================
//  WA-BOT — Entry Point
//  Node.js 20+ | @whiskeysockets/baileys (socketon)
// ================================================================

const { connectWhatsApp } = require('./lib/baileys')
const config = require('./config')

// Tampilkan header saat startup
console.log('╔══════════════════════════════════╗')
console.log(`║  ${config.botName.padEnd(14)} v${config.botVersion.padEnd(12)}   ║`)
console.log(`║  Owner: ${config.ownerName.padEnd(24)}║`)
console.log('╚══════════════════════════════════╝')
console.log(`  Menjalankan bot...\n`)

// Tangani uncaught error agar bot tidak crash
process.on('uncaughtException', (err) => {
  console.error('[BOT] uncaughtException:', err.message)
})

process.on('unhandledRejection', (reason) => {
  console.error('[BOT] unhandledRejection:', reason)
})

// Mulai koneksi WhatsApp
connectWhatsApp().catch(err => {
  console.error('[BOT] Fatal error:', err.message)
  process.exit(1)
})