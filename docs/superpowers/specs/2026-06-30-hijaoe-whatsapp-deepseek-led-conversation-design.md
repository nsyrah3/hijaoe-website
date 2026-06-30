# Desain Percakapan WhatsApp DeepSeek-Led HIJAOE

## Tujuan

Membuat bot WhatsApp HIJAOE terasa lebih seperti admin manusia. Bot tidak lagi mengikuti template pertanyaan satu per satu secara kaku. DeepSeek membaca konteks percakapan, menulis balasan natural, dan mengisi data lead terstruktur. Program tetap menjaga batas bisnis, penyimpanan state, retry, sinkronisasi Google, takeover manual, dan idempotensi.

## Masalah Saat Ini

Conversation engine masih terlalu kaku. Ketika pelanggan mengirim beberapa pesan beruntun, bot memproses satu pesan sebagai satu jawaban field. Akibatnya bot mudah salah paham, cepat handoff, dan tidak mengimbangi gaya chat manusia.

## Keputusan Desain

Arsitektur baru memakai DeepSeek sebagai pengelola percakapan, tetapi bukan sumber keputusan bisnis tanpa validasi.

DeepSeek bertugas:

- memahami beberapa pesan pelanggan yang masuk beruntun;
- membalas dengan gaya admin WhatsApp HIJAOE;
- mengekstrak data lead yang sudah disebut pelanggan;
- memilih pertanyaan lanjutan yang paling masuk akal;
- memberi sinyal saat lead sudah cukup untuk dikonfirmasi;
- memberi sinyal saat harus handoff ke admin.

Program tetap bertugas:

- menggabungkan pesan beruntun sebelum memanggil DeepSeek;
- menyimpan session dan field lead;
- menolak output harga, kisaran biaya, diskon, atau janji jadwal;
- menjaga agar bot tidak mengirim pesan massal atau memulai chat;
- mendeteksi takeover manual;
- menyimpan lead ke SQLite, Sheets, dan foto ke Drive;
- memberi konteks "foto diterima" ke DeepSeek walaupun upload Drive gagal;
- fallback saat DeepSeek gagal.

## Buffer Pesan

Bot menunggu 7 detik sebelum membalas pesan pelanggan. Jika pelanggan mengirim 2-3 pesan beruntun dalam jeda itu, pesan digabung menjadi satu batch konteks. Setiap pesan tetap dicatat sebagai processed message agar tidak diproses ulang.

Jika pesan berikutnya datang sebelum timer selesai, timer diperpanjang 7 detik dari pesan terbaru. Bot hanya mengirim satu balasan untuk batch terakhir.

## Session DeepSeek-Led

Session tetap memakai nomor WhatsApp sebagai kunci. Bentuk data konseptualnya:

```text
state: active | confirming | handoff | closed
data:
  name
  service
  location
  dimensions
  material
  targetTime
  photoReferences
  email
  emailMarketingConsent
historySummary
handoffReason
completed
introShown
```

`historySummary` adalah ringkasan singkat non-rahasia untuk membantu DeepSeek memahami percakapan tanpa menyimpan seluruh chat panjang di prompt.

`introShown` menandai apakah pelanggan sudah mendapat pembuka transparan bahwa percakapan dibantu asisten digital atau AI agent HIJAOE untuk mencatat kebutuhan. Intro hanya dipakai pada balasan DeepSeek pertama, lalu tidak diulang.

## Output DeepSeek

DeepSeek harus membalas JSON valid:

```json
{
  "reply": "teks yang dikirim ke pelanggan",
  "dataPatch": {
    "name": "",
    "service": "",
    "location": "",
    "dimensions": "",
    "material": "",
    "targetTime": "",
    "photoReferences": "",
    "email": "",
    "emailMarketingConsent": ""
  },
  "state": "active",
  "readyToConfirm": false,
  "handoff": false,
  "handoffReason": "",
  "historySummary": ""
}
```

Program hanya menerima field yang dikenal. Field kosong tidak menghapus data lama kecuali DeepSeek secara eksplisit memakai `null` untuk field opsional yang boleh dikosongkan.

## Aturan Balasan

Balasan harus:

