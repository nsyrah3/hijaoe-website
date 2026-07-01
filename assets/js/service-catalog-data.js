const baseImagePath = "assets/images/service-catalog/meja-kursi-sekolah-gallery";

function catalogItem(id, title, description, alt) {
  return {
    id,
    serviceSlug: "meja-kursi-sekolah-makassar",
    title,
    description,
    image: `${baseImagePath}/${id}.webp`,
    alt,
    whatsappLabel: title,
  };
}

export const serviceModelCatalogItems = [
  catalogItem(
    "meja-siswa-single-kayu",
    "Meja Siswa Single Kayu",
    "Meja siswa single dengan permukaan kayu natural dan rangka besi hitam.",
    "Meja siswa single kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "kursi-siswa-kayu",
    "Kursi Siswa Kayu",
    "Kursi siswa kayu natural dengan rangka besi hitam untuk ruang belajar.",
    "Kursi siswa kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "set-meja-kursi-siswa",
    "Set Meja Kursi Siswa",
    "Set meja dan kursi siswa dengan kayu natural dan rangka hitam.",
    "Set meja kursi siswa kayu natural dan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-siswa-double-kayu",
    "Meja Siswa Double Kayu",
    "Meja siswa double untuk dua anak dengan rangka besi hitam.",
    "Meja siswa double kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-guru-sederhana",
    "Meja Guru Sederhana",
    "Meja guru sederhana dengan top kayu natural dan rangka kokoh.",
    "Meja guru sederhana kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "kursi-guru-kayu",
    "Kursi Guru Kayu",
    "Kursi guru kayu natural dengan rangka besi hitam yang kokoh.",
    "Kursi guru kayu natural dengan rangka besi hitam di ruang kelas sederhana",
  ),
  catalogItem(
    "set-tk-sd-kayu-natural",
    "Set TK/SD Kayu Natural",
    "Set meja kursi ukuran rendah untuk TK atau SD dengan warna natural.",
    "Set meja kursi TK atau SD kayu natural dengan rangka besi hitam di ruang kelas",
  ),
  catalogItem(
    "meja-panjang-ruang-kelas",
    "Meja Panjang Ruang Kelas",
    "Meja panjang kayu natural untuk belajar kelompok atau ruang kelas.",
    "Meja panjang ruang kelas dengan top kayu natural dan rangka besi hitam",
  ),
  catalogItem(
    "meja-lipat-sekolah-kayu",
    "Meja Lipat Sekolah Kayu",
    "Meja lipat sekolah dengan permukaan kayu natural dan kaki besi hitam.",
    "Meja lipat sekolah kayu natural dengan kaki besi hitam di ruang kelas",
  ),
  catalogItem(
    "bangku-panjang-sekolah-kayu",
    "Bangku Panjang Sekolah Kayu",
    "Bangku panjang kayu natural dengan rangka hitam untuk area sekolah.",
    "Bangku panjang sekolah kayu natural dengan rangka besi hitam di area sekolah",
  ),
];

export function getServiceModelCatalog(serviceSlug) {
  return serviceModelCatalogItems.filter(
    (item) => item.serviceSlug === serviceSlug,
  );
}
