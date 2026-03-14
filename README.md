# 🤖 WaBot — WhatsApp Bot Auto Promosi + AI Chat

Bot WhatsApp otomatis untuk promosi jualan di grup dan AI chat menggunakan Baileys.

---

## 📁 Struktur Project

```
project-root/
├── index.js              ← Entry point
├── config.js             ← Konfigurasi bot
├── package.json
├── lib/
│   ├── baileys.js        ← Koneksi WhatsApp (Pairing Code)
│   ├── handler.js        ← Plugin loader & message router
│   ├── database.js       ← JSON database handler
│   └── runtime.js        ← Runtime counter
├── plugins/
│   ├── menu.js           ← .menu
│   ├── antipromosi.js    ← .antipromosi on/off
│   ├── setpromosi.js     ← .setpromosi
│   ├── setpromositime.js ← .setpromositime
│   ├── store.js          ← .store
│   └── ai.js             ← AI chat (catch-all)
└── database/
    └── database.json     ← Data tersimpan
```

---

## ⚙️ Konfigurasi

Edit file `config.js` sebelum menjalankan bot:

```js
ownerName:  'NamaKamu',
botName:    'NamaBot',
botVersion: '1.0.0',
ownerNumber: '628xxxxxxxxxx',
menuImage:  'https://link-gambar-banner-kamu.jpg',
```

---

## 🚀 Instalasi & Menjalankan

### Linux VPS / Termux

```bash
# 1. Clone atau upload folder project
cd wa-bot

# 2. Install dependencies
npm install

# 3. Jalankan bot
npm start
# atau
node index.js
```

### Pterodactyl Panel

1. Upload semua file ke server
2. Set Startup Command: `node index.js`
3. Set Node.js versi 20 atau lebih baru
4. Start server

---

## 🔑 Login Pairing Code

Saat bot pertama kali dijalankan:

```
Masukkan nomor WhatsApp kamu (contoh: 628xxxxxxxxxx): 628xxx
╔══════════════════════════════════╗
║   PAIRING CODE: XXXX-XXXX       ║
╚══════════════════════════════════╝
```

Cara menggunakan kode:
1. Buka WhatsApp di HP
2. Ketuk ⋮ → **Perangkat Tertaut**
3. Ketuk **"Tautkan Perangkat"**
4. Pilih **"Tautkan dengan nomor telepon"**
5. Masukkan kode yang tampil di console

---

## 📋 Daftar Perintah

| Perintah | Fungsi |
|----------|--------|
| `.menu` | Tampilkan menu bot |
| `.antipromosi on` | Aktifkan promosi otomatis |
| `.antipromosi off` | Matikan promosi otomatis |
| `.setpromosi add [teks]` | Tambah pesan promosi |
| `.setpromosi list` | Lihat daftar promosi |
| `.setpromosi hapus [no]` | Hapus satu promosi |
| `.setpromosi reset` | Hapus semua promosi |
| `.setpromositime 1 jam` | Set interval 1 jam |
| `.setpromositime 30 menit` | Set interval 30 menit |
| `.setpromositime 30 detik` | Set interval 30 detik |
| `.store` | Tampilkan produk |
| `.store add \| nama \| harga \| dana \| gopay \| qris` | Tambah produk |
| `.store hapus [id]` | Hapus produk |
| *(pesan biasa)* | Chat dengan AI |

---

## 🛠️ Cara Membuat Plugin Baru

Buat file baru di folder `plugins/`, contoh `plugins/ping.js`:

```js
'use strict'

module.exports = {
  command: '.ping',

  async handler(sock, msg, { from }) {
    await sock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg })
  }
}
```

Plugin akan otomatis terbaca saat bot dijalankan. **Tidak perlu edit file lain.**

---

## 📦 Dependensi

```json
{
  "@whiskeysockets/baileys": "npm:socketon@latest",
  "pino": "^8.21.0"
}
```

Node.js native `fetch` digunakan untuk AI API (Node.js 18+).

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Sesi expired | Hapus folder `/session` dan jalankan ulang |
| Pairing code gagal | Pastikan nomor format internasional (628xxx) |
| Bot tidak merespons | Cek apakah bot sudah login penuh |
| AI tidak menjawab | Cek koneksi internet & API endpoint |
| Promosi tidak terkirim | Pastikan `.antipromosi on` & sudah `.setpromositime` |

---

## 📌 Catatan

- Sesi tersimpan di folder `/session` — jangan dihapus kecuali mau reset
- Database tersimpan di `database/database.json`
- Timer promosi akan restart otomatis setelah bot reconnect
- Minimal interval promosi: **10 detik** (anti-spam)
