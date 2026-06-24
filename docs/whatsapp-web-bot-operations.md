# Operasional Bot WhatsApp Web HIJAOE

## Prasyarat

- Node.js 24.
- Chrome atau Chromium.
- Nomor WhatsApp Business HIJAOE `085121508159`.
- Saldo API DeepSeek.
- Google Sheet dan folder Google Drive yang sudah dibagikan ke email service account.

Bot ini memakai `whatsapp-web.js`, bukan WhatsApp Cloud API resmi. Hindari broadcast,
spam, dan pesan yang dimulai bot. Bot hanya membalas pelanggan yang lebih dulu mengirim
pesan.

## Memastikan Nomor Tidak Terikat Cloud API

Nomor `085121508159` harus aktif di aplikasi WhatsApp Business dan tidak boleh masih
terdaftar sebagai nomor produksi WhatsApp Cloud API Meta. Jika sebelumnya pernah
ditambahkan ke Cloud API, hapus nomor produksi tersebut dari Pengelola WhatsApp Meta,
lalu daftarkan kembali di aplikasi WhatsApp Business sebelum memindai QR bot.

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi variabel berikut:

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`
- `HIJAOE_BUSINESS_NUMBER`
- `BOT_TAKEOVER_HOURS`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_TAB_NAME`
- `GOOGLE_DRIVE_FOLDER_ID`

Simpan `GOOGLE_SERVICE_ACCOUNT_JSON` sebagai JSON satu baris. Jangan menambahkan file
JSON service account ke folder yang dilacak Git.

Jangan menaruh token atau JSON service account di source code, dokumentasi, atau Git.

## Menyiapkan Google Sheet dan Drive

1. Buat tab Sheet bernama `Leads`.
2. Bagikan Sheet sebagai editor ke `client_email` dari service account.
3. Buat satu folder Drive khusus foto pelanggan.
4. Bagikan folder itu sebagai editor ke service account.
5. Masukkan ID Sheet dan ID folder ke `.env`.

Kolom Sheet yang digunakan adalah A sampai N: waktu, status, nama, WhatsApp, layanan,
lokasi, ukuran, bahan/model, target waktu, email, ringkasan, alasan handoff, tautan
folder/foto, dan sumber.

## Menjalankan Pertama Kali

```powershell
npm.cmd install
npm.cmd run bot:start
```

QR akan muncul di terminal. Buka WhatsApp Business pada nomor `085121508159`, pilih
perangkat tertaut, lalu pindai QR. Session tersimpan di `.wwebjs_auth` dan tidak perlu
dipindai ulang selama session masih valid.

## Perilaku Admin Ambil Alih

Balasan manual dari aplikasi WhatsApp Business atau WhatsApp Web menghentikan AI hanya
untuk chat tersebut selama 24 jam. Setelah 24 jam bot tidak mengirim pesan tanpa
pesan baru. Bot aktif kembali ketika pelanggan mengirim pesan berikutnya. Jika chat
sebelumnya sudah masuk tahap handoff, pesan baru tersebut memulai pencatatan kebutuhan
yang baru.

## Pemeriksaan Lokal

Gunakan nomor internal lain:

1. Kirim `Halo`.
2. Jawab pertanyaan nama, pekerjaan, lokasi, ukuran, bahan, target waktu, dan foto.
3. Konfirmasi ringkasan.
4. Pastikan satu baris masuk ke Sheet dan foto masuk ke Drive.
5. Balas manual dari akun bisnis.
6. Kirim pesan pelanggan lagi dan pastikan AI diam selama takeover.

Status lokal:

```powershell
npm.cmd run bot:status
```

Log launcher berada di `logs\whatsapp-bot\stdout.log` dan
`logs\whatsapp-bot\stderr.log`. Log tidak boleh berisi token atau isi lengkap chat.

Sinkronisasi Google yang gagal dicoba kembali paling banyak delapan kali dengan jeda
bertambah. Setelah batas tercapai, lead tetap tersimpan berstatus pending di SQLite
dan log mencatat `retry_exhausted`; perbaiki konfigurasi Google sebelum memprosesnya
kembali.

## Menjalankan Saat Login Windows

Setelah smoke test berhasil:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-whatsapp-bot-startup.ps1
Get-ScheduledTask -TaskName 'HIJAOE WhatsApp Bot'
```

Untuk menghentikan bot:

```powershell
Unregister-ScheduledTask -TaskName 'HIJAOE WhatsApp Bot' -Confirm:$false
```

Hentikan proses Node yang sedang berjalan setelah task dihapus.

## Menonaktifkan AI Sementara

Hapus scheduled task dengan perintah di atas, lalu hentikan proses Node yang menjalankan
`assistant/bot/main.js`. Riwayat chat WhatsApp tetap ada di aplikasi WhatsApp Business.
Menjalankan kembali `npm.cmd run bot:start` mengaktifkan bot dengan state SQLite yang
tersimpan.

## Pemulihan Session

Jika WhatsApp logout, hentikan proses, hapus `.wwebjs_auth`, lalu jalankan
`npm.cmd run bot:start` dan pindai QR baru. Jangan menghapus database SQLite jika ingin
mempertahankan state percakapan, deduplikasi, retry, dan takeover.

## Backup

Hentikan bot sebelum backup. Salin:

- `data\whatsapp-bot\session.sqlite`
- `.wwebjs_auth`

Simpan backup secara terenkripsi. Folder ini berisi session dan data operasional yang
tidak boleh dipublikasikan.

## Migrasi VPS

Gunakan VPS Linux dengan Node.js 24, Chromium, minimal RAM 2 GB, storage persisten,
dan service `systemd`. Salin backup terenkripsi setelah proses lokal berhenti. Simpan
semua secret sebagai environment service, bukan file yang masuk Git.

## Batasan

- Integrasi WhatsApp Web tidak resmi dan nomor tetap dapat dibatasi atau diblokir.
- WhatsApp dapat mengubah format ID chat. Bot mendukung ID telepon `@c.us` dan ID
  privat `@lid` yang digunakan WhatsApp Web terbaru.
- Jangan mengirim pesan massal atau memulai promosi otomatis.
- DeepSeek hanya merapikan balasan deterministik. Harga, diskon, janji jadwal, dan
  kepastian pengerjaan tetap harus dijawab admin.
- Foto disimpan privat; kode tidak membuat permission publik pada Drive.