- bahasa Indonesia natural seperti admin WhatsApp;
- singkat dan tidak terlalu formal;
- pada balasan pertama, transparan bahwa chat dibantu asisten digital atau AI agent HIJAOE yang mencatat kebutuhan pelanggan;
- setelah intro pertama, tidak mengulang penjelasan AI/asisten digital;
- menyesuaikan jika pelanggan mengirim beberapa pesan sekaligus;
- mengisi `dataPatch` dengan semua info yang sudah jelas dari chat: layanan, lokasi, ukuran, material, waktu target, referensi foto, nama, email, dan persetujuan marketing;
- tidak menanyakan ulang data yang sudah jelas disebut pelanggan;
- bertanya maksimal satu hal utama ketika data masih kurang;
- boleh minta foto kalau relevan, tetapi tidak memaksa;
- jika foto sudah diterima, tidak boleh meminta foto lagi dan harus mengakui foto itu sebagai referensi;
- menampilkan ringkasan saat data cukup dan meminta konfirmasi pelanggan.

Balasan tidak boleh:

- memberi harga, kisaran harga, biaya, diskon, DP, atau angka rupiah;
- menjanjikan kepastian survei, produksi, pemasangan, atau tanggal selesai;
- membuat klaim stok/ketersediaan bahan;
- mengarang ukuran standar, angka dimensi, atau ukuran teknis yang tidak pernah disebut pelanggan;
- memberi keputusan struktur atau keselamatan;
- menyebut bot, robot, template, otomasi, atau proses internal.

Jika pelanggan bertanya harga, negosiasi, komplain, atau meminta jadwal pasti, bot handoff ke admin dengan balasan aman. Jika pelanggan meminta bot menentukan ukuran atau detail teknis, bot tidak menentukan sendiri; bot mencatat referensi dan menyampaikan bahwa admin HIJAOE akan menyesuaikan ukuran dari model dan kebutuhan.

## Lead dan Konfirmasi

Lead hanya disinkronkan ke Google Sheets setelah pelanggan mengonfirmasi ringkasan. DeepSeek boleh memilih kapan data sudah cukup, tetapi program tetap memeriksa minimal:

- service terisi;
- location terisi;
- name terisi atau pelanggan sudah memberi identitas yang cukup.

Jika data belum cukup, bot lanjut bertanya natural. Nama tidak harus ditanya di awal.

## Fallback

Jika DeepSeek gagal, timeout, JSON tidak valid, atau output melanggar guardrail, bot mengirim fallback pendek:

```text
Maaf Kak, boleh dikirim ulang singkat kebutuhannya? Nanti saya catat untuk admin.
```

Jika pelanggaran berupa harga, jadwal pasti, komplain, atau permintaan admin, bot handoff:

```text
Siap Kak, untuk bagian itu saya teruskan ke admin HIJAOE biar dicek langsung.
```

## Pengujian

Test yang dibutuhkan:

- dua atau tiga pesan cepat digabung menjadi satu balasan;
- DeepSeek bisa mengisi beberapa field dari satu pesan bebas;
- bot tidak menanyakan ulang field yang sudah diekstrak;
- bot memberi intro transparan sekali dan tidak mengulanginya;
- foto dengan upload Drive gagal tetap masuk ke DeepSeek sebagai foto diterima;
- output yang meminta foto ulang setelah foto diterima ditolak;
- output yang mengarang ukuran standar atau angka dimensi tanpa input pelanggan ditolak;
- output harga atau janji jadwal ditolak;
- output yang menyebut bot/template/otomasi ditolak;
- lead hanya sync setelah konfirmasi;
- handoff tetap diam sampai takeover selesai atau session reset;
- fallback berjalan saat JSON DeepSeek rusak;
- semua test lama untuk WhatsApp adapter, store, sync, privacy, dan website tetap lulus.

## Kriteria Selesai

- Bot membalas satu batch pesan cepat dengan satu jawaban natural.
- Bot tidak lagi mengikuti urutan field template secara kaku.
- DeepSeek mengelola wording dan ekstraksi data lead.
- Program tetap mencegah harga, estimasi selesai, dan klaim berisiko.
- Google Sheets dan Drive tetap menerima lead/foto seperti sebelumnya.
- Semua test otomatis lulus.
