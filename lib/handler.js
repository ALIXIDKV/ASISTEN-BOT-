'use strict'

const fs     = require('fs')
const path   = require('path')
const config = require('../config')

// ================================================================
// STATE GLOBAL — dipakai plugin untuk menyimpan sock & timer promo
// ================================================================
const state = {
  sock: null,          // referensi sock baileys aktif
  promoTimer: null,    // setInterval handle untuk promosi otomatis
  promoGroupJid: null  // JID grup tujuan promosi otomatis
}

// ================================================================
// PLUGIN REGISTRY
// ================================================================
const plugins = []

/**
 * Load semua plugin dari folder /plugins
 */
function loadPlugins() {
  const pluginsDir = path.join(process.cwd(), 'plugins')
  if (!fs.existsSync(pluginsDir)) {
    console.warn('[HANDLER] Folder plugins tidak ditemukan.')
    return
  }

  const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      // Clear cache saat reload agar perubahan terbaca
      const fullPath = path.join(pluginsDir, file)
      delete require.cache[require.resolve(fullPath)]

      const plugin = require(fullPath)

      // Validasi struktur plugin
      if (!plugin.command || typeof plugin.handler !== 'function') {
        console.warn(`[HANDLER] Plugin "${file}" tidak valid — lewati.`)
        continue
      }

      plugins.push(plugin)
      console.log(`[HANDLER] Plugin dimuat: ${file} (${plugin.command})`)
    } catch (err) {
      console.error(`[HANDLER] Gagal load plugin "${file}":`, err.message)
    }
  }

  console.log(`[HANDLER] Total ${plugins.length} plugin aktif.\n`)
}

/**
 * Proses pesan masuk dan routing ke plugin yang sesuai.
 * @param {object} sock  - Baileys socket
 * @param {object} msg   - Pesan masuk dari WhatsApp
 */
async function handleMessage(sock, msg) {
  try {
    // Simpan referensi sock ke state
    state.sock = sock

    // Abaikan pesan dari diri sendiri
    if (msg.key.fromMe) return

    // Ekstrak body pesan
    const body = msg.message?.conversation
      || msg.message?.extendedTextMessage?.text
      || msg.message?.imageMessage?.caption
      || msg.message?.videoMessage?.caption
      || ''

    if (!body) return

    const from  = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const sender  = isGroup ? msg.key.participant : from

    // Nama pengirim
    const pushName = msg.pushName || sender.replace('@s.whatsapp.net', '')

    // Cek apakah dimulai dengan prefix
    const isCommand = body.startsWith(config.prefix)

    if (isCommand) {
      // Parse command dan argumen
      const args    = body.slice(config.prefix.length).trim().split(/\s+/)
      const command = (config.prefix + args[0]).toLowerCase()
      const argStr  = args.slice(1).join(' ')

      // Cari plugin yang cocok
      const plugin = plugins.find(p =>
        Array.isArray(p.command)
          ? p.command.map(c => c.toLowerCase()).includes(command)
          : p.command.toLowerCase() === command
      )

      if (plugin) {
        try {
          await plugin.handler(sock, msg, {
            from,
            sender,
            pushName,
            isGroup,
            args: args.slice(1),
            argStr,
            body
          })
        } catch (err) {
          console.error(`[HANDLER] Error pada plugin "${command}":`, err.message)
          await sock.sendMessage(from, {
            text: `❌ Terjadi kesalahan saat menjalankan perintah ini.\n\n_${err.message}_`
          }, { quoted: msg })
        }
      }
      // Jika command tidak ditemukan, diam saja (tidak spam)

    } else {
      // ——————————————————————————————————————
      // Bukan command → arahkan ke plugin AI
      // ——————————————————————————————————————
      const aiPlugin = plugins.find(p => p.command === '__ai__')
      if (aiPlugin) {
        try {
          await aiPlugin.handler(sock, msg, {
            from,
            sender,
            pushName,
            isGroup,
            args: [],
            argStr: body,
            body
          })
        } catch (err) {
          console.error('[HANDLER] Error AI plugin:', err.message)
        }
      }
    }
  } catch (err) {
    console.error('[HANDLER] handleMessage error:', err.message)
  }
}

module.exports = { loadPlugins, handleMessage, plugins, state }
