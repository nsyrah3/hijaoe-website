function catalogItem(serviceSlug, baseImagePath, id, title, description, alt) {
  return {
    id,
    serviceSlug,
    title,
    description,
    image: `${baseImagePath}/${id}.webp`,
    alt,
    whatsappLabel: title,
  };
}

function catalogSection(serviceSlug, heading, ctaLabel, baseImagePath, items) {
  return {
    serviceSlug,
    heading,
    ctaLabel,
    items: items.map(([id, title, description, alt]) =>
      catalogItem(serviceSlug, baseImagePath, id, title, description, alt),
    ),
  };
}

export const serviceModelCatalogSections = [
  catalogSection(
    "meja-kursi-sekolah-makassar",
    "Inspirasi Model Meja & Kursi Sekolah",
    "Konsultasi model meja kursi sekolah",
    "assets/images/service-catalog/meja-kursi-sekolah-gallery",
    [
      [
        "meja-siswa-single-kayu",
        "Meja Siswa Single Kayu",
        "Meja siswa single dengan permukaan kayu natural dan rangka besi hitam.",
        "Meja siswa single kayu natural dengan rangka besi hitam di ruang kelas sederhana",
      ],
      [
        "kursi-siswa-kayu",
        "Kursi Siswa Kayu",
        "Kursi siswa kayu natural dengan rangka besi hitam untuk ruang belajar.",
        "Kursi siswa kayu natural dengan rangka besi hitam di ruang kelas sederhana",
      ],
      [
        "set-meja-kursi-siswa",
        "Set Meja Kursi Siswa",
        "Set meja dan kursi siswa dengan kayu natural dan rangka hitam.",
        "Set meja kursi siswa kayu natural dan rangka besi hitam di ruang kelas",
      ],
      [
        "meja-siswa-double-kayu",
        "Meja Siswa Double Kayu",
        "Meja siswa double untuk dua anak dengan rangka besi hitam.",
        "Meja siswa double kayu natural dengan rangka besi hitam di ruang kelas",
      ],
      [
        "meja-guru-sederhana",
        "Meja Guru Sederhana",
        "Meja guru sederhana dengan top kayu natural dan rangka kokoh.",
        "Meja guru sederhana kayu natural dengan rangka besi hitam di ruang kelas",
      ],
      [
        "kursi-guru-kayu",
        "Kursi Guru Kayu",
        "Kursi guru kayu natural dengan rangka besi hitam yang kokoh.",
        "Kursi guru kayu natural dengan rangka besi hitam di ruang kelas sederhana",
      ],
      [
        "set-tk-sd-kayu-natural",
        "Set TK/SD Kayu Natural",
        "Set meja kursi ukuran rendah untuk TK atau SD dengan warna natural.",
        "Set meja kursi TK atau SD kayu natural dengan rangka besi hitam di ruang kelas",
      ],
      [
        "meja-panjang-ruang-kelas",
        "Meja Panjang Ruang Kelas",
        "Meja panjang kayu natural untuk belajar kelompok atau ruang kelas.",
        "Meja panjang ruang kelas dengan top kayu natural dan rangka besi hitam",
      ],
      [
        "meja-lipat-sekolah-kayu",
        "Meja Lipat Sekolah Kayu",
        "Meja lipat sekolah dengan permukaan kayu natural dan kaki besi hitam.",
        "Meja lipat sekolah kayu natural dengan kaki besi hitam di ruang kelas",
      ],
      [
        "bangku-panjang-sekolah-kayu",
        "Bangku Panjang Sekolah Kayu",
        "Bangku panjang kayu natural dengan rangka hitam untuk area sekolah.",
        "Bangku panjang sekolah kayu natural dengan rangka besi hitam di area sekolah",
      ],
    ],
  ),
  catalogSection(
    "pagar-besi-makassar",
    "Inspirasi Model Pagar Besi",
    "Konsultasi model pagar besi",
    "assets/images/service-catalog/pagar-besi-gallery",
    [
      [
        "pagar-besi-minimalis-hollow",
        "Pagar Besi Minimalis Hollow",
        "Pagar besi hollow hitam dengan susunan vertikal yang rapi untuk fasad rumah.",
        "Pagar besi minimalis hollow warna hitam di depan rumah modern sederhana",
      ],
      [
        "pagar-besi-geser-minimalis",
        "Pagar Besi Geser Minimalis",
        "Pagar geser minimalis dengan bilah horizontal hitam untuk bukaan rumah.",
        "Pagar besi geser minimalis warna hitam dengan rel pada halaman rumah",
      ],
      [
        "pagar-besi-kombinasi-plat",
        "Pagar Besi Kombinasi Plat",
        "Pagar kombinasi rangka dan plat hitam untuk tampilan lebih tertutup.",
        "Pagar besi kombinasi plat hitam dengan rangka pada fasad rumah modern",
      ],
      [
        "pagar-besi-lipat-ruko",
        "Pagar Besi Lipat Ruko",
        "Pagar besi lipat untuk bukaan lebar pada garasi, ruko, atau area usaha.",
        "Pagar besi lipat hitam pada bukaan lebar garasi atau ruko modern",
      ],
      [
        "pagar-besi-laser-cut",
        "Pagar Besi Laser Cut",
        "Pagar besi hitam dengan aksen panel laser cut untuk tampilan dekoratif.",
        "Pagar besi hitam dengan panel motif laser cut di depan rumah modern",
      ],
      [
        "pagar-besi-klasik-modern",
        "Pagar Besi Klasik Modern",
        "Pagar besi hitam bergaya klasik modern dengan detail vertikal kokoh.",
        "Pagar besi klasik modern warna hitam dengan detail vertikal di rumah",
      ],
      [
        "pagar-besi-kombinasi-kayu",
        "Pagar Besi Kombinasi Kayu",
        "Pagar besi hitam dengan aksen kayu natural untuk fasad yang lebih hangat.",
        "Pagar besi hitam kombinasi kayu natural di depan rumah modern tropis",
      ],
      [
        "pagar-besi-tinggi-privasi",
        "Pagar Besi Tinggi Privasi",
        "Pagar besi tinggi dengan kerapatan rapat untuk kebutuhan privasi rumah.",
        "Pagar besi tinggi warna hitam dengan susunan rapat untuk privasi rumah",
      ],
      [
        "pagar-besi-bengkel-preview",
        "Pagar Besi Bengkel Preview",
        "Preview pagar besi hitam di area bengkel sebelum dibawa ke lokasi.",
        "Pagar besi hitam di area bengkel sebagai contoh model sebelum pemasangan",
      ],
      [
        "pagar-besi-gerbang-lebar",
        "Pagar Besi Gerbang Lebar",
        "Pagar gerbang lebar dengan garis horizontal hitam untuk akses kendaraan.",
        "Pagar besi gerbang lebar warna hitam dengan bukaan kendaraan di rumah",
      ],
    ],
  ),
  catalogSection(
    "kanopi-makassar",
    "Inspirasi Model Kanopi",
    "Konsultasi model kanopi",
    "assets/images/service-catalog/kanopi-gallery",
    [
      [
        "kanopi-alderon-carport-minimalis",
        "Kanopi Alderon Carport Minimalis",
        "Kanopi alderon untuk carport rumah dengan rangka besi hollow hitam rapi.",
        "Kanopi alderon carport rumah minimalis dengan rangka besi hollow hitam",
      ],
      [
        "kanopi-spandek-teras-rumah",
        "Kanopi Spandek Teras Rumah",
        "Kanopi spandek untuk teras rumah sederhana dengan rangka kokoh dan tampilan bersih.",
        "Kanopi spandek teras rumah sederhana dengan rangka besi hitam yang rapi",
      ],
      [
        "kanopi-polikarbonat-transparan",
        "Kanopi Polikarbonat Transparan",
        "Kanopi polikarbonat transparan untuk area yang tetap membutuhkan cahaya alami.",
        "Kanopi polikarbonat transparan dengan rangka besi hitam di halaman rumah",
      ],
      [
        "kanopi-baja-ringan-simple",
        "Kanopi Baja Ringan Simple",
        "Kanopi baja ringan sederhana untuk area samping rumah, parkir motor, atau jemuran.",
        "Kanopi baja ringan sederhana dengan atap abu-abu di samping rumah",
      ],
      [
        "kanopi-rooftop-dak-terbuka",
        "Kanopi Rooftop / Dak Terbuka",
        "Kanopi untuk rooftop atau dak terbuka agar area atas rumah lebih nyaman digunakan.",
        "Kanopi rooftop rumah tropis dengan rangka besi hitam dan atap modern",
      ],
      [
        "kanopi-pergola-minimalis",
        "Kanopi Pergola Minimalis",
        "Kanopi pergola minimalis untuk halaman atau teras dengan tampilan lebih estetik.",
        "Kanopi pergola minimalis di halaman rumah dengan rangka besi hitam modern",
      ],
      [
        "kanopi-toko-ruko",
        "Kanopi Toko / Ruko",
        "Kanopi depan toko atau ruko untuk melindungi area masuk dan tampilan usaha.",
        "Kanopi depan toko atau ruko dengan rangka besi hitam dan atap spandek",
      ],
      [
        "kanopi-membran-modern",
        "Kanopi Membran Modern",
        "Kanopi membran modern untuk area depan rumah, kafe kecil, atau tempat usaha.",
        "Kanopi membran modern berbentuk lengkung dengan struktur besi rapi",
      ],
      [
        "kanopi-carport-dua-mobil",
        "Kanopi Carport Dua Mobil",
        "Kanopi carport luas untuk dua mobil dengan struktur rangka yang lebih kokoh.",
        "Kanopi carport luas untuk dua mobil di depan rumah modern Indonesia",
      ],
      [
        "kanopi-samping-rumah-multifungsi",
        "Kanopi Samping Rumah Multifungsi",
        "Kanopi samping rumah untuk area servis, parkir motor, jemuran, atau akses harian.",
        "Kanopi samping rumah multifungsi untuk area servis dan parkir motor",
      ],
    ],
  ),
];

export const serviceModelCatalogItems = serviceModelCatalogSections.flatMap(
  (section) => section.items,
);

export function getServiceModelCatalogSection(serviceSlug) {
  return serviceModelCatalogSections.find(
    (section) => section.serviceSlug === serviceSlug,
  );
}

export function getServiceModelCatalog(serviceSlug) {
  return getServiceModelCatalogSection(serviceSlug)?.items ?? [];
}
