# Rancangan Katalog Layanan HIJAOE

## Tujuan

Menambahkan halaman katalog visual yang memperlihatkan cakupan pekerjaan HIJAOE secara lebih lengkap. Katalog membantu calon pelanggan memahami jenis pesanan yang dapat dibuat, memilih layanan yang mendekati kebutuhannya, lalu menanyakannya melalui WhatsApp.

## Struktur Konten

Katalog berisi 50 gambar, dibagi rata menjadi lima kategori:

1. Konstruksi & Renovasi: 10 gambar.
2. Besi & Las: 10 gambar.
3. Aluminium & Kaca: 10 gambar.
4. Atap & Plafon: 10 gambar.
5. Interior & Furnitur: 10 gambar.

Setiap gambar menampilkan jenis pekerjaan yang berbeda. Tidak ada pengulangan objek yang hanya dibedakan warna atau sudut pengambilan.

## Daftar Layanan Visual

### Konstruksi & Renovasi

- Renovasi fasad rumah.
- Penambahan teras.
- Gudang rangka besi.
- Mezanin toko.
- Bangunan tambahan rumah.
- Pemasangan keramik.
- Pekerjaan pondasi dan cor.
- Renovasi ruang usaha.
- Pengecatan eksterior.
- Pembangunan rumah sederhana.

### Besi & Las

- Pagar geser besi.
- Pagar laser cutting.
- Teralis jendela.
- Railing tangga.
- Tangga besi.
- Rak gudang.
- Ranjang besi.
- Dudukan tandon.
- Gerobak atau booth besi.
- Rangka papan nama.

### Aluminium & Kaca

- Lemari aluminium.
- Jendela aluminium.
- Pintu aluminium.
- Kusen aluminium.
- Etalase aluminium dan kaca.
- Storefront toko.
- Partisi kaca.
- Pintu lipat aluminium dan kaca.
- Pintu kamar mandi aluminium.
- Kawat nyamuk aluminium.

### Atap & Plafon

- Kanopi alderon.
- Kanopi polikarbonat.
- Kanopi spandek.
- Kanopi membran.
- Rangka atap baja ringan.
- Plafon PVC.
- Plafon gypsum.
- Talang air.
- Pergola besi.
- Carport beratap.

### Interior & Furnitur

- Kitchen set aluminium.
- Kabinet dapur aluminium.
- Rak piring aluminium.
- Rak sepatu aluminium.
- Meja sekolah.
- Kursi sekolah.
- Meja rangka besi.
- Rak display toko.
- Wall panel.
- Booth atau kios usaha.

## Halaman Utama

- Galeri pilihan di halaman utama menampilkan enam gambar unggulan.
- Tambahkan tombol `Lihat semua pekerjaan` menuju `galeri.html`.
- Navigasi `Proyek` tetap menggulir ke galeri pilihan di halaman utama.
- Tautan katalog ditambahkan pada navigasi desktop dan seluler.

## Halaman Katalog

- Header dan footer konsisten dengan halaman utama.
- Judul utama: `Katalog Layanan HIJAOE`.
- Pengantar singkat menjelaskan bahwa gambar digunakan untuk menunjukkan jenis pekerjaan yang dapat dipesan.
- Filter kategori: Semua, Konstruksi, Besi & Las, Aluminium & Kaca, Atap & Plafon, Interior & Furnitur.
- Dua belas item pertama dimuat pada awal halaman.
- Tombol `Muat lebih banyak` menambahkan dua belas item berikutnya yang sesuai filter.
- Setiap item berisi gambar, kategori, nama layanan, dan tombol `Tanyakan layanan ini`.
- Tombol pertanyaan membuka WhatsApp dengan nama layanan yang sudah dimasukkan ke pesan.
- Klik gambar membuka lightbox dengan gambar besar, nama layanan, dan tombol WhatsApp.
- Lightbox dapat ditutup melalui tombol tutup, klik latar, atau tombol Escape.

## Gaya Visual

- Mengikuti gaya modern-industrial website utama.
- Grid stabil dengan rasio gambar konsisten.
- Filter menggunakan kontrol tersegmentasi yang dapat bergeser horizontal pada ponsel.
- Katalog tidak menggunakan kartu bertumpuk atau elemen dekoratif yang tidak membantu pemilihan layanan.
- Gambar dimuat secara lazy dan dikompres ke WebP agar 50 aset tidak menghambat halaman awal.

## Kejujuran Konten

- Visual AI digunakan sebagai katalog jenis layanan, bukan bukti proyek tertentu.
- Tidak menampilkan klaim bahwa gambar adalah dokumentasi pelanggan atau lokasi proyek HIJAOE.
- Foto asli dapat menggantikan aset katalog satu per satu tanpa mengubah struktur halaman.

## Verifikasi

- Pastikan tepat 50 item dan 10 item per kategori.
- Pastikan setiap nama layanan unik.
- Uji filter pada desktop dan ponsel.
- Uji pemuatan bertahap sampai seluruh item terlihat.
- Uji lightbox, Escape, tombol tutup, dan klik latar.
- Uji pesan WhatsApp membawa nama layanan yang dipilih.
- Pastikan tidak ada overflow horizontal atau kontrol tetap yang menutupi konten.
- Pastikan seluruh gambar merespons HTTP 200 dan tidak menghasilkan error browser.
