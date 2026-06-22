import { catalogItems, featuredCatalogIds } from "./catalog-data.js";

export const business = {
  name: "HIJAOE",
  tagline: "Dari bengkel, menjadi bagian dari bangunan Anda.",
  phoneDisplay: "0897-6010-103",
  phoneInternational: "628976010103",
  hours: "Senin-Sabtu, 08.00-17.00",
  closed: "Minggu tutup",
  city: "Makassar",
  serviceCities: ["Makassar", "Gowa", "Maros"],
  serviceAreaTitle: "Melayani Makassar, Gowa, Maros, dan sekitarnya.",
  serviceArea:
    "Pengerjaan dan layanan tersedia untuk wilayah Makassar, Gowa, Maros, serta area sekitarnya sesuai kebutuhan.",
  mapUrl:
    "https://www.google.com/maps/place/HIJAOE/@-5.0853324,119.5224587,15z/data=!3m1!4b1!4m6!3m5!1s0x2dbefbcbfcf97c0b:0xb8cad84f65c55a60!8m2!3d-5.0853325!4d119.5327585!16s%2Fg%2F11g0vyt5dz",
};

export const services = [
  {
    icon: "hard-hat",
    title: "Konstruksi & Renovasi",
    description: "Pekerjaan bangunan untuk rumah, toko, sekolah, dan usaha.",
    items: [
      "Bangun dan renovasi rumah",
      "Pondasi dan pekerjaan beton",
      "Keramik, pengecatan, dan teras",
      "Gudang dan bangunan rangka besi",
    ],
  },
  {
    icon: "anvil",
    title: "Besi & Las",
    description: "Pembuatan dan perbaikan konstruksi besi sesuai ukuran.",
    items: [
      "Pagar, teralis, dan gerbang",
      "Railing, tangga, dan mezanin",
      "Rak, ranjang, dan dudukan tandon",
      "Jasa las dan perbaikan",
    ],
  },
  {
    icon: "panels-top-left",
    title: "Aluminium & Kaca",
    description: "Solusi aluminium dan kaca untuk rumah maupun tempat usaha.",
    items: [
      "Kusen, pintu, dan jendela",
      "Etalase dan storefront",
      "Pintu geser dan pintu lipat",
      "Kaca tempered dan kawat nyamuk",
    ],
  },
  {
    icon: "warehouse",
    title: "Atap & Kanopi",
    description: "Pemasangan penutup dan pelindung area luar bangunan.",
    items: [
      "Kanopi dan rangka baja ringan",
      "Spandek, polikarbonat, dan alderon",
      "Kanopi membran dan pergola",
      "Talang air dan perbaikan atap bocor",
    ],
  },
  {
    icon: "panel-top",
    title: "Plafon & Partisi",
    description: "Pemisah ruang dan plafon interior untuk rumah maupun usaha.",
    items: [
      "Plafon PVC dan gypsum",
      "Drop ceiling dan plafon kamar",
      "Partisi kaca dan aluminium",
      "Partisi kalsiboard, gypsum, dan PVC",
    ],
  },
  {
    icon: "layout-dashboard",
    title: "Interior & Furnitur",
    description: "Pekerjaan custom yang menyesuaikan ruang dan kebutuhan.",
    items: [
      "Kitchen set dan kabinet aluminium",
      "Lemari, rak sepatu, dan rak piring",
      "Meja dan kursi sekolah",
      "Wall panel, ACP, booth, dan display",
    ],
  },
];

export const projects = featuredCatalogIds.map((id) => {
  const catalogItem = catalogItems.find((item) => item.id === id);

  return {
    id: catalogItem.id,
    title: catalogItem.title,
    category: catalogItem.categoryLabel,
    image: catalogItem.image,
    alt: catalogItem.alt,
  };
});

export const processSteps = [
  {
    title: "Konsultasi",
    description: "Kirim kebutuhan, ukuran awal, lokasi, dan foto referensi melalui WhatsApp.",
  },
  {
    title: "Survei & Ukur",
    description: "Detail lokasi dan ukuran diperiksa agar pekerjaan sesuai kondisi lapangan.",
  },
  {
    title: "Penawaran",
    description: "Bahan, lingkup pekerjaan, biaya, dan jadwal disepakati sebelum produksi.",
  },
  {
    title: "Pengerjaan",
    description: "Pesanan dikerjakan di bengkel atau langsung di lokasi sesuai jenis proyek.",
  },
  {
    title: "Pasang & Serah Terima",
    description: "Hasil dikirim atau dipasang, kemudian diperiksa bersama pelanggan.",
  },
];

export const serviceAreas = [
  {
    city: "Makassar",
    note: "Area utama layanan HIJAOE",
  },
  {
    city: "Gowa",
    note: "Pengerjaan sesuai kebutuhan dan kesepakatan",
  },
  {
    city: "Maros",
    note: "Pengerjaan sesuai kebutuhan dan kesepakatan",
  },
];

export function buildWhatsAppUrl(message) {
  return `https://wa.me/${business.phoneInternational}?text=${encodeURIComponent(message)}`;
}
