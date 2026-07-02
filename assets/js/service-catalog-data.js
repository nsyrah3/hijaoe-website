const serviceCatalogBasePaths = {
  "meja-kursi-sekolah-makassar": "assets/images/service-catalog/meja-kursi-sekolah",
  "kanopi-makassar": "assets/images/service-catalog/kanopi",
};

function catalogItem(serviceSlug, id, title, description, alt) {
  return {
    id,
    serviceSlug,
    title,
    description,
    image: `${serviceCatalogBasePaths[serviceSlug]}/${id}.webp`,
    alt,
    whatsappLabel: title,
  };
}

export const serviceModelCatalogItems = [
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "meja-siswa-single-kayu",
    "Meja Siswa Single Kayu",
    "Meja siswa single dengan permukaan kayu natural dan rangka besi hitam.",
    "Meja siswa single kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "kursi-siswa-kayu",
    "Kursi Siswa Kayu",
    "Kursi siswa kayu natural dengan rangka besi hitam untuk ruang belajar.",
    "Kursi siswa kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "set-meja-kursi-siswa",
    "Set Meja Kursi Siswa",
    "Set meja dan kursi siswa dengan kayu natural dan rangka hitam.",
    "Set meja kursi siswa kayu natural dan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "meja-siswa-double-kayu",
    "Meja Siswa Double Kayu",
    "Meja siswa double untuk dua anak dengan rangka besi hitam.",
    "Meja siswa double kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "meja-guru-sederhana",
    "Meja Guru Sederhana",
    "Meja guru sederhana dengan top kayu natural dan rangka kokoh.",
    "Meja guru sederhana kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "kursi-guru-kayu",
    "Kursi Guru Kayu",
    "Kursi guru kayu natural dengan rangka besi hitam yang kokoh.",
    "Kursi guru kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "set-tk-sd-kayu-natural",
    "Set TK/SD Kayu Natural",
    "Set meja kursi ukuran rendah untuk TK atau SD dengan warna natural.",
    "Set meja kursi TK atau SD kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "meja-panjang-ruang-kelas",
    "Meja Panjang Ruang Kelas",
    "Meja panjang kayu natural untuk belajar kelompok atau ruang kelas.",
    "Meja panjang ruang kelas dengan top kayu natural dan rangka besi hitam",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "meja-lipat-sekolah-kayu",
    "Meja Lipat Sekolah Kayu",
    "Meja lipat sekolah dengan permukaan kayu natural dan kaki besi hitam.",
    "Meja lipat sekolah kayu natural dengan kaki besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-kursi-sekolah-makassar",
    "bangku-panjang-sekolah-kayu",
    "Bangku Panjang Sekolah Kayu",
    "Bangku panjang kayu natural dengan rangka hitam untuk area sekolah.",
    "Bangku panjang sekolah kayu natural dengan rangka besi hitam di area sekolah",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-alderon-carport-minimalis",
    "Kanopi Alderon Carport Minimalis",
    "Kanopi alderon untuk carport rumah dengan rangka besi hollow hitam rapi.",
    "Kanopi alderon carport rumah minimalis dengan rangka besi hollow hitam",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-spandek-teras-rumah",
    "Kanopi Spandek Teras Rumah",
    "Kanopi spandek untuk teras rumah sederhana dengan rangka kokoh dan tampilan bersih.",
    "Kanopi spandek teras rumah sederhana dengan rangka besi hitam yang rapi",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-polikarbonat-transparan",
    "Kanopi Polikarbonat Transparan",
    "Kanopi polikarbonat transparan untuk area yang tetap membutuhkan cahaya alami.",
    "Kanopi polikarbonat transparan dengan rangka besi hitam di halaman rumah",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-baja-ringan-simple",
    "Kanopi Baja Ringan Simple",
    "Kanopi baja ringan sederhana untuk area samping rumah, parkir motor, atau jemuran.",
    "Kanopi baja ringan sederhana dengan atap abu-abu di samping rumah",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-rooftop-dak-terbuka",
    "Kanopi Rooftop / Dak Terbuka",
    "Kanopi untuk rooftop atau dak terbuka agar area atas rumah lebih nyaman digunakan.",
    "Kanopi rooftop rumah tropis dengan rangka besi hitam dan atap modern",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-pergola-minimalis",
    "Kanopi Pergola Minimalis",
    "Kanopi pergola minimalis untuk halaman atau teras dengan tampilan lebih estetik.",
    "Kanopi pergola minimalis di halaman rumah dengan rangka besi hitam modern",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-toko-ruko",
    "Kanopi Toko / Ruko",
    "Kanopi depan toko atau ruko untuk melindungi area masuk dan tampilan usaha.",
    "Kanopi depan toko atau ruko dengan rangka besi hitam dan atap spandek",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-membran-modern",
    "Kanopi Membran Modern",
    "Kanopi membran modern untuk area depan rumah, kafe kecil, atau tempat usaha.",
    "Kanopi membran modern berbentuk lengkung dengan struktur besi rapi",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-carport-dua-mobil",
    "Kanopi Carport Dua Mobil",
    "Kanopi carport luas untuk dua mobil dengan struktur rangka yang lebih kokoh.",
    "Kanopi carport luas untuk dua mobil di depan rumah modern Indonesia",
  ),
  catalogItem(
    "kanopi-makassar",
    "kanopi-samping-rumah-multifungsi",
    "Kanopi Samping Rumah Multifungsi",
    "Kanopi samping rumah untuk area servis, parkir motor, jemuran, atau akses harian.",
    "Kanopi samping rumah multifungsi untuk area servis dan parkir motor",
  ),
];

export function getServiceModelCatalog(serviceSlug) {
  return serviceModelCatalogItems.filter(
    (item) => item.serviceSlug === serviceSlug,
  );
}
