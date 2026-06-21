# Desain Asisten WhatsApp HIJAOE

## Tujuan

Membuat asisten WhatsApp yang ramah untuk menjawab pertanyaan umum, mengumpulkan kebutuhan awal pelanggan, mencatat lead ke Google Sheets, dan menyerahkan percakapan kepada admin HIJAOE. Asisten tidak memberi harga, menjanjikan jadwal, atau menyamar sebagai manusia.

## Keputusan utama

- Kanal utama adalah nomor WhatsApp Business HIJAOE `08976010103`.
- Nama bot yang terlihat adalah `Asisten HIJAOE`.
- Gaya bahasa ramah dan sopan, memakai sapaan `Kak`, kalimat pendek, serta satu pertanyaan per pesan.
- Bot aktif 24 jam. Admin manusia melanjutkan percakapan Senin-Sabtu pukul 08.00-17.00.
- DeepSeek membantu memahami jawaban bebas, memilih jawaban FAQ, dan membuat ringkasan. Alur serta batasan bisnis tetap dikendalikan program.
- Lead yang selesai dicatat ke Google Sheets.
- Implementasi dibagi menjadi simulator dan mesin percakapan, kemudian integrasi layanan eksternal.

## Pendekatan

Sistem memakai pendekatan hybrid. Mesin percakapan menentukan data yang harus dikumpulkan dan pertanyaan berikutnya. DeepSeek hanya mengolah bagian percakapan yang membutuhkan pemahaman bahasa.

Pendekatan ini dipilih karena lebih natural daripada formulir otomatis, tetapi lebih terkendali daripada agent generatif penuh. Jika DeepSeek tidak tersedia, alur dasar tetap berjalan dengan balasan cadangan.

## Alur percakapan

### Pembukaan

Bot membuka percakapan dengan identitas yang jelas:

> Halo, Kak. Saya Asisten HIJAOE. Saya bantu catat kebutuhan awalnya dulu, lalu admin kami akan lanjutkan.

Bot meminta izin untuk menanyakan beberapa hal. Pelanggan dapat meminta admin manusia kapan saja.

### Data kebutuhan

Bot mengumpulkan data berikut secara bertahap:

1. Nama pelanggan.
2. Jenis pekerjaan atau barang yang ingin dibuat.
3. Lokasi pengerjaan atau pengiriman.
4. Ukuran awal yang diketahui.
5. Bahan, model, atau referensi yang diinginkan.
6. Target waktu pengerjaan.
7. Foto lokasi, contoh, atau gambar referensi jika tersedia.
8. Email opsional untuk menerima katalog atau penawaran.
9. Persetujuan terpisah untuk menerima informasi promosi melalui email.

Bot tidak memaksa pelanggan mengisi data opsional. Jawaban seperti `belum tahu` diterima dan dicatat apa adanya.

### Konfirmasi

Setelah data cukup, bot menampilkan ringkasan singkat. Pelanggan dapat mengoreksi ringkasan sebelum lead disimpan.

Contoh penutup:

> Siap, Kak. Sudah saya catat. Admin HIJAOE akan cek kebutuhan dan fotonya dulu sebelum membahas harga serta jadwal.

### Handoff

Handoff terjadi ketika:

- data awal sudah dikonfirmasi;
- pelanggan meminta admin atau manusia;
- pertanyaan menyangkut harga, kepastian jadwal, negosiasi, komplain, atau hal yang tidak dikenali;
- bot gagal memahami dua jawaban berturut-turut.

Bot menandai sesi untuk admin, berhenti mengirim balasan otomatis, dan menyimpan ringkasan percakapan.

## Pertanyaan umum

Bot boleh menjawab informasi yang telah disetujui:

- jenis layanan HIJAOE;
- area Makassar dan sekitarnya;
- pengiriman atau pengerjaan luar area berdasarkan kesepakatan;
- jam operasional;
- lokasi bengkel dan tautan Google Maps;
- permintaan untuk mengirim ukuran atau foto referensi.

Bot tidak boleh:

- memberi angka harga atau rentang harga;
- memastikan tanggal survei, produksi, pemasangan, atau pengiriman;
- menyatakan suatu bahan selalu tersedia;
- memberi nasihat struktur atau keselamatan sebagai keputusan final;
- mengaku sebagai admin manusia.

## State percakapan

Setiap nomor pelanggan memiliki state berikut:

```text
welcome
name
service
location
dimensions
material
target_time
photo
email
marketing_consent
confirmation
handoff
closed
```

Pertanyaan FAQ dapat muncul pada state mana pun. Setelah menjawab FAQ, bot kembali ke pertanyaan pengumpulan data yang belum selesai.

## Komponen sistem

### WhatsApp adapter

- Memverifikasi webhook dari WhatsApp Business Platform.
- Mengubah pesan masuk menjadi format internal.
- Mengirim teks balasan melalui API resmi WhatsApp.
- Mengabaikan event duplikat berdasarkan message ID.

### Conversation engine

- Menyimpan state dan data yang sudah terkumpul.
- Menentukan pertanyaan berikutnya.
- Menegakkan larangan harga dan janji jadwal.
- Menangani perintah handoff.
- Tetap dapat bekerja tanpa DeepSeek.

### DeepSeek adapter

