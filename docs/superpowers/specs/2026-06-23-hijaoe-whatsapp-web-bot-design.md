# Desain Bot WhatsApp Web HIJAOE

## Tujuan

Membuat bot WhatsApp untuk nomor HIJAOE `085121508159` yang hanya membalas setelah pelanggan mengirim pesan. Percakapan dan balasan bot tetap terlihat di aplikasi WhatsApp Business sehingga admin dapat membaca riwayat dan mengambil alih percakapan secara manual.

Bot berjalan secara lokal di Windows selama 24 jam ketika komputer menyala. Arsitekturnya harus dapat dipindahkan ke VPS Linux tanpa mengubah perilaku percakapan.

## Batasan Platform

Implementasi memakai otomasi WhatsApp Web yang tidak resmi. Pendekatan ini dipilih karena memenuhi kebutuhan melihat chat dan mengambil alih percakapan melalui aplikasi WhatsApp Business tanpa biaya bulanan penyedia Coexistence.

Risiko pembatasan nomor, logout, atau perubahan kompatibilitas WhatsApp tidak dapat dihilangkan. Bot tidak boleh mengirim pesan massal, menghubungi pelanggan lebih dahulu, atau melakukan aktivitas pemasaran otomatis.

## Keputusan Utama

- Library WhatsApp yang dipakai adalah `whatsapp-web.js`.
- Nomor operasional adalah `085121508159` atau `6285121508159`.
- Nomor didaftarkan di aplikasi WhatsApp Business dan bot ditautkan sebagai perangkat melalui QR.
- Website tetap berjalan di Cloudflare Pages dan hanya mengarahkan pelanggan ke WhatsApp.
- Bot berjalan sebagai aplikasi Node.js terpisah dari website.
- Bot aktif 24 jam selama komputer menyala dan dimulai otomatis bersama Windows.
- State percakapan, idempotensi, antrean retry, dan takeover disimpan di SQLite.
- Lead disimpan ke Google Sheets.
- Foto pelanggan disimpan ke Google Drive dan tautannya dicatat di Google Sheets.
- DeepSeek dipakai untuk memahami bahasa bebas dan membantu merangkai balasan. Alur, batasan, dan keputusan handoff tetap dikendalikan program.

## Arsitektur

### WhatsApp Web Adapter

Adapter memakai `whatsapp-web.js` dan autentikasi lokal persisten. Tanggung jawabnya:

- menampilkan QR ketika sesi belum tersedia atau sudah tidak berlaku;
- memulihkan sesi setelah restart;
- menerima chat pribadi baru;
- mengabaikan grup, status, broadcast, panggilan, dan pesan lama;
- mengunduh media yang didukung;
- mengirim balasan teks;
- membedakan balasan bot dengan balasan manual dari perangkat admin;
- meneruskan event koneksi dan logout ke logger yang aman.

Pesan keluar yang dibuat bot dicatat sebelum dikirim atau segera setelah WhatsApp memberikan message ID. Event pesan keluar yang tidak dikenal sebagai pesan bot dianggap sebagai balasan manual admin.

### Conversation Engine

Conversation engine yang sudah ada tetap menjadi sumber aturan utama. Mesin ini:

- menyimpan state dan data yang sudah terkumpul;
- mengajukan satu pertanyaan per pesan;
- menjawab FAQ yang disetujui;
- melarang pemberian harga dan kepastian jadwal;
- memicu handoff;
- membuat ringkasan lead;
- tetap dapat memberi balasan dasar saat DeepSeek gagal.

### DeepSeek Adapter

DeepSeek membantu memahami jawaban bebas, mengklasifikasikan kebutuhan, dan membuat bahasa balasan lebih natural. Output model divalidasi sebelum digunakan. Model tidak boleh menentukan harga, menjanjikan jadwal, atau mengubah state tanpa validasi conversation engine.

Kredensial DeepSeek hanya tersedia pada proses backend lokal melalui environment variable.

### SQLite Repository

SQLite menjadi penyimpanan operasional lokal agar state bertahan setelah restart dan mudah dipindahkan ke VPS. Tabel konseptualnya:

```text
contacts
sessions
processed_messages
outbound_bot_messages
manual_takeovers
leads
media_uploads
retry_jobs
```

