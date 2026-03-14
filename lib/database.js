'use strict'

const fs   = require('fs')
const path = require('path')

const DB_PATH = path.join(process.cwd(), 'database', 'database.json')

const defaultDB = {
  antipromosi: false,
  promosiList: [],
  promosiInterval: 3600000,
  promosiIntervalLabel: '1 jam',
  promosiGroupJid: null,
  store: {
    products: []
  },
  settings: {}
}

/**
 * Membaca database dari file JSON.
 * Jika file tidak ada, buat dengan nilai default.
 * @returns {object} data database
 */
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(defaultDB)
      return JSON.parse(JSON.stringify(defaultDB))
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('[DB] Gagal membaca database:', err.message)
    return JSON.parse(JSON.stringify(defaultDB))
  }
}

/**
 * Menulis data ke file JSON.
 * @param {object} data - data yang akan disimpan
 */
function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('[DB] Gagal menulis database:', err.message)
  }
}

/**
 * Mengambil seluruh isi database.
 * @returns {object} database
 */
function getDB() {
  return readDB()
}

/**
 * Mengambil nilai dari key tertentu di database.
 * @param {string} key
 * @returns {*}
 */
function get(key) {
  const db = readDB()
  return db[key]
}

/**
 * Menyimpan nilai ke key tertentu di database.
 * @param {string} key
 * @param {*} value
 */
function set(key, value) {
  const db = readDB()
  db[key] = value
  writeDB(db)
}

/**
 * Update partial data di dalam key tertentu (untuk nested object).
 * @param {string} key
 * @param {object} partial
 */
function update(key, partial) {
  const db = readDB()
  if (typeof db[key] === 'object' && !Array.isArray(db[key])) {
    db[key] = { ...db[key], ...partial }
  } else {
    db[key] = partial
  }
  writeDB(db)
}

module.exports = {
  readDB,
  writeDB,
  getDB,
  get,
  set,
  update
}