- Mengklasifikasikan maksud pelanggan.
- Memetakan kebutuhan ke kategori layanan HIJAOE.
- Membuat balasan singkat dengan gaya ramah dan sopan.
- Membuat ringkasan kebutuhan yang telah disanitasi.
- Memvalidasi output model sebelum dipakai.
- Menyediakan timeout, retry terbatas, dan fallback deterministik.

### Google Sheets repository

Google Sheets memakai tab berikut:

- `Sessions` untuk state percakapan aktif.
- `Leads` untuk data pelanggan yang sudah dikonfirmasi.
- `ProcessedMessages` untuk message ID yang telah diproses.

Update session memakai nomor WhatsApp sebagai kunci dan nomor versi untuk mencegah update lama menimpa data baru.

### Conversation simulator

Simulator lokal menjalankan mesin percakapan tanpa WhatsApp, DeepSeek, atau Google. Simulator dipakai untuk meninjau kata-kata, state, koreksi data, FAQ, dan handoff sebelum kredensial layanan tersedia.

## Data lead

Kolom utama pada tab `Leads`:

```text
created_at
status
customer_name
whatsapp_number
email
email_marketing_consent
service_type
location
dimensions
material_or_style
target_time
notes
photo_references
conversation_summary
handoff_reason
source
```

Nilai awal `status` adalah `Baru`. Email boleh kosong. `email_marketing_consent` harus bernilai eksplisit `Ya` atau `Tidak`.

## Privasi dan keamanan

- API key Meta, DeepSeek, dan Google hanya disimpan di environment backend.
- Browser dan website statis tidak menerima API key.
- Nama, nomor WhatsApp, email, dan file foto tidak dikirim ke DeepSeek.
- Model hanya menerima teks kebutuhan yang sudah dibersihkan dari data identitas.
- Persetujuan promosi tidak digabung dengan persetujuan konsultasi.
- Log tidak mencetak isi pesan lengkap atau kredensial.
- Endpoint webhook memakai verifikasi Meta dan pembatasan laju.
- Data Google Sheets hanya dapat diakses akun operasional HIJAOE.

## Penanganan kegagalan

- Jika DeepSeek timeout atau menghasilkan output tidak valid, conversation engine memakai balasan cadangan dan melanjutkan state saat ini.
- Jika Google Sheets gagal, lead masuk antrean retry dan admin menerima penanda kegagalan. Bot tidak menyatakan data berhasil dicatat sebelum penyimpanan berhasil.
- Jika WhatsApp menolak pengiriman, sistem menyimpan error beserta message ID tanpa menampilkan kredensial.
- Pesan duplikat tidak membuat lead atau balasan ganda.
- Dua kegagalan pemahaman berturut-turut memicu handoff.

## Integrasi nomor dan admin

Sebelum peluncuran, konfigurasi WhatsApp Business harus diuji untuk memastikan nomor `08976010103` dapat dipakai melalui API dan admin tetap memiliki jalur untuk membalas percakapan. Jika penggunaan aplikasi WhatsApp Business dan API secara bersamaan tidak tersedia untuk akun tersebut, peluncuran ditahan sampai dipilih salah satu solusi:

- migrasi nomor dan memakai inbox yang mendukung API;
- mengaktifkan fitur penggunaan bersama yang tersedia pada akun;
- memakai nomor khusus bot yang berbeda.

Handoff dianggap selesai hanya jika admin dapat melihat ringkasan dan membalas pelanggan dari jalur operasional yang telah diuji.

## Tahap implementasi

### Tahap 1: mesin percakapan dan simulator

- State machine dan aturan bisnis.
- FAQ HIJAOE dari data website.
- Gaya balasan ramah dan sopan.
- Ringkasan serta validasi data.
- Simulator percakapan lokal.
- Pengujian otomatis tanpa kredensial eksternal.

### Tahap 2: integrasi live

- Webhook WhatsApp dan pengiriman pesan.
- DeepSeek adapter dengan sanitasi data.
- Google Sheets untuk sessions, leads, dan idempotensi.
- Deployment HTTPS dan environment secrets.
- Uji nomor, media foto, retry, serta handoff admin.

## Pengujian

- Unit test untuk setiap transisi state.
- Unit test bahwa harga dan janji jadwal selalu memicu handoff.
- Unit test bahwa data identitas tidak masuk payload DeepSeek.
- Unit test untuk koreksi jawaban dan field opsional.
- Integration test untuk webhook verification, message deduplication, dan balasan keluar.
- Integration test untuk kegagalan DeepSeek dan Google Sheets.
- Simulasi percakapan normal, jawaban tidak lengkap, FAQ di tengah alur, permintaan admin, serta koreksi ringkasan.
- Uji live terbatas menggunakan nomor internal sebelum bot menerima pelanggan umum.

## Kriteria selesai

- Percakapan terasa natural dan memakai satu pertanyaan per pesan.
- Semua data wajib dapat dikumpulkan tanpa DeepSeek.
- Bot tidak pernah memberi harga atau memastikan jadwal.
- Lead yang dikonfirmasi muncul satu kali di Google Sheets.
- Email promosi hanya dicatat dengan persetujuan eksplisit.
- Admin dapat menerima handoff dan membalas pelanggan.
- Website tetap membuka nomor WhatsApp HIJAOE yang sama.
