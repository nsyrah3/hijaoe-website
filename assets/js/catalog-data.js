export const catalogCategories = [
  {
    id: "konstruksi-renovasi",
    label: "Konstruksi & Renovasi",
    filterLabel: "Konstruksi",
  },
  { id: "besi-las", label: "Besi & Las" },
  { id: "aluminium-kaca", label: "Aluminium & Kaca" },
  { id: "atap-kanopi", label: "Atap & Kanopi" },
  { id: "plafon-partisi", label: "Plafon & Partisi" },
  { id: "interior-furnitur", label: "Interior & Furnitur" },
];

const categoryLabelById = Object.fromEntries(
  catalogCategories.map((category) => [category.id, category.label]),
);

function catalogItem(id, title, category, alt) {
  return {
    id,
    title,
    category,
    categoryLabel: categoryLabelById[category],
    image: `assets/images/catalog/${id}.webp`,
    alt,
  };
}

export const catalogItems = [
  catalogItem(
    "renovasi-fasad-rumah",
    "Renovasi Fasad Rumah",
    "konstruksi-renovasi",
    "Renovasi fasad rumah sederhana dengan pekerjaan plester dan pengecatan eksterior",
  ),
  catalogItem(
    "penambahan-teras",
    "Penambahan Teras",
    "konstruksi-renovasi",
    "Penambahan teras rumah dengan struktur beton dan finishing rapi",
  ),
  catalogItem(
    "gudang-rangka-besi",
    "Gudang Rangka Besi",
    "konstruksi-renovasi",
    "Gudang semi permanen dengan rangka besi dan penutup atap metal",
  ),
  catalogItem(
    "mezanin-toko",
    "Mezanin Toko",
    "konstruksi-renovasi",
    "Mezanin toko dengan rangka besi untuk menambah ruang penyimpanan",
  ),
  catalogItem(
    "bangunan-tambahan-rumah",
    "Bangunan Tambahan Rumah",
    "konstruksi-renovasi",
    "Bangunan tambahan rumah untuk perluasan ruang keluarga atau area usaha",
  ),
  catalogItem(
    "pemasangan-keramik",
    "Pemasangan Keramik",
    "konstruksi-renovasi",
    "Pemasangan keramik lantai rumah dengan pola rapi dan permukaan rata",
  ),
  catalogItem(
    "pondasi-dan-cor",
    "Pekerjaan Pondasi dan Cor",
    "konstruksi-renovasi",
    "Pekerjaan pondasi dan pengecoran lantai untuk bangunan sederhana",
  ),
  catalogItem(
    "renovasi-ruang-usaha",
    "Renovasi Ruang Usaha",
    "konstruksi-renovasi",
    "Renovasi ruang usaha kecil dengan perbaikan dinding lantai dan fasad",
  ),
  catalogItem(
    "pengecatan-eksterior",
    "Pengecatan Eksterior",
    "konstruksi-renovasi",
    "Pengecatan eksterior rumah dengan persiapan permukaan dan hasil bersih",
  ),
  catalogItem(
    "pembangunan-rumah-sederhana",
    "Pembangunan Rumah Sederhana",
    "konstruksi-renovasi",
    "Pembangunan rumah sederhana dengan pekerjaan struktur bata dan atap",
  ),

  catalogItem(
    "pagar-geser-besi",
    "Pagar Geser Besi",
    "besi-las",
    "Pagar geser besi modern untuk rumah dengan rel dan rangka kuat",
  ),
  catalogItem(
    "pagar-laser-cutting",
    "Pagar Laser Cutting",
    "besi-las",
    "Pagar besi motif laser cutting untuk fasad rumah dan gerbang",
  ),
  catalogItem(
    "teralis-jendela",
    "Teralis Jendela",
    "besi-las",
    "Teralis jendela besi dengan pola sederhana untuk keamanan rumah",
  ),
  catalogItem(
    "railing-tangga",
    "Railing Tangga",
    "besi-las",
    "Railing tangga besi untuk rumah dengan pegangan kokoh dan rapi",
  ),
  catalogItem(
    "tangga-besi",
    "Tangga Besi",
    "besi-las",
    "Tangga besi custom untuk rumah toko atau area kerja bertingkat",
  ),
  catalogItem(
    "rak-gudang",
    "Rak Gudang",
    "besi-las",
    "Rak gudang besi bertingkat untuk penyimpanan barang berat",
  ),
  catalogItem(
    "ranjang-besi",
    "Ranjang Besi",
    "besi-las",
    "Ranjang besi custom dengan rangka kuat untuk kamar atau asrama",
  ),
  catalogItem(
    "dudukan-tandon",
    "Dudukan Tandon",
    "besi-las",
    "Dudukan tandon air dari rangka besi dengan konstruksi stabil",
  ),
  catalogItem(
    "gerobak-booth-besi",
    "Gerobak atau Booth Besi",
    "besi-las",
    "Gerobak jualan atau booth usaha kecil dengan rangka besi custom",
  ),
  catalogItem(
    "rangka-papan-nama",
    "Rangka Papan Nama",
    "besi-las",
    "Rangka papan nama atau neon box toko dari besi untuk fasad usaha",
  ),

  catalogItem(
    "lemari-aluminium",
    "Lemari Aluminium",
    "aluminium-kaca",
    "Lemari aluminium custom untuk penyimpanan rumah yang tahan lembap",
  ),
  catalogItem(
    "jendela-aluminium",
    "Jendela Aluminium",
    "aluminium-kaca",
    "Jendela aluminium rumah dengan kaca bening dan rangka hitam rapi",
  ),
  catalogItem(
    "pintu-aluminium",
    "Pintu Aluminium",
    "aluminium-kaca",
    "Pintu aluminium untuk rumah toko atau ruangan dengan rangka kokoh",
  ),
  catalogItem(
    "pintu-geser-aluminium",
    "Pintu Geser Aluminium",
    "aluminium-kaca",
    "Pintu geser aluminium dan kaca untuk akses teras atau pembatas ruangan",
  ),
  catalogItem(
    "kusen-aluminium",
    "Kusen Aluminium",
    "aluminium-kaca",
    "Kusen aluminium untuk pintu dan jendela dengan pemasangan presisi",
  ),
  catalogItem(
    "etalase-aluminium-kaca",
    "Etalase Aluminium dan Kaca",
    "aluminium-kaca",
    "Etalase aluminium dan kaca untuk toko warung atau ruang pajangan",
  ),
  catalogItem(
    "storefront-toko",
    "Storefront Toko",
    "aluminium-kaca",
    "Tampilan depan toko dengan pintu kaca dan rangka aluminium",
  ),
  catalogItem(
    "pintu-lipat-aluminium-kaca",
    "Pintu Lipat Aluminium dan Kaca",
    "aluminium-kaca",
    "Pintu lipat aluminium dan kaca untuk teras toko atau pembatas ruangan",
  ),
  catalogItem(
    "pintu-kamar-mandi-aluminium",
    "Pintu Kamar Mandi Aluminium",
    "aluminium-kaca",
    "Pintu kamar mandi aluminium untuk rumah dengan bahan tahan lembap",
  ),
  catalogItem(
    "kawat-nyamuk-aluminium",
    "Kawat Nyamuk Aluminium",
    "aluminium-kaca",
    "Kawat nyamuk pada pintu dan jendela aluminium untuk rumah",
  ),

  catalogItem(
    "kanopi-alderon",
    "Kanopi Alderon",
    "atap-kanopi",
    "Kanopi alderon untuk carport rumah dengan rangka besi rapi",
  ),
  catalogItem(
    "kanopi-polikarbonat",
    "Kanopi Polikarbonat",
    "atap-kanopi",
    "Kanopi polikarbonat transparan untuk teras atau garasi rumah",
  ),
  catalogItem(
    "kanopi-spandek",
    "Kanopi Spandek",
    "atap-kanopi",
    "Kanopi spandek dengan rangka besi untuk halaman atau tempat usaha",
  ),
  catalogItem(
    "kanopi-membran",
    "Kanopi Membran",
    "atap-kanopi",
    "Kanopi membran putih untuk teras cafe halaman rumah atau area usaha",
  ),
  catalogItem(
    "rangka-atap-baja-ringan",
    "Rangka Atap Baja Ringan",
    "atap-kanopi",
    "Rangka atap baja ringan untuk rumah dengan pemasangan terukur",
  ),
  catalogItem(
    "atap-spandek-rumah",
    "Atap Spandek Rumah",
    "atap-kanopi",
    "Pemasangan atap spandek untuk teras samping atau bangunan tambahan rumah",
  ),
  catalogItem(
    "talang-air",
    "Talang Air",
    "atap-kanopi",
    "Talang air hujan untuk atap rumah dengan jalur pembuangan rapi",
  ),
  catalogItem(
    "pergola-besi",
    "Pergola Besi",
    "atap-kanopi",
    "Pergola besi untuk teras atau taman rumah dengan kisi-kisi dekoratif",
  ),
  catalogItem(
    "carport-beratap",
    "Carport Beratap",
    "atap-kanopi",
    "Carport beratap dengan rangka besi dan penutup atap untuk kendaraan",
  ),
  catalogItem(
    "perbaikan-atap-bocor",
    "Perbaikan Atap Bocor",
    "atap-kanopi",
    "Perbaikan area atap bocor talang dan sambungan penutup atap rumah",
  ),

  catalogItem(
    "plafon-pvc",
    "Plafon PVC",
    "plafon-partisi",
    "Plafon PVC untuk ruangan rumah dengan panel rapi dan mudah dibersihkan",
  ),
  catalogItem(
    "plafon-gypsum",
    "Plafon Gypsum",
    "plafon-partisi",
    "Plafon gypsum untuk ruang keluarga kamar atau toko dengan finishing halus",
  ),
  catalogItem(
    "plafon-drop-ceiling",
    "Plafon Drop Ceiling",
    "plafon-partisi",
    "Plafon drop ceiling gypsum dengan lampu tanam untuk ruang tamu atau toko",
  ),
  catalogItem(
    "plafon-minimalis-ruang-tamu",
    "Plafon Minimalis Ruang Tamu",
    "plafon-partisi",
    "Plafon minimalis ruang tamu dengan garis bersih dan pencahayaan sederhana",
  ),
  catalogItem(
    "plafon-kamar-tidur",
    "Plafon Kamar Tidur",
    "plafon-partisi",
    "Perbaikan atau pemasangan plafon kamar tidur dengan finishing rapi",
  ),
  catalogItem(
    "partisi-kaca",
    "Partisi Kaca",
    "plafon-partisi",
    "Partisi kaca aluminium untuk membagi ruang kantor rumah atau toko",
  ),
  catalogItem(
    "partisi-kalsiboard",
    "Partisi Kalsiboard",
    "plafon-partisi",
    "Partisi kalsiboard untuk membagi ruangan rumah toko atau area kerja",
  ),
  catalogItem(
    "partisi-gypsum",
    "Partisi Gypsum",
    "plafon-partisi",
    "Partisi gypsum dengan permukaan halus untuk pembagian ruang interior",
  ),
  catalogItem(
    "partisi-pvc",
    "Partisi PVC",
    "plafon-partisi",
    "Partisi PVC ringan untuk sekat ruangan yang mudah dibersihkan",
  ),
  catalogItem(
    "sekat-ruangan-custom",
    "Sekat Ruangan Custom",
    "plafon-partisi",
    "Sekat ruangan custom dengan panel dan rangka sesuai ukuran lokasi",
  ),

  catalogItem(
    "kitchen-set-aluminium",
    "Kitchen Set Aluminium",
    "interior-furnitur",
    "Kitchen set aluminium untuk dapur rumah dengan kabinet custom",
  ),
  catalogItem(
    "kabinet-dapur-aluminium",
    "Kabinet Dapur Aluminium",
    "interior-furnitur",
    "Kabinet dapur aluminium custom untuk penyimpanan alat masak",
  ),
  catalogItem(
    "rak-piring-aluminium",
    "Rak Piring Aluminium",
    "interior-furnitur",
    "Rak piring aluminium untuk dapur rumah dengan susunan rapi",
  ),
  catalogItem(
    "rak-sepatu-aluminium",
    "Rak Sepatu Aluminium",
    "interior-furnitur",
    "Rak sepatu aluminium custom untuk teras atau ruang masuk rumah",
  ),
  catalogItem(
    "meja-sekolah",
    "Meja Sekolah",
    "interior-furnitur",
    "Meja sekolah kayu dengan rangka kuat untuk ruang kelas",
  ),
  catalogItem(
    "kursi-sekolah",
    "Kursi Sekolah",
    "interior-furnitur",
    "Kursi sekolah kayu dengan rangka kokoh untuk ruang belajar",
  ),
  catalogItem(
    "meja-rangka-besi",
    "Meja Rangka Besi",
    "interior-furnitur",
    "Meja custom dengan rangka besi untuk rumah kantor atau warung",
  ),
  catalogItem(
    "rak-display-toko",
    "Rak Display Toko",
    "interior-furnitur",
    "Rak display toko untuk pajangan barang dagangan dengan rangka kuat",
  ),
  catalogItem(
    "wall-panel",
    "Wall Panel",
    "interior-furnitur",
    "Pemasangan wall panel untuk memperindah dinding rumah atau ruang usaha",
  ),
  catalogItem(
    "booth-kios-usaha",
    "Booth atau Kios Usaha",
    "interior-furnitur",
    "Booth atau kios usaha kecil dengan rangka dan panel custom",
  ),
];

export const featuredCatalogIds = [
  "lemari-aluminium",
  "partisi-kalsiboard",
  "pagar-geser-besi",
  "kanopi-alderon",
  "kitchen-set-aluminium",
  "renovasi-fasad-rumah",
];
