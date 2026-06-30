# Desain Gaya Chat Natural Bot WhatsApp HIJAOE

## Tujuan

Mengubah percakapan bot WhatsApp HIJAOE agar terasa seperti admin bengkel yang sedang mencatat kebutuhan pelanggan, bukan seperti asisten AI. Bot tetap menjaga batasan lama: tidak memberi harga, tidak menjanjikan jadwal, tidak memulai chat, dan tetap handoff ke admin saat dibutuhkan.

## Masalah Saat Ini

Balasan awal menyebut `Saya Asisten HIJAOE` dan langsung menanyakan nama. Untuk pelanggan WhatsApp, ini terasa terlalu formal dan robotik. Nama di awal juga belum relevan karena pelanggan biasanya ingin menyampaikan kebutuhan dulu.

## Gaya Baru

Bot memakai gaya admin WhatsApp yang singkat, natural, dan tetap sopan:

- tidak menyebut AI, bot, atau asisten di pembuka;
- tetap memakai sapaan `Kak`;
- pertanyaan dibuat pendek dan langsung;
- tidak terlalu banyak menjelaskan proses internal;
- tetap jelas bahwa admin akan lanjut saat harga, jadwal, atau keputusan teknis perlu dibahas.

Contoh pembuka:

```text
Halo Kak, bisa. Mau bikin atau kerjakan apa?
```

## Peran DeepSeek

DeepSeek dipakai sebagai penulis gaya chat, bukan pengambil keputusan bisnis. Conversation engine tetap menentukan:

- field apa yang sedang dikumpulkan;
- kapan pertanyaan wajib harus diulang;
- kapan ringkasan ditampilkan;
- kapan lead dibuat;
- kapan percakapan harus handoff ke admin;
- larangan harga, janji jadwal, diskon, dan klaim kepastian.

Setiap kali engine menghasilkan maksud balasan, DeepSeek boleh menulis ulang menjadi chat admin yang natural. Input ke DeepSeek berisi konteks aman: state percakapan, field yang sedang ditanyakan, ringkasan non-sensitif, dan pesan deterministic yang boleh dijadikan fallback. DeepSeek tidak boleh menerima data sensitif yang tidak diperlukan.

Jika DeepSeek gagal, timeout, menghasilkan jawaban kosong, terlalu panjang, menyebut AI/asisten, menambah harga, menjanjikan jadwal, atau mengubah maksud pertanyaan, sistem memakai fallback pendek yang sudah ditentukan.

## Alur Data Baru

Urutan pertanyaan menjadi:

1. pekerjaan atau barang yang dibutuhkan;
2. lokasi pengerjaan atau pengiriman;
3. ukuran awal;
4. bahan, model, atau contoh;
5. target waktu;
6. foto lokasi atau referensi;
7. nama pelanggan;
8. email opsional;
9. izin email promosi bila email diisi;
10. ringkasan dan konfirmasi.

Nama tetap wajib untuk catatan admin, tetapi ditanyakan dekat akhir:

```text
Boleh tahu nama Kakak untuk catatan admin?
```

## Ringkasan dan Lead

Ringkasan tetap memuat nama, pekerjaan, lokasi, ukuran, bahan atau model, target waktu, foto, email, dan izin email. Struktur lead dan kolom Google Sheets tidak berubah, sehingga sinkronisasi Sheets dan Drive tetap kompatibel.

## Handoff

Pesan handoff dibuat lebih natural, tetapi tetap aman. Bot tidak menyebut kepastian admin membalas secara berlebihan. Untuk pertanyaan harga, jadwal, komplain, permintaan manusia, atau setelah konfirmasi lead, bot mengirim pesan singkat bahwa admin akan cek dan lanjutkan.

## DeepSeek Admin Chat

Instruksi DeepSeek perlu berubah dari sekadar "tulis ulang balasan" menjadi "tulis sebagai admin HIJAOE yang sedang membalas WhatsApp". Model harus:

- membalas singkat, natural, dan tidak kaku;
- memakai bahasa Indonesia sehari-hari yang tetap sopan;
- menjaga satu fokus pertanyaan per balasan;
- tidak memperkenalkan diri sebagai AI, bot, atau asisten;
- tidak menambahkan informasi bisnis baru;
- tidak mengubah field yang sedang ditanyakan;
- tidak memberi harga, kisaran harga, diskon, janji jadwal, atau kepastian pengerjaan.

Contoh target gaya:

```text
Halo Kak, bisa. Mau bikin atau kerjakan apa?
```

```text
Oke Kak. Lokasinya di daerah mana?
```

```text
Siap. Kalau ada foto lokasi atau contoh model, boleh dikirim. Kalau belum ada, ketik lewati.
```

## Pengujian

Test yang perlu diperbarui atau ditambah:

- percakapan baru langsung menanyakan pekerjaan, bukan nama;
- field `name` berada setelah `photo`;
- DeepSeek dipanggil untuk membuat wording natural pada pertanyaan biasa;
- fallback dipakai saat DeepSeek gagal atau melanggar guardrail;
- output DeepSeek yang menyebut AI, bot, asisten, harga, atau janji jadwal ditolak;
- lead tetap berisi nama saat pelanggan mengonfirmasi;
- ringkasan masih berisi semua field lama;
- handoff dan completion tetap tidak memberi harga atau janji jadwal;
- orchestrator tetap mengirim satu balasan pembuka pada pesan pertama.

## Kriteria Selesai

- Pembuka tidak menyebut `Asisten HIJAOE`.
- Bot tidak menanyakan nama di awal.
- Nama ditanyakan setelah foto atau sebelum email.
- Balasan normal ditulis oleh DeepSeek dengan gaya admin WhatsApp.
- Engine tetap menentukan alur, validasi, lead, dan handoff.
- Fallback aman tetap tersedia saat DeepSeek gagal.
- Semua test otomatis tetap lulus.
