const baseImagePath = "assets/images/service-catalog/meja-kursi-sekolah";

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
];

export function getServiceModelCatalog(serviceSlug) {
  return serviceModelCatalogItems.filter(
    (item) => item.serviceSlug === serviceSlug,
  );
}
