# Website HIJAOE

Website satu halaman untuk HIJAOE, usaha konstruksi, las, aluminium, interior, eksterior, dan furnitur custom di Makassar.

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
- Data galeri

Konten yang belum terkonfirmasi, seperti harga, garansi, jumlah proyek, dan lama pengalaman, sengaja tidak ditampilkan.

## Mengganti Foto

Semua gambar sementara berada di `assets/images/`:

- `hijaoe-workshop.webp`
- `project-construction.webp`
- `project-metalwork.webp`
- `project-aluminium.webp`
- `project-roofing.webp`
- `project-interior.webp`

Ganti file dengan foto asli memakai nama yang sama agar tidak perlu mengubah kode. Gunakan gambar WebP dengan orientasi lanskap. Rekomendasi:

- Hero: lebar sekitar 1600 px
- Foto kategori: lebar sekitar 960 px
- Ukuran file: kurang dari 350 KB

Gambar yang tersedia saat ini merupakan visual buatan AI dan ditandai sebagai **Inspirasi kategori**. Jangan menampilkannya sebagai dokumentasi proyek HIJAOE. Setelah foto asli tersedia, ubah teks galeri dan keterangan gambar di `assets/js/site-data.js`.

## Struktur

- `index.html`: struktur halaman dan metadata
- `assets/css/styles.css`: tampilan modern-industrial dan layout responsif
- `assets/js/site-data.js`: data bisnis
- `assets/js/render.js`: renderer komponen
- `assets/js/main.js`: inisialisasi dan interaksi halaman
- `tests/`: pengujian data serta renderer