Nomor WhatsApp menjadi kunci kontak. Message ID menjadi kunci idempotensi. Timestamp disimpan dalam UTC dan ditampilkan dalam zona waktu Asia/Makassar.

### Google Sheets dan Drive

Google API memakai service account dengan akses minimum ke satu spreadsheet dan satu folder Drive khusus HIJAOE.

Google Sheets menyimpan lead yang telah dikonfirmasi. Kolom utamanya:

```text
created_at
status
customer_name
whatsapp_number
service_type
location
dimensions
material_or_style
target_time
email
conversation_summary
handoff_reason
drive_folder_url
photo_urls
source
```

Setiap pelanggan atau lead mempunyai folder Drive tersendiri. Nama file dibuat oleh sistem dan tidak memakai nama file kiriman pelanggan secara langsung. Tautan folder dan foto dicatat ke Sheets.

## Alur Pesan

1. Pelanggan mengirim chat pribadi ke HIJAOE.
2. Adapter memeriksa jenis chat, timestamp, message ID, dan status takeover.
3. Pesan duplikat, grup, broadcast, status, dan pesan lama dihentikan.
4. Media foto diunggah ke Google Drive. Metadatanya disimpan di SQLite.
5. Pesan diteruskan ke conversation engine.
6. Bila diperlukan, teks yang sudah dibersihkan dianalisis oleh DeepSeek.
7. Conversation engine menentukan state berikutnya dan balasan yang diizinkan.
8. Balasan dikirim melalui WhatsApp Web dan message ID-nya dicatat sebagai pesan bot.
9. Setelah pelanggan mengonfirmasi ringkasan, lead disimpan di SQLite lalu disinkronkan ke Sheets.
10. Jika sinkronisasi eksternal gagal, job retry disimpan dan dijalankan kembali dengan jeda bertambah.

## Alur Percakapan Pelanggan

Bot memperkenalkan diri sebagai `Asisten HIJAOE`, memakai sapaan `Kak`, dan menjelaskan bahwa admin manusia akan melanjutkan bila diperlukan.

Data dikumpulkan satu per satu:

1. Nama pelanggan.
2. Pekerjaan atau barang yang dibutuhkan.
3. Lokasi pengerjaan atau pengiriman.
4. Ukuran awal.
5. Bahan, model, atau referensi.
6. Target waktu.
7. Foto lokasi atau referensi.
8. Email opsional.

Setelah data cukup, bot menampilkan ringkasan dan meminta konfirmasi. Lead hanya dianggap lengkap setelah pelanggan mengonfirmasinya.

Bot boleh menjawab jenis layanan, area layanan, jam operasional, lokasi bengkel, dan cara mengirim ukuran atau foto. Bot tidak boleh memberi harga, rentang harga, kepastian survei, kepastian produksi, kepastian pemasangan, atau keputusan keselamatan struktur.

## Handoff dan Takeover Manual

Handoff langsung terjadi ketika:

- pelanggan meminta manusia atau admin;
- pelanggan menanyakan harga atau bernegosiasi;
- pelanggan menyampaikan komplain;
- pelanggan meminta kepastian jadwal;
- bot gagal memahami dua jawaban berturut-turut;
- data awal sudah lengkap dan dikonfirmasi.

Pada status handoff, bot mengirim satu pesan penutup lalu berhenti membalas sampai ada tindakan admin atau sesi dibuka kembali.

Setiap pesan manual yang dikirim admin melalui aplikasi WhatsApp Business memulai takeover selama 24 jam untuk kontak tersebut. Pesan manual berikutnya mengatur ulang masa 24 jam dari waktu pesan terbaru. Pesan yang dikirim bot tidak boleh memicu takeover.

Setelah 24 jam berakhir, bot hanya aktif kembali ketika pelanggan mengirim pesan baru. Bot tidak mengirim pesan otomatis saat timer berakhir.

## Operasional Windows dan VPS

Pada Windows, bot dijalankan melalui task startup yang memulai proses Node.js tanpa perlu membuka terminal manual. Session WhatsApp, database, dan log disimpan di direktori data lokal yang tidak dilacak Git.

Status dasar yang harus tersedia:

- proses hidup atau mati;
- WhatsApp tersambung, menunggu QR, atau logout;
- waktu pesan terakhir;
- jumlah retry tertunda;
- DeepSeek, Sheets, dan Drive siap atau gagal.

Saat dipindahkan ke VPS, proses yang sama dijalankan sebagai service Linux. Direktori session dan database dipindahkan secara aman. VPS yang memakai Chromium harus menyediakan setidaknya sekitar 2 GB RAM.

## Konfigurasi dan Rahasia

Konfigurasi lokal disimpan melalui environment variables dan file `.env` yang diabaikan Git. Nilai rahasia meliputi:

```text
DEEPSEEK_API_KEY
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_DRIVE_FOLDER_ID
```

Direktori autentikasi WhatsApp, SQLite, media sementara, log, dan file kredensial tidak boleh masuk GitHub atau Cloudflare Pages.

## Penanganan Kegagalan

- Jika DeepSeek gagal atau timeout, conversation engine memakai balasan deterministik dan mempertahankan state saat ini.
- Jika Sheets atau Drive gagal, data tetap tersimpan di SQLite dan masuk antrean retry.
- Retry memakai batas percobaan dan jeda bertambah agar tidak membanjiri API.
- Jika WhatsApp terputus sementara, adapter mencoba reconnect dengan jeda.
- Jika sesi logout permanen, bot berhenti mengirim dan meminta QR baru.
- Jika komputer mati, aplikasi WhatsApp Business tetap dapat dipakai manual. Pesan diproses kembali setelah bot hidup hanya jika masih memenuhi batas umur pesan yang ditentukan.
- Pesan duplikat tidak boleh menghasilkan balasan, upload, atau lead ganda.
- Log hanya menyimpan event operasional dan error yang sudah disanitasi, bukan kredensial atau isi chat lengkap.

## Keamanan dan Privasi

- Bot hanya membalas percakapan yang dimulai pelanggan.
- Tidak ada pengiriman massal atau scraping kontak.
- API key dan service account hanya tersedia di backend lokal.
- Teks yang dikirim ke DeepSeek dibersihkan dari nomor WhatsApp, email, dan metadata file bila tidak diperlukan.
- Folder Drive dan spreadsheet hanya dibagikan kepada akun operasional HIJAOE.
- File media sementara dihapus setelah upload berhasil atau setelah masa retensi gagal upload berakhir.
- Input pelanggan, tipe media, ukuran file, dan output model divalidasi.

## Pengujian

### Otomatis

- transisi state dan koreksi jawaban;
- larangan harga dan janji jadwal;
- idempotensi message ID;
- pembedaan pesan bot dan pesan manual;
- takeover 24 jam dan perpanjangannya;
- aktivasi kembali hanya setelah pesan pelanggan baru;
- retry Sheets dan Drive;
- fallback DeepSeek;
- sanitasi log dan payload model.

### Integrasi Lokal

- QR login dan pemulihan session;
- menerima dan membalas chat pribadi;
- mengabaikan grup, status, broadcast, dan pesan lama;
- menerima foto, upload Drive, dan pencatatan Sheets;
- takeover dari aplikasi WhatsApp Business;
- restart proses dan restart Windows;
- logout serta login ulang.

### Uji Terbatas

Peluncuran awal hanya memakai nomor internal sebagai pelanggan. Bot baru dibuka ke pelanggan umum setelah alur normal, handoff, takeover, foto, restart, dan kegagalan API berhasil diuji.

## Kriteria Selesai

- Chat dan balasan bot terlihat di aplikasi WhatsApp Business.
- Admin dapat membalas manual dari aplikasi yang sama.
- Balasan manual menghentikan AI selama 24 jam untuk kontak tersebut.
- Bot tidak mengirim pesan saat timer takeover selesai; bot menunggu pesan pelanggan berikutnya.
- State percakapan bertahan setelah restart.
- Lead terkonfirmasi masuk sekali ke Google Sheets.
- Foto tersimpan di Google Drive dan tertaut dari Sheets.
- Bot tidak memberi harga atau menjanjikan jadwal.
- Bot otomatis berjalan saat Windows menyala.
- Semua kredensial, session, database, dan media lokal tidak masuk GitHub.
