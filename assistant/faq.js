import { business, services } from "../assets/js/site-data.js";

const serviceNames = services.map((service) => service.title).join(", ");

const FAQ_ENTRIES = [
  {
    key: "hours",
    patterns: [/jam buka/i, /buka hari apa/i, /operasional/i],
    answer: `${business.hours}. ${business.closed}.`,
  },
  {
    key: "service_area",
    patterns: [/melayani daerah/i, /area layanan/i, /luar makassar/i],
    answer:
      "HIJAOE melayani Makassar dan sekitarnya. Pengiriman atau pengerjaan di luar area dibicarakan dulu sesuai kebutuhan, Kak.",
  },
  {
    key: "services",
    patterns: [/layanan apa/i, /bisa bikin apa/i, /kerja apa saja/i],
    answer: `Layanan utama HIJAOE: ${serviceNames}.`,
  },
  {
    key: "workshop_location",
    patterns: [/alamat bengkel/i, /lokasi bengkel/i, /google maps/i],
    answer: `Bengkel HIJAOE berada di ${business.city}. Lokasinya bisa dibuka di ${business.mapUrl}`,
  },
];

const HANDOFF_PATTERNS = [
  /bicara.*admin/i,
  /chat.*admin/i,
  /orangnya/i,
  /manusia/i,
  /hubungkan.*admin/i,
];

const PRICE_PATTERNS = [
  /berapa.*harga/i,
  /harga.*berapa/i,
  /perkiraan.*biaya/i,
  /ongkos.*berapa/i,
];

const SCHEDULE_GUARANTEE_PATTERNS = [
  /bisa dipastikan.*selesai/i,
  /pasti.*selesai/i,
  /jamin.*selesai/i,
  /kepastian.*jadwal/i,
];

export function findFaq(message) {
  return (
    FAQ_ENTRIES.find((entry) =>
      entry.patterns.some((pattern) => pattern.test(message)),
    ) || null
  );
}

export function detectHandoffRequest(message) {
  return HANDOFF_PATTERNS.some((pattern) => pattern.test(message));
}

export function detectRestrictedIntent(message) {
  if (PRICE_PATTERNS.some((pattern) => pattern.test(message))) {
    return "Pelanggan menanyakan harga";
  }

  if (
    SCHEDULE_GUARANTEE_PATTERNS.some((pattern) => pattern.test(message))
  ) {
    return "Pelanggan meminta kepastian jadwal";
  }

  return null;
}
