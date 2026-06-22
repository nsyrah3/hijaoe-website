# Website HIJAOE

Website HIJAOE untuk usaha konstruksi, las, aluminium, interior, eksterior, dan furnitur custom di Makassar. Website terdiri dari halaman utama dan katalog 60 jenis layanan.

## Menjalankan Website

```powershell
npm.cmd install
npm.cmd test
npm.cmd run serve -- --listen 4173
```

Buka `http://localhost:4173`.

## Memperbarui Informasi

Edit `assets/js/site-data.js` untuk mengubah:

- Nomor WhatsApp
- Jam operasional
- Tautan Google Maps
- Daftar layanan
- Tahapan pemesanan
- Area pelayanan

Konten yang belum terkonfirmasi, seperti harga, garansi, jumlah proyek, dan lama pengalaman, sengaja tidak ditampilkan.

## Mengelola Katalog

Data katalog berada di `assets/js/catalog-data.js`. Setiap layanan memiliki `id`, judul, kategori, path gambar, dan teks alternatif. Nama file gambarnya mengikuti `id`, misalnya:

```js
{
  id: "lemari-aluminium",
  image: "assets/images/catalog/lemari-aluminium.webp",
}
```

Semua gambar katalog berada di `assets/images/catalog/`. Untuk mengganti satu visual dengan foto asli:

1. Pilih foto yang sesuai dengan jenis layanannya.
2. Ubah ke WebP berorientasi lanskap.
3. Gunakan nama file yang sama, misalnya `lemari-aluminium.webp`.
4. Ganti file lama tanpa perlu mengubah kode.

Rekomendasi gambar katalog: lebar 960 px dan ukuran kurang dari 250 KB.

Untuk menambah layanan tanpa mengubah struktur saat ini, tambahkan satu item pada setiap kategori agar jumlahnya tetap seimbang, siapkan file WebP dengan `id` yang sama, lalu jalankan `npm.cmd test`. Untuk menghapus layanan, hapus jumlah item yang sama dari setiap kategori dan pastikan ID yang dihapus tidak masih tercantum di `featuredCatalogIds`.

Tes saat ini mengharuskan 60 layanan dengan 10 item per kategori. Jika jumlah atau keseimbangan kategori memang sengaja diubah, perbarui kontrak di `tests/catalog-data.test.js` bersama perubahan datanya.

Visual katalog yang tersedia saat ini dibuat dengan AI untuk menggambarkan jenis layanan yang dapat dipesan. Visual tersebut bukan dokumentasi proyek pelanggan HIJAOE. Ganti dengan foto asli secara bertahap ketika dokumentasi pekerjaan sudah tersedia.

## SEO Lokal

Domain utama website adalah `https://hijaoe.id`. Halaman layanan di `layanan/`, `sitemap.xml`, dan `robots.txt` dibuat dari data terstruktur di `assets/js/seo-pages-data.js`.

Setelah mengubah judul, deskripsi, isi layanan, FAQ, gambar, atau daftar halaman SEO, jalankan:

```powershell
npm.cmd run seo:generate
npm.cmd test
```

Jangan mengedit file HTML di `layanan/` secara manual karena hasilnya akan ditimpa oleh generator. Setiap halaman wajib memakai teks yang spesifik, tautan internal yang relevan, dan klaim bisnis yang dapat dibuktikan. Harga, garansi, testimoni, jumlah proyek, dan lama pengalaman tidak boleh ditambahkan sebelum datanya dikonfirmasi.

Halaman SEO yang tersedia:

- Enam halaman kategori utama untuk konstruksi, las, aluminium, atap, plafon, serta interior
- Delapan halaman kebutuhan prioritas seperti kanopi, pagar besi, pintu dan jendela aluminium, kitchen set, plafon, partisi, renovasi, serta meja dan kursi sekolah
- Halaman utama dan katalog sebagai bagian dari sitemap

Setelah perubahan masuk ke branch produksi dan Cloudflare Pages selesai melakukan deployment:

1. Periksa `https://hijaoe.id/robots.txt` dan `https://hijaoe.id/sitemap.xml`.
2. Tambahkan properti domain `hijaoe.id` ke Google Search Console.
3. Kirim sitemap `https://hijaoe.id/sitemap.xml`.
4. Minta pengindeksan halaman utama dan halaman layanan prioritas melalui pemeriksaan URL.
5. Tambahkan `https://hijaoe.id` ke Profil Bisnis Google HIJAOE setelah profil terverifikasi.

## Mengganti Hero

Gambar hero berada di `assets/images/hijaoe-workshop.webp`. Ganti memakai nama yang sama agar tidak perlu mengubah kode. Rekomendasi: WebP lanskap, lebar sekitar 1600 px, dan ukuran kurang dari 350 KB.

## Struktur

- `index.html`: struktur halaman dan metadata
- `galeri.html`: halaman katalog lengkap
- `assets/css/styles.css`: tampilan modern-industrial dan layout responsif
- `assets/js/site-data.js`: data bisnis
- `assets/js/catalog-data.js`: data 60 layanan katalog
- `assets/js/catalog.js`: filter, batching, kartu, dan tautan WhatsApp katalog
- `assets/js/gallery-page.js`: interaksi halaman katalog dan lightbox
- `assets/js/render.js`: renderer komponen
- `assets/js/main.js`: inisialisasi dan interaksi halaman
- `assets/js/seo-pages-data.js`: sumber konten halaman layanan SEO
- `scripts/generate-seo-pages.js`: generator halaman layanan dan berkas perayapan
- `layanan/`: halaman layanan SEO hasil generator
- `tests/`: pengujian data, renderer, SEO, helper katalog, dan aset

## Simulator Asisten WhatsApp

Tahap pertama Asisten WhatsApp dapat diuji tanpa akun Meta, DeepSeek, atau Google Sheets:

```powershell
npm.cmd run assistant:simulate
```

Simulator memakai alur yang sama dengan integrasi WhatsApp mendatang. Bot mengumpulkan kebutuhan, menjawab FAQ yang telah disetujui, menolak memberi harga atau kepastian jadwal, dan menampilkan data lead setelah pelanggan mengonfirmasi ringkasan.

Mode DeepSeek dapat diuji secara lokal setelah API key tersedia. Jangan masukkan API key ke repository.

```powershell
$env:DEEPSEEK_API_KEY = Read-Host "Tempel API key DeepSeek"
npm.cmd run assistant:simulate:deepseek
```

DeepSeek hanya dipakai untuk menganalisis jawaban bebas pelanggan dan membuat ringkasan internal. Alur pertanyaan, batasan harga, batasan jadwal, dan handoff tetap dikendalikan oleh engine di `assistant/conversation-engine.js`.

Kode simulator berada di `assistant/`. Endpoint diagnostik webhook WhatsApp tersedia di `/api/whatsapp` dan memerlukan `META_WEBHOOK_VERIFY_TOKEN` serta `META_APP_SECRET` sebagai secret Cloudflare. Balasan bot live dan penyimpanan lead eksternal belum aktif pada tahap ini.
